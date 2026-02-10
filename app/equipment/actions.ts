'use server'

import { createClient } from '@/lib/supabase/server'
import { sendDiscordNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import { formatThaiDate, formatThaiTime, formatThaiDateTime } from '@/lib/formatThaiDate'
import { checkTimeConflict } from '@/lib/reservations'

type LoanLimitsByType = {
    [key: string]: {
        max_days: number
        max_items: number
        type_limits?: Record<string, number>
    }
}

export async function submitLoanRequest(prevState: any, formData: FormData) {
    const supabase = await createClient()

    // 1. Validate User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('status, first_name, last_name, email, user_type, departments(name)')
        .eq('id', user.id)
        .single()

    if (profile?.status !== 'approved') {
        return { error: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ' }
    }

    // 2. Parse Data
    const equipmentId = formData.get('equipmentId') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string

    if (!equipmentId || !startDate || !endDate) {
        return { error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' }
    }

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

    // Parse dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Get today at midnight for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if start date is in the past
    const startDateOnly = new Date(start)
    startDateOnly.setHours(0, 0, 0, 0)
    if (startDateOnly < today) {
        return { error: 'วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว' }
    }

    // Check if end date is before start date
    const endDateOnly = new Date(end)
    endDateOnly.setHours(0, 0, 0, 0)
    if (endDateOnly < startDateOnly) {
        return { error: 'วันที่คืนต้องไม่ก่อนวันที่ยืม' }
    }

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

    // 5.5 Check Time Conflict (Double Booking Prevention)
    const hasConflict = await checkTimeConflict(equipmentId, start, end)
    if (hasConflict) {
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
📅 **ช่วงเวลาที่ขอ:** ${formatThaiDateTime(startDate)} - ${formatThaiDateTime(endDate)}

ระบบได้ทำการระงับการยืมนี้แล้ว กรุณาตรวจสอบหากมีความผิดปกติเพิ่มเติม
`.trim()

        await sendDiscordNotification(alertMessage)

        return { error: 'อุปกรณ์นี้ถูกใช้งานหรือจองแล้วในช่วงเวลาดังกล่าว' }
    }

    // 6. Create Loan Request
    const { data: insertedLoan, error } = await (supabase as any)
        .from('loanRequests')
        .insert({
            user_id: user.id,
            equipment_id: equipmentId,
            start_date: new Date(startDate).toISOString(),
            end_date: new Date(endDate).toISOString(),
            status: 'pending'
        })
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

    const message = `
**📋 คำขอยืมอุปกรณ์ใหม่**

👤 **ผู้ยืม:** ${fullName}
🏢 **หน่วยงาน:** ${dept}
📧 **อีเมล:** ${profile.email}

📦 **อุปกรณ์:** ${equipmentName}
🔖 **รหัส:** #${equipmentNumber}

📅 **วันที่ยืม:** ${formatThaiDate(startDate)}
📅 **วันที่คืน:** ${formatThaiDateTime(endDate)}
⏱️ **ระยะเวลา:** ${durationDays} วัน

🔗 [ตรวจสอบคำขอ](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/loans)
    `.trim()

    await sendDiscordNotification(message)

    revalidatePath('/')
    revalidatePath('/my-loans')
    return { success: true }
}
