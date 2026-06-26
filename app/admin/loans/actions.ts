'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import {
    bulkLoanActionSchema,
    processReturnSchema,
} from '@/lib/schemas/loanSchema'
import { notifyAndLog } from '@/lib/serverNotify'
import { formatThaiDate } from '@/lib/formatThaiDate'

// ─── Queries (used by Server Component) ──────────────────────────────────────

/**
 * ดึงคำขอยืมทั้งหมด (ทุกสถานะ) สำหรับ Server Component
 */
export async function getLoanRequests() {
    const adminClient = createAdminClient()
    // order by status first then created_at ─ matches idx_loan_requests_status_created
    // ดึง pending+approved (active) ก่อน แล้วตามด้วย rejected+returned (historical)
    const [activeRes, histRes] = await Promise.all([
        adminClient
            .from('loanRequests')
            .select('*, profiles!fk_loanrequests_profiles(first_name,last_name,email,avatar_url), equipment(name,equipment_number,images)')
            .in('status', ['pending', 'approved'])
            .order('created_at', { ascending: false })
            .limit(80),
        adminClient
            .from('loanRequests')
            .select('*, profiles!fk_loanrequests_profiles(first_name,last_name,email,avatar_url), equipment(name,equipment_number,images)')
            .in('status', ['rejected', 'returned'])
            .order('created_at', { ascending: false })
            .limit(70),
    ])

    if (activeRes.error) console.error('[getLoanRequests:active]', activeRes.error)
    if (histRes.error) console.error('[getLoanRequests:hist]', histRes.error)

    return [...(activeRes.data ?? []), ...(histRes.data ?? [])]
}

/**
 * ดึงเฉพาะรายการที่กำลังยืมอยู่ (status = approved) สำหรับ Server Component
 */
export async function getActiveLoans() {
    const adminClient = createAdminClient()
    // idx_loan_requests_approved partial index covers status='approved' + end_date sort
    const { data, error } = await adminClient
        .from('loanRequests')
        .select('*, profiles!fk_loanrequests_profiles(first_name,last_name,email,phone_number,avatar_url), equipment(id,name,equipment_number,images)')
        .eq('status', 'approved')
        .order('end_date', { ascending: true })
        .limit(200)

    if (error) {
        console.error('[getActiveLoans]', error)
        return []
    }
    return data ?? []
}

// ─── Mutations (Server Actions) ───────────────────────────────────────────────

export async function approveLoanRequests(loanIds: string[]) {
    console.log('[approveLoanRequests] Start for loanIds:', loanIds)
    // 1. Zod Validation
    const parsed = bulkLoanActionSchema.safeParse({ loanIds })
    if (!parsed.success) {
        console.log('[approveLoanRequests] Zod validation failed:', parsed.error)
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Auth Guard (ต้องการสิทธิ์ staff ขึ้นไป)
    const auth = await requireStaff()
    if (auth.error) {
        console.log('[approveLoanRequests] Auth error:', auth.error)
        return { error: auth.error }
    }
    console.log('[approveLoanRequests] Auth success:', auth.user?.id)

    const adminClient = createAdminClient()

    // 2.5 Concurrency Check: Ensure all requested equipment is still 'ready'
    const { data: requestedLoans, error: checkError } = await adminClient
        .from('loanRequests')
        .select(`
            id,
            user_id,
            equipment:equipment_id(id, status, name)
        `)
        .in('id', parsed.data.loanIds)

    if (checkError) {
        console.error('[approveLoanRequests] Concurrency check error:', checkError)
        return { error: checkError.message }
    }
    console.log('[approveLoanRequests] Concurrency check passed, found loans:', requestedLoans?.length)

    const unavailableItems = requestedLoans?.filter((loan: any) => loan.equipment?.status !== 'ready')
    if (unavailableItems && unavailableItems.length > 0) {
        const names = unavailableItems.map((l: any) => l.equipment?.name).join(', ')
        console.log('[approveLoanRequests] Unavailable items found:', names)
        return { error: `ไม่สามารถอนุมัติได้: อุปกรณ์ต่อไปนี้ไม่ว่างแล้ว (${names})` }
    }

    // [HOTFIX] Ensure all borrowers' profiles are 'approved' before approving their loan requests.
    // This prevents the 'USER_NOT_APPROVED' database trigger from rejecting the transaction
    // for legacy users who were created before the auto-approve flow was introduced.
    const userIds = requestedLoans?.map(l => l.user_id).filter(Boolean) || []
    if (userIds.length > 0) {
        await adminClient
            .from('profiles')
            .update({ status: 'approved' })
            .in('id', userIds)
            .eq('status', 'pending')
    }

    // 3. Update
    const { data: updatedLoans, error } = await adminClient
        .from('loanRequests')
        .update({ status: 'approved', approved_by: auth.user!.id })
        .in('id', parsed.data.loanIds)
        .select(`
            id,
            user_id,
            start_date,
            end_date,
            equipment:equipment_id(name, equipment_number),
            profiles!fk_loanrequests_profiles(user_id, first_name, last_name)
        `)

    if (error) return { error: error.message }

    // 4. Get staff role for activity log
    const { data: staffProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', auth.user!.id)
        .single()
    const staffRole = (staffProfile?.role as 'staff' | 'admin') ?? 'staff'

    // 5. Notify + Log for each approved loan (parallel per loan)
    if (updatedLoans && updatedLoans.length > 0) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        await Promise.allSettled(
            (updatedLoans as any[]).map(async (loan) => {
                const equipmentName = loan.equipment?.name || ''
                const equipmentNumber = loan.equipment?.equipment_number || ''
                const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim()
                const studentId = loan.profiles?.user_id

                await notifyAndLog({
                    eventKey: 'loan_approved',
                    discordMessage:
                        `✅ **อนุมัติคำขอยืม (Admin)**\n\n` +
                        `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
                        `👤 **ผู้ยืม:** ${borrowerName}\n` +
                        `📅 **วันที่:** ${formatThaiDate(loan.start_date)} - ${formatThaiDate(loan.end_date)}\n` +
                        `👑 **อนุมัติโดย:** Admin\n` +
                        `🔗 [ดูรายการยืมของฉัน](${appUrl}/my-loans)`,
                    discordType: 'loan',
                    welpruUserIds: studentId ? [studentId] : [],
                    welpruVariables: { equipment: equipmentName, borrower: borrowerName },
                    welpruLink: `${appUrl}/my-loans`,
                    activity: {
                        staffId: auth.user!.id,
                        staffRole,
                        actionType: 'approve_loan',
                        targetType: 'loan',
                        targetId: loan.id,
                        targetUserId: loan.user_id,
                        isSelfAction: loan.user_id === auth.user!.id,
                    },
                })
            })
        )
    }

    revalidatePath('/admin/loans')
    return { success: true, count: parsed.data.loanIds.length }
}

/**
 * ปฏิเสธคำขอยืมหลายรายการพร้อมกัน (Bulk Reject)
 */
export async function rejectLoanRequests(loanIds: string[]) {
    // 1. Zod Validation
    const parsed = bulkLoanActionSchema.safeParse({ loanIds })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Auth Guard
    const auth = await requireStaff()
    if (auth.error) return { error: auth.error }

    // 3. Update
    const adminClient = createAdminClient()
    const { data: updatedLoans, error } = await adminClient
        .from('loanRequests')
        .update({ status: 'rejected', approved_by: auth.user!.id })
        .in('id', parsed.data.loanIds)
        .select(`
            id,
            user_id,
            equipment:equipment_id(name, equipment_number),
            profiles!fk_loanrequests_profiles(user_id, first_name, last_name)
        `)

    if (error) return { error: error.message }

    // 4. Get staff role
    const { data: staffProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', auth.user!.id)
        .single()
    const staffRole = (staffProfile?.role as 'staff' | 'admin') ?? 'staff'

    // 5. Notify + Log for each rejected loan (parallel)
    if (updatedLoans && updatedLoans.length > 0) {
        await Promise.allSettled(
            (updatedLoans as any[]).map(async (loan) => {
                const equipmentName = loan.equipment?.name || ''
                const equipmentNumber = loan.equipment?.equipment_number || ''
                const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim()
                const studentId = loan.profiles?.user_id

                await notifyAndLog({
                    eventKey: 'loan_rejected',
                    discordMessage:
                        `❌ **ปฏิเสธคำขอยืม (Admin)**\n\n` +
                        `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
                        `👤 **ผู้ยืม:** ${borrowerName}\n` +
                        `👑 **ดำเนินการโดย:** Admin`,
                    discordType: 'loan',
                    welpruUserIds: studentId ? [studentId] : [],
                    welpruVariables: { equipment: equipmentName, borrower: borrowerName },
                    activity: {
                        staffId: auth.user!.id,
                        staffRole,
                        actionType: 'reject_loan',
                        targetType: 'loan',
                        targetId: loan.id,
                        targetUserId: loan.user_id,
                        isSelfAction: loan.user_id === auth.user!.id,
                    },
                })
            })
        )
    }

    revalidatePath('/admin/loans')
    return { success: true, count: parsed.data.loanIds.length }
}

/**
 * บันทึกการรับคืนอุปกรณ์
 * - อัปเดต loanRequest → status: returned
 * - อัปเดต equipment → status: active หรือ maintenance
 */
export async function processReturn(
    loanId: string,
    equipmentId: string,
    condition: 'good' | 'damaged' | 'missing_parts',
    notes?: string
) {
    // 1. Zod Validation
    const parsed = processReturnSchema.safeParse({ loanId, equipmentId, condition, notes })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Auth Guard
    const auth = await requireStaff()
    if (auth.error) return { error: auth.error }

    const adminClient = createAdminClient()

    // 3. Update loan → returned
    const { data: updatedLoan, error: loanError } = await adminClient
        .from('loanRequests')
        .update({
            status: 'returned',
            returned_at: new Date().toISOString(),
            return_condition: parsed.data.condition,
            return_notes: parsed.data.notes ?? null,
        })
        .eq('id', parsed.data.loanId)
        .select(`
            id,
            user_id,
            equipment:equipment_id(name, equipment_number),
            profiles!fk_loanrequests_profiles(user_id, first_name, last_name)
        `)
        .single()

    if (loanError) return { error: loanError.message }

    // 4. Update equipment status
    const newEquipmentStatus = parsed.data.condition === 'good' ? 'ready' : 'maintenance'
    const { error: equipError } = await adminClient
        .from('equipment')
        .update({ status: newEquipmentStatus })
        .eq('id', parsed.data.equipmentId)

    if (equipError) {
        console.warn('[processReturn] equipment status update failed:', equipError.message)
        // ไม่ return error เพราะ loan ถูกบันทึกสำเร็จแล้ว
    }

    // 5. Get staff role
    const { data: staffProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', auth.user!.id)
        .single()
    const staffRole = (staffProfile?.role as 'staff' | 'admin') ?? 'staff'

    // 6. Notify + Log (parallel)
    const loanData = updatedLoan as any
    const equipmentName = loanData?.equipment?.name || ''
    const equipmentNumber = loanData?.equipment?.equipment_number || ''
    const borrowerName = `${loanData?.profiles?.first_name || ''} ${loanData?.profiles?.last_name || ''}`.trim()
    const studentId = loanData?.profiles?.user_id
    const conditionLabel = parsed.data.condition === 'good' ? 'ปกติ' : parsed.data.condition === 'damaged' ? 'ชำรุด' : 'อุปกรณ์ไม่ครบ'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    await notifyAndLog({
        eventKey: 'loan_returned',
        discordMessage:
            `${parsed.data.condition === 'good' ? '✅' : '⚠️'} **คืนอุปกรณ์ (Admin)**\n\n` +
            `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
            `👤 **ผู้ยืม:** ${borrowerName}\n` +
            `🛠 **สภาพ:** ${conditionLabel}\n` +
            `${notes ? `📝 **หมายเหตุ:** ${notes}\n` : ''}` +
            `👑 **บันทึกโดย:** Admin\n` +
            `🔗 [ดูรายการยืมของฉัน](${appUrl}/my-loans)`,
        discordType: parsed.data.condition === 'good' ? 'loan' : 'maintenance',
        welpruUserIds: studentId ? [studentId] : [],
        welpruVariables: { equipment: equipmentName, borrower: borrowerName },
        welpruLink: `${appUrl}/my-loans`,
        activity: {
            staffId: auth.user!.id,
            staffRole,
            actionType: 'mark_returned',
            targetType: 'loan',
            targetId: parsed.data.loanId,
            targetUserId: loanData?.user_id,
            isSelfAction: loanData?.user_id === auth.user!.id,
            details: { condition: parsed.data.condition, notes: parsed.data.notes },
        },
    })

    revalidatePath('/admin/loans')
    revalidatePath('/admin')
    return { success: true, condition: parsed.data.condition }
}
