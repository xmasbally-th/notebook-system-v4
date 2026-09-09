'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/auth-guard'
import { notifyAndLog } from '@/lib/serverNotify'
import { formatThaiDate, formatThaiDateTime } from '@/lib/formatThaiDate'
import { validateBooking } from '@/lib/domain/bookingValidator'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const fastCounterLoanSchema = z.object({
    equipmentId: z.string().uuid(),
    borrowerType: z.enum(['internal', 'external']),
    targetUserId: z.string().uuid().optional(),
    externalBorrowerName: z.string().optional(),
    externalBorrowerOrg: z.string().optional(),
    externalBorrowerPhone: z.string().optional(),
    purpose: z.string().min(2, 'กรุณาระบุวัตถุประสงค์การใช้งาน'),
    endDate: z.string().min(10, 'กรุณาระบุวันที่คืน'),
    returnTime: z.string().min(4, 'กรุณาระบุเวลาคืน')
})

export type FastCounterLoanInput = z.infer<typeof fastCounterLoanSchema>

/**
 * Lookup equipment by code (scanned text or equipment_number or UUID)
 * Also fetches any currently active loan if borrowed.
 */
export async function lookupEquipmentByCode(rawCode: string) {
    const auth = await requireStaff()
    if (auth.error) return { error: auth.error }

    if (!rawCode || !rawCode.trim()) {
        return { error: 'กรุณาระบุรหัสอุปกรณ์' }
    }

    let cleanCode = rawCode.trim()

    // If scanned a full URL (e.g. https://.../equipment/<uuid>?mode=counter)
    const urlMatch = cleanCode.match(/\/equipment\/([0-9a-fA-F-]{36})/)
    if (urlMatch && urlMatch[1]) {
        cleanCode = urlMatch[1]
    }

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanCode)

    const supabase = await createClient()

    let query = (supabase as any)
        .from('equipment')
        .select('*, equipment_types(id, name, icon)')

    if (isUuid) {
        query = query.eq('id', cleanCode)
    } else {
        // Match by equipment_number (exact or case-insensitive)
        const strippedNumber = cleanCode.replace(/^#/, '')
        query = query.or(`equipment_number.eq.${strippedNumber},equipment_number.ilike.${strippedNumber}`)
    }

    const { data: equipment, error } = await query.maybeSingle()

    if (error) {
        return { error: `ค้นหาอุปกรณ์ไม่สำเร็จ: ${error.message}` }
    }

    if (!equipment) {
        return { error: `ไม่พบอุปกรณ์ที่มีรหัส "${cleanCode}" ในระบบ` }
    }

    // Check if there is an active loan on this equipment
    const { data: activeLoan } = await (supabase as any)
        .from('loanRequests')
        .select('*, profiles!fk_loanrequests_profiles(id, first_name, last_name, email, phone_number, user_id, departments(name))')
        .eq('equipment_id', equipment.id)
        .eq('status', 'approved')
        .maybeSingle()

    return {
        success: true,
        equipment,
        activeLoan: activeLoan || null
    }
}

/**
 * Search internal profiles for fast counter selection
 */
export async function searchInternalProfiles(searchTerm: string) {
    const auth = await requireStaff()
    if (auth.error) return { error: auth.error }

    if (!searchTerm || searchTerm.trim().length < 2) return { profiles: [] }

    const term = searchTerm.trim()
    const supabase = await createClient()

    const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, first_name, last_name, email, phone_number, user_id, user_type, departments(name)')
        .eq('status', 'approved')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,user_id.ilike.%${term}%`)
        .limit(10)

    if (error) return { error: error.message }
    return { profiles: data || [] }
}

/**
 * Create an immediate on-site loan at the service counter (Dual Mode: Internal User or External Guest)
 */
export async function createFastCounterLoanAction(input: FastCounterLoanInput) {
    const auth = await requireStaff()
    if (auth.error || !auth.user) {
        return { success: false, error: auth.error || 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    const parsed = fastCounterLoanSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    const {
        equipmentId,
        borrowerType,
        targetUserId,
        externalBorrowerName,
        externalBorrowerOrg,
        externalBorrowerPhone,
        purpose,
        endDate,
        returnTime
    } = parsed.data

    if (borrowerType === 'internal' && !targetUserId) {
        return { success: false, error: 'กรุณาเลือกผู้ยืมในระบบ' }
    }

    if (borrowerType === 'external' && (!externalBorrowerName || !externalBorrowerName.trim())) {
        return { success: false, error: 'กรุณาระบุชื่อวิทยากรหรือผู้ยืมภายนอก' }
    }

    const adminClient = createAdminClient()
    const now = new Date()

    // 1. Fetch equipment and verify availability
    const { data: equipment, error: eqErr } = await adminClient
        .from('equipment')
        .select('id, name, equipment_number, status')
        .eq('id', equipmentId)
        .single()

    if (eqErr || !equipment) {
        return { success: false, error: 'ไม่พบข้อมูลอุปกรณ์' }
    }

    if (equipment.status !== 'ready' && equipment.status !== 'active') {
        return { success: false, error: `อุปกรณ์นี้ไม่ว่างในขณะนี้ (สถานะ: ${equipment.status})` }
    }

    // 2. Format deadline
    const cleanReturnTime = returnTime.length === 5 ? `${returnTime}:00` : returnTime
    const endDateTime = new Date(`${endDate.split('T')[0]}T${cleanReturnTime}+07:00`)

    if (endDateTime.getTime() <= now.getTime()) {
        return { success: false, error: 'วันและเวลาที่คืนต้องอยู่หลังเวลาปัจจุบัน' }
    }

    // 3. Domain validation for conflicts
    const validation = await validateBooking({
        userId: borrowerType === 'internal' ? targetUserId! : auth.user.id,
        equipmentId,
        startDate: now,
        endDate: endDateTime,
        bookingType: 'loan'
    })

    if (!validation.valid) {
        return { success: false, error: validation.error || 'ช่วงเวลานี้มีคิวจองอุปกรณ์อื่นอยู่แล้ว' }
    }

    // 4. Resolve Borrower Info
    let finalUserId = auth.user.id
    let borrowerDisplayName = ''
    let borrowerOrg = '-'
    let borrowerPhone = '-'
    let finalReason = purpose

    if (borrowerType === 'internal') {
        finalUserId = targetUserId!
        const { data: borrowerProfile } = await adminClient
            .from('profiles')
            .select('first_name, last_name, phone_number, user_id, departments(name)')
            .eq('id', targetUserId)
            .single()

        if (borrowerProfile) {
            borrowerDisplayName = `${borrowerProfile.first_name || ''} ${borrowerProfile.last_name || ''}`.trim()
            const deptData: any = borrowerProfile.departments
            borrowerOrg = Array.isArray(deptData) ? (deptData[0]?.name || '-') : (deptData?.name || '-')
            borrowerPhone = borrowerProfile.phone_number || '-'
        }
    } else {
        // External guest
        finalUserId = auth.user.id // Staff acts as guarantor in auth.users
        borrowerDisplayName = `[วิทยากรภายนอก] ${externalBorrowerName}`
        borrowerOrg = externalBorrowerOrg || 'หน่วยงานภายนอก'
        borrowerPhone = externalBorrowerPhone || '-'
        finalReason = `[วิทยากรภายนอก: ${externalBorrowerName} (${borrowerOrg}, โทร ${borrowerPhone})] ${purpose}`
    }

    // Staff profile who created this
    const { data: staffProfile } = await adminClient
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', auth.user.id)
        .single()
    const staffName = staffProfile ? `${staffProfile.first_name || ''} ${staffProfile.last_name || ''}`.trim() : 'เจ้าหน้าที่'

    // 5. Insert Loan Request (auto approved)
    const { data: loan, error: loanErr } = await (adminClient as any)
        .from('loanRequests')
        .insert({
            user_id: finalUserId,
            equipment_id: equipmentId,
            start_date: now.toISOString(),
            end_date: endDateTime.toISOString(),
            return_time: cleanReturnTime,
            status: 'approved',
            reason: finalReason
        })
        .select('id')
        .single()

    if (loanErr || !loan) {
        console.error('[createFastCounterLoanAction] Loan insert failed:', loanErr)
        return { success: false, error: `สร้างรายการยืมไม่สำเร็จ: ${loanErr?.message}` }
    }

    // 6. Update Equipment Status to 'borrowed'
    const { error: eqUpdateErr } = await adminClient
        .from('equipment')
        .update({ status: 'borrowed' })
        .eq('id', equipmentId)

    if (eqUpdateErr) {
        console.error('[createFastCounterLoanAction] Equipment update failed:', eqUpdateErr)
        // Rollback
        await adminClient.from('loanRequests').delete().eq('id', loan.id)
        return { success: false, error: 'อัปเดตสถานะอุปกรณ์ไม่สำเร็จ' }
    }

    // 7. Send Notifications & Audit Log
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const discordMessage = `
⚡ **บันทึกการยืมด่วนหน้าเคาน์เตอร์ (Fast Counter Borrow)**

👤 **ผู้ยืม:** ${borrowerDisplayName}
🏢 **สังกัด:** ${borrowerOrg}
📞 **โทร:** ${borrowerPhone}
📦 **อุปกรณ์:** ${equipment.name} (#${equipment.equipment_number})

📅 **วันที่ยืม:** ${formatThaiDate(now.toISOString())} (ยืมทันที ณ เคาน์เตอร์)
📅 **กำหนดคืน:** ${formatThaiDate(endDateTime.toISOString())} เวลา ${cleanReturnTime.slice(0, 5)} น.
🎯 **วัตถุประสงค์:** ${purpose}

👨‍💼 **เจ้าหน้าที่ผู้ส่งมอบ:** ${staffName}
✅ **สถานะ:** อนุมัติและส่งมอบเครื่องเรียบร้อยแล้ว
    `.trim()

    await notifyAndLog({
        discordMessage,
        discordEmbed: {
            title: '⚡ บันทึกการยืมด่วนหน้าเคาน์เตอร์สำเร็จ',
            description: `เจ้าหน้าที่ได้ทำการส่งมอบเครื่องและบันทึกการยืมด่วนหน้าเคาน์เตอร์เรียบร้อยแล้ว`,
            color: 0x3B82F6, // Blue
            fields: [
                { name: '👤 ผู้ยืม', value: `${borrowerDisplayName}\n(${borrowerOrg})`, inline: true },
                { name: '📦 อุปกรณ์', value: `${equipment.name}\n(#${equipment.equipment_number})`, inline: true },
                { name: '📅 กำหนดส่งคืน', value: `${formatThaiDate(endDateTime.toISOString())}\nเวลา ${cleanReturnTime.slice(0, 5)} น.`, inline: true },
                { name: '🎯 วัตถุประสงค์', value: purpose, inline: false },
                { name: '👨‍💼 เจ้าหน้าที่ผู้ส่งมอบ', value: staffName, inline: true },
            ],
            timestamp: now.toISOString(),
            footer: { text: 'ระบบยืม-คืนอุปกรณ์ Notebook System • Counter Mode' }
        },
        discordType: 'loan',
        activity: {
            staffId: auth.user.id,
            staffRole: (staffProfile?.role as any) || 'staff',
            actionType: 'approve_loan',
            targetType: 'loan',
            targetId: loan.id,
            targetUserId: finalUserId,
            details: {
                borrowerType,
                externalName: externalBorrowerName,
                equipmentNumber: equipment.equipment_number
            }
        }
    })

    revalidatePath('/equipment')
    revalidatePath('/staff/loans')
    revalidatePath('/staff/returns')
    revalidatePath('/staff/counter')

    return {
        success: true,
        loanId: loan.id,
        equipmentName: equipment.name,
        equipmentNumber: equipment.equipment_number,
        borrowerName: borrowerDisplayName
    }
}
