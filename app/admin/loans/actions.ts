'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import {
    bulkLoanActionSchema,
    processReturnSchema,
} from '@/lib/schemas/loanSchema'

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
            .select('*, profiles(first_name,last_name,email,avatar_url), equipment(name,equipment_number,images)')
            .in('status', ['pending', 'approved'])
            .order('created_at', { ascending: false })
            .limit(80),
        adminClient
            .from('loanRequests')
            .select('*, profiles(first_name,last_name,email,avatar_url), equipment(name,equipment_number,images)')
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
        .select('*, profiles(first_name,last_name,email,phone_number,avatar_url), equipment(id,name,equipment_number,images)')
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

/**
 * อนุมัติคำขอยืมหลายรายการพร้อมกัน (Bulk Approve)
 */
export async function approveLoanRequests(loanIds: string[]) {
    // 1. Zod Validation
    const parsed = bulkLoanActionSchema.safeParse({ loanIds })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Auth Guard (ต้องการสิทธิ์ staff ขึ้นไป)
    const auth = await requireStaff()
    if (auth.error) return { error: auth.error }

    // 3. Update
    const { error } = await createAdminClient()
        .from('loanRequests')
        .update({ status: 'approved', approved_by: auth.user!.id })
        .in('id', parsed.data.loanIds)

    if (error) return { error: error.message }

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
    const { error } = await createAdminClient()
        .from('loanRequests')
        .update({ status: 'rejected', approved_by: auth.user!.id })
        .in('id', parsed.data.loanIds)

    if (error) return { error: error.message }

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
    const { error: loanError } = await adminClient
        .from('loanRequests')
        .update({
            status: 'returned',
            returned_at: new Date().toISOString(),
            return_condition: parsed.data.condition,
            return_notes: parsed.data.notes ?? null,
        })
        .eq('id', parsed.data.loanId)

    if (loanError) return { error: loanError.message }

    // 4. Update equipment status
    const newEquipmentStatus = parsed.data.condition === 'good' ? 'active' : 'maintenance'
    const { error: equipError } = await adminClient
        .from('equipment')
        .update({ status: newEquipmentStatus })
        .eq('id', parsed.data.equipmentId)

    if (equipError) {
        console.warn('[processReturn] equipment status update failed:', equipError.message)
        // ไม่ return error เพราะ loan ถูกบันทึกสำเร็จแล้ว
    }

    revalidatePath('/admin/loans')
    revalidatePath('/admin')
    return { success: true, condition: parsed.data.condition }
}
