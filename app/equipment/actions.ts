'use server'

import { createClient } from '@/lib/supabase/server'
import { sendDiscordNotification } from '@/lib/notifications'
import { notifyAndLog } from '@/lib/serverNotify'
import { revalidatePath } from 'next/cache'
import { formatThaiDate, formatThaiTime, formatThaiDateTime } from '@/lib/formatThaiDate'
import { parseLoanFormData } from '@/lib/schemas'
import { validateBooking } from '@/lib/domain'
import { requireApprovedUser } from '@/lib/auth-guard'

type LoanLimitsByType = {
    [key: string]: {
        max_days: number
        max_items: number
        type_limits?: Record<string, number>
    }
}

export async function submitLoanRequest(prevState: any, formData: FormData) {
    // 1. Auth Guard — requires approved user
    const { user, error: authError } = await requireApprovedUser()
    if (authError || !user) {
        return { error: authError || 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const supabase = await createClient()

    // Fetch extended profile info for business logic & notifications
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('status, first_name, last_name, email, user_type, departments(name)')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { error: 'ไม่พบข้อมูลผู้ใช้' }
    }

    // 2. Parse & Validate Data with Zod
    const parsed = parseLoanFormData(formData)
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง'
        return { error: firstError }
    }

    const { equipmentId, startDate, endDate, returnTime } = parsed.data

    // 3. Get System Config for Validation
    const { data: config } = await (supabase as any)
        .from('system_config')
        .select('*')
        .single()

    if (config && !config.is_loan_system_active) {
        return { error: 'ระบบยืม-คืนปิดให้บริการชั่วคราว' }
    }

    // 4. Server-side Validation
    const userType = profile.user_type || 'student'
    const loanLimits = config?.loan_limits_by_type as LoanLimitsByType | null
    const limits = loanLimits?.[userType as keyof LoanLimitsByType] || { max_days: 7, max_items: 1, type_limits: {} }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Check loan duration
    const durationMs = end.getTime() - start.getTime()
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1

    if (durationDays > limits.max_days) {
        return { error: `ระยะเวลายืมเกินกำหนดสูงสุด (สูงสุด ${limits.max_days} วัน)` }
    }

    // Check active loans count
    const { data: activeLoans, error: activeLoansError } = await (supabase as any)
        .from('loanRequests')
        .select('id, equipment_id, equipment(equipment_type_id)')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved'])

    if (activeLoansError) {
        return { error: 'ไม่สามารถตรวจสอบข้อมูลการยืมได้' }
    }

    const activeLoansCount = activeLoans?.length || 0

    if (activeLoansCount >= limits.max_items) {
        return { error: `คุณมีรายการยืมถึงขีดจำกัดแล้ว (สูงสุด ${limits.max_items} รายการ)` }
    }

    // Check closed dates
    const closedDates = (config?.closed_dates as string[]) || []
    const startDateStr = start.toISOString().split('T')[0]
    const endDateStr = end.toISOString().split('T')[0]

    if (closedDates.includes(startDateStr)) {
        return { error: 'วันที่ยืมตรงกับวันหยุดทำการ' }
    }
    if (closedDates.includes(endDateStr)) {
        return { error: 'วันที่คืนตรงกับวันหยุดทำการ' }
    }

    // 5. Get Equipment Details
    const { data: equipment } = await (supabase as any)
        .from('equipment')
        .select('name, equipment_number, equipment_type_id')
        .eq('id', equipmentId)
        .single()

    // Check specific type limit
    if (equipment?.equipment_type_id && limits.type_limits?.[equipment.equipment_type_id]) {
        const typeLimit = limits.type_limits[equipment.equipment_type_id]

        // Count active loans for this specific type
        const activeTypeLoans = activeLoans?.filter((loan: any) =>
            loan.equipment?.equipment_type_id === equipment.equipment_type_id
        ).length || 0

        if (activeTypeLoans >= typeLimit) {
            return { error: `คุณยืมอุปกรณ์ประเภทนี้ครบจำนวนที่กำหนดแล้ว (สูงสุด ${typeLimit} รายการ)` }
        }
    }

    // 5.5 Domain Validation (Conflicts)
    const validation = await validateBooking({
        userId: user.id,
        equipmentId,
        startDate: start,
        endDate: end,
        bookingType: 'loan'
    })

    if (!validation.valid) {
        if (validation.errorCode === 'TIME_CONFLICT') {
            // Send Admin Alert (Anomaly Detection)
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            const dept = profile.departments?.name || '-'
            const equipmentName = equipment?.name || 'ไม่ทราบชื่อ'
            const equipmentNumber = equipment?.equipment_number || '-'

            const alertMessage = `
⚠️ **แจ้งเตือนระวังการยืมซ้ำซ้อน (Anomaly Detected)**

มีการพยายามยืมอุปกรณ์ที่ถูกจองหรือใช้งานอยู่แล้วในช่วงเวลาดังกล่าว
👤 **ผู้ทำรายการ:** ${fullName} (${dept})
📦 **อุปกรณ์:** ${equipmentName} (#${equipmentNumber})
📅 **ช่วงเวลาที่ขอ:** ${formatThaiDateTime(start)} - ${formatThaiDateTime(end)}

ระบบได้ทำการระงับการยืมนี้แล้ว กรุณาตรวจสอบหากมีความผิดปกติเพิ่มเติม
`.trim()
            await sendDiscordNotification(alertMessage, 'maintenance')
        }
        return { error: validation.error || 'การยืมไม่ถูกต้อง' }
    }

    // 6. Create Loan Request
    const insertData: any = {
        user_id: user.id,
        equipment_id: equipmentId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        status: 'pending'
    }
    if (returnTime) {
        insertData.return_time = returnTime
    }
    const { data: insertedLoan, error } = await (supabase as any)
        .from('loanRequests')
        .insert(insertData)
        .select('id')
        .single()

    if (error) {
        return { error: `เกิดข้อผิดพลาด: ${error.message}` }
    }

    // 7. Notify Discord with Thai formatting
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    const dept = profile.departments?.name || '-'
    const equipmentName = equipment?.name || 'ไม่ทราบชื่อ'
    const equipmentNumber = equipment?.equipment_number || '-'

    const formattedReturnTime = returnTime ? returnTime.substring(0, 5) : '-'

    const message = `
**📋 คำขอยืมอุปกรณ์ใหม่**

👤 **ผู้ยืม:** ${fullName}
🏢 **หน่วยงาน:** ${dept}

📦 **อุปกรณ์:** ${equipmentName}
🔖 **รหัส:** #${equipmentNumber}

📅 **วันที่ยืม:** ${formatThaiDate(startDate)}
📅 **วันที่คืน:** ${formatThaiDate(endDate)}
⏰ **เวลาที่คืน:** ${formattedReturnTime}
    `.trim()

    await notifyAndLog({
        eventKey: 'new_loan_request',
        discordMessage: message,
        discordType: 'loan',
        welpruVariables: {
            borrower: fullName,
            equipment: equipmentName,
            start_date: formatThaiDate(startDate),
            end_date: formatThaiDate(endDate),
        },
    })

    revalidatePath('/')
    revalidatePath('/my-loans')
    return { success: true }
}
