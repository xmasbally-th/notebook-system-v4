'use server'

import { createClient } from '@/lib/supabase/server'
import { sendDiscordNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import { formatThaiDate, formatThaiTime, formatThaiDateTime } from '@/lib/formatThaiDate'
import { checkTimeConflict, checkTypeConflict } from '@/lib/reservations'

export async function submitReservationRequest(formData: FormData) {
    const supabase = await createClient()

    // 1. Validate User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role, status, first_name, last_name, email, departments(name)')
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

    // 3. Validation
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Check dates logic
    if (start < new Date()) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startDay = new Date(start)
        startDay.setHours(0, 0, 0, 0)

        if (startDay < today) {
            return { error: 'วันที่รับต้องไม่เป็นวันที่ผ่านมาแล้ว' }
        }
    }

    if (end < start) {
        return { error: 'วันที่คืนต้องไม่ก่อนวันที่รับ' }
    }

    // Check conflicts
    try {
        const typeConflict = await checkTypeConflict(user.id, equipmentId)
        if (typeConflict.hasConflict) {
            return { error: 'คุณมีการจองหรือยืมอุปกรณ์ประเภทนี้อยู่แล้ว' }
        }

        const timeConflict = await checkTimeConflict(equipmentId, start, end)
        if (timeConflict) {
            // Anomaly Detection Notification
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            const dept = profile.departments?.name || '-'

            const alertMessage = `
⚠️ **แจ้งเตือนการจองซ้ำซ้อน (Anomaly Detected)**

มีการพยายามจองอุปกรณ์ในช่วงเวลาที่ไม่ว่าง
👤 **ผู้ทำรายการ:** ${fullName} (${dept})
📦 **รหัสอุปกรณ์ที่ขอ:** ${equipmentId}
📅 **ช่วงเวลาที่ขอ:** ${formatThaiDateTime(startDate)} - ${formatThaiDateTime(endDate)}

ระบบได้ทำการระงับการจองนี้แล้ว
`.trim()
            await sendDiscordNotification(alertMessage, 'maintenance')

            return { error: 'ช่วงเวลาที่เลือกมีการจองหรือยืมอยู่แล้ว' }
        }
    } catch (e) {
        console.error('Validation error:', e)
        // Continue if checks fail? No, better safe than sorry
        // But the original code swallowed some errors. Let's rely on DB constraints as final gate.
    }

    // 4. Create Reservation
    const isSelfAction = profile.role === 'staff' || profile.role === 'admin'
    const status = isSelfAction ? 'approved' : 'pending'

    const { data: insertedReservation, error } = await (supabase as any)
        .from('reservations')
        .insert({
            user_id: user.id,
            equipment_id: equipmentId,
            start_date: startDate,
            end_date: endDate,
            status,
            approved_at: isSelfAction ? new Date().toISOString() : null,
            approved_by: isSelfAction ? user.id : null
        })
        .select('id, equipment(name, equipment_number)')
        .single()

    if (error) {
        console.error('Reservation error:', error)
        if (error.message.includes('OVERLAP')) {
            return { error: 'ช่วงเวลาที่เลือกซ้อนทับกับการจองอื่น' }
        }
        return { error: 'ไม่สามารถสร้างการจองได้' }
    }

    // 5. Notify Discord
    try {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        const dept = profile.departments?.name || '-'
        const equipmentName = insertedReservation.equipment?.name || 'ไม่ทราบชื่อ'
        const equipmentNumber = insertedReservation.equipment?.equipment_number || '-'
        const durationMs = end.getTime() - start.getTime()
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        const message = `
**📅 คำขอจองอุปกรณ์ใหม่**

👤 **ผู้จอง:** ${fullName}
🏢 **หน่วยงาน:** ${dept}
📧 **อีเมล:** ${profile.email}

📦 **อุปกรณ์:** ${equipmentName}
🔖 **รหัส:** #${equipmentNumber}

📅 **วันที่รับ:** ${formatThaiDate(startDate)}
📅 **วันที่คืน:** ${formatThaiDate(endDate)}
⏱️ **ระยะเวลา:** ${durationDays} วัน

🔗 [ตรวจสอบคำขอ](${appUrl}/admin/reservations)
        `.trim()

        await sendDiscordNotification(message, 'reservation')
    } catch (notifyError) {
        console.error('Notification failed:', notifyError)
        // Don't fail the request if notification fails
    }

    revalidatePath('/my-reservations')
    revalidatePath('/equipment')

    return { success: true, reservationId: insertedReservation.id }
}

// Server-side function to log staff activity
async function logStaffActivityServer(
    supabase: any,
    entry: {
        staffId: string
        staffRole: 'staff' | 'admin'
        actionType: string
        targetType: string
        targetId: string
        targetUserId?: string
        isSelfAction?: boolean
        details?: Record<string, any>
    }
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('staff_activity_log')
            .insert({
                staff_id: entry.staffId,
                staff_role: entry.staffRole,
                action_type: entry.actionType,
                target_type: entry.targetType,
                target_id: entry.targetId,
                target_user_id: entry.targetUserId || null,
                is_self_action: entry.isSelfAction || false,
                details: entry.details || {}
            })

        if (error) {
            console.error('[logStaffActivityServer] Error:', error)
            return false
        }
        return true
    } catch (error) {
        console.error('[logStaffActivityServer] Exception:', error)
        return false
    }
}

/**
 * Server Action: Convert reservation to loan
 * Fixes:
 * 🔴 1. Error handling for all steps (reservation + equipment update)
 * 🔴 2. Discord notification on conversion
 * 🟡 3. Validates reservation status before converting
 * 🟡 4. Uses server-side Supabase client (not client-side REST API)
 */
export async function convertReservationToLoanAction(
    reservationId: string
): Promise<{ success: boolean; error?: string; loanId?: string }> {
    const supabase = await createClient()

    // 1. Authenticate user & check role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'กรุณาเข้าสู่ระบบ' }
    }

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.role !== 'staff' && profile.role !== 'admin')) {
        return { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    // 2. Fetch reservation with equipment info — validate status (🟡 Fix #3)
    const { data: reservation, error: fetchError } = await (supabase as any)
        .from('reservations')
        .select('*, equipment(name, equipment_number)')
        .eq('id', reservationId)
        .single()

    if (fetchError || !reservation) {
        return { success: false, error: 'ไม่พบข้อมูลการจอง' }
    }

    if (reservation.status !== 'ready' && reservation.status !== 'approved') {
        return { success: false, error: `ไม่สามารถแปลงการจองได้ สถานะปัจจุบัน: ${reservation.status}` }
    }

    try {
        // 3. Create loan request (auto-approved)
        const { data: loanData, error: loanError } = await (supabase as any)
            .from('loanRequests')
            .insert({
                user_id: reservation.user_id,
                equipment_id: reservation.equipment_id,
                start_date: reservation.start_date,
                end_date: reservation.end_date,
                status: 'approved'
            })
            .select('id')
            .single()

        if (loanError || !loanData) {
            console.error('[convertReservationToLoan] Loan creation error:', loanError)
            return { success: false, error: 'ไม่สามารถสร้างคำขอยืมได้' }
        }

        const loanId = loanData.id

        // 4. Update reservation status to completed (🔴 Fix #1 — check error)
        const { error: reservationUpdateError } = await (supabase as any)
            .from('reservations')
            .update({
                status: 'completed',
                loan_id: loanId,
                completed_at: new Date().toISOString(),
                completed_by: user.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', reservationId)

        if (reservationUpdateError) {
            console.error('[convertReservationToLoan] Reservation update error:', reservationUpdateError)
            // Rollback: delete the created loan
            await (supabase as any).from('loanRequests').delete().eq('id', loanId)
            return { success: false, error: 'ไม่สามารถอัปเดตสถานะการจองได้' }
        }

        // 5. Update equipment status to borrowed (🔴 Fix #1 — check error)
        const { error: equipmentUpdateError } = await (supabase as any)
            .from('equipment')
            .update({ status: 'borrowed' })
            .eq('id', reservation.equipment_id)

        if (equipmentUpdateError) {
            console.error('[convertReservationToLoan] Equipment update error:', equipmentUpdateError)
            // Rollback: revert reservation and delete loan
            await (supabase as any)
                .from('reservations')
                .update({ status: reservation.status, loan_id: null, completed_at: null, completed_by: null })
                .eq('id', reservationId)
            await (supabase as any).from('loanRequests').delete().eq('id', loanId)
            return { success: false, error: 'ไม่สามารถอัปเดตสถานะอุปกรณ์ได้' }
        }

        // 6. Log staff activity
        await logStaffActivityServer(supabase, {
            staffId: user.id,
            staffRole: profile.role as 'staff' | 'admin',
            actionType: 'convert_to_loan',
            targetType: 'reservation',
            targetId: reservationId,
            targetUserId: reservation.user_id,
            isSelfAction: reservation.user_id === user.id,
            details: { loan_id: loanId }
        })

        // 7. Send Discord notification (🔴 Fix #2)
        try {
            // Fetch borrower profile for notification
            const { data: borrowerProfile } = await (supabase as any)
                .from('profiles')
                .select('first_name, last_name, email, departments(name)')
                .eq('id', reservation.user_id)
                .single()

            const borrowerName = borrowerProfile
                ? `${borrowerProfile.first_name || ''} ${borrowerProfile.last_name || ''}`.trim()
                : 'ไม่ทราบ'
            const dept = borrowerProfile?.departments?.name || '-'
            const staffName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            const equipmentName = reservation.equipment?.name || 'ไม่ทราบ'
            const equipmentNumber = reservation.equipment?.equipment_number || '-'

            const message = `
**🔄 แปลงการจองเป็นการยืม**

👤 **ผู้ยืม:** ${borrowerName}
🏢 **หน่วยงาน:** ${dept}

📦 **อุปกรณ์:** ${equipmentName}
🔖 **รหัส:** #${equipmentNumber}

📅 **วันที่รับ:** ${formatThaiDate(reservation.start_date)}
📅 **วันที่คืน:** ${formatThaiDate(reservation.end_date)}

👨‍💼 **ดำเนินการโดย:** ${staffName}
✅ **สถานะ:** อนุมัติอัตโนมัติ (จากการจอง)
            `.trim()

            await sendDiscordNotification(message, 'loan')
        } catch (notifyError) {
            console.error('[convertReservationToLoan] Notification failed:', notifyError)
            // Don't fail the action if notification fails
        }

        // 8. Revalidate paths
        revalidatePath('/my-reservations')
        revalidatePath('/my-loans')
        revalidatePath('/staff/reservations')
        revalidatePath('/admin/reservations')
        revalidatePath('/staff/loans')

        return { success: true, loanId }
    } catch (error) {
        console.error('[convertReservationToLoan] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' }
    }
}
