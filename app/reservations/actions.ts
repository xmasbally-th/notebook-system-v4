'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendDiscordNotification } from '@/lib/notifications'
import { notifyAndLog } from '@/lib/serverNotify'
import { formatThaiDate, formatThaiTime, formatThaiDateTime } from '@/lib/formatThaiDate'
import { parseReservationFormData } from '@/lib/schemas'
import { validateBooking, getInitialStatus, isStaffOrAdmin } from '@/lib/domain'
import { requireApprovedUser, requireStaff } from '@/lib/auth-guard'

export async function submitReservationRequest(formData: FormData) {
    // 1. Auth Guard — requires approved user
    const { user, error: authError } = await requireApprovedUser()
    if (authError || !user) {
        return { error: authError || 'กรุณาเข้าสู่ระบบก่อน' }
    }

    const supabase = await createClient()

    // Fetch extended profile info needed for notifications
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role, first_name, last_name, email, departments(name)')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return { error: 'ไม่พบข้อมูลผู้ใช้' }
    }

    // 2. Parse & Validate Data with Zod
    const parsed = parseReservationFormData(formData)
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง'
        return { error: firstError }
    }

    const { equipmentId, startDate, endDate, pickupTime, returnTime } = parsed.data
    const start = new Date(startDate)
    const end = new Date(endDate)

    // 3. Domain Validation (Conflicts)
    const validation = await validateBooking({
        userId: user.id,
        equipmentId,
        startDate: start,
        endDate: end,
        bookingType: 'reservation'
    })

    if (!validation.valid) {
        if (validation.errorCode === 'TIME_CONFLICT') {
            // Anomaly Detection Notification
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            const dept = profile.departments?.name || '-'

            const alertMessage = `
⚠️ **แจ้งเตือนการจองซ้ำซ้อน (Anomaly Detected)**

มีการพยายามจองอุปกรณ์ในช่วงเวลาที่ไม่ว่าง
👤 **ผู้ทำรายการ:** ${fullName} (${dept})
📦 **รหัสอุปกรณ์ที่ขอ:** ${equipmentId}
📅 **ช่วงเวลาที่ขอ:** ${formatThaiDateTime(start)} - ${formatThaiDateTime(end)}

ระบบได้ทำการระงับการจองนี้แล้ว
`.trim()
            await sendDiscordNotification(alertMessage, 'maintenance')
        }
        return { error: validation.error || 'การจองไม่ถูกต้อง' }
    }

    // 4. Create Reservation
    const isSelfAction = isStaffOrAdmin(profile.role)
    const status = getInitialStatus(profile.role)

    const { data: insertedReservation, error } = await (supabase as any)
        .from('reservations')
        .insert({
            user_id: user.id,
            equipment_id: equipmentId,
            start_date: startDate,
            end_date: endDate,
            status,
            pickup_time: pickupTime || null,
            return_time: returnTime || null,
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

    // 5. Notify
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

        await notifyAndLog({
            eventKey: 'new_reservation_request',
            discordMessage: message,
            discordType: 'reservation',
            welpruVariables: {
                reserver: fullName,
                equipment: equipmentName,
                start_date: formatThaiDate(startDate),
                end_date: formatThaiDate(endDate),
            },
        })
    } catch (notifyError) {
        console.error('Notification failed:', notifyError)
        // Don't fail the request if notification fails
    }


    revalidatePath('/my-reservations')
    revalidatePath('/equipment')

    return { success: true, reservationId: insertedReservation.id }
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
    console.log('[convertReservationToLoanAction] Start for reservation:', reservationId)
    // 1. Auth Guard — requires staff or admin
    const { user, error: authError } = await requireStaff()
    if (authError || !user) {
        console.log('[convertReservationToLoanAction] Auth error:', authError)
        return { success: false, error: authError || 'ไม่มีสิทธิ์ดำเนินการ' }
    }
    console.log('[convertReservationToLoanAction] User authenticated:', user.id)

    const supabase = await createClient()

    // Fetch extended profile for discord notification & activity log
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single()

    if (!profile) {
        console.log('[convertReservationToLoanAction] Profile not found')
        return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' }
    }
    console.log('[convertReservationToLoanAction] Profile fetched')

    // 2. Fetch reservation with equipment info — validate status (🟡 Fix #3)
    const { data: reservation, error: fetchError } = await (supabase as any)
        .from('reservations')
        .select('*, equipment(name, equipment_number)')
        .eq('id', reservationId)
        .single()

    if (fetchError || !reservation) {
        console.log('[convertReservationToLoanAction] Reservation fetch error:', fetchError)
        return { success: false, error: 'ไม่พบข้อมูลการจอง' }
    }
    console.log('[convertReservationToLoanAction] Reservation fetched, status:', reservation.status)

    if (reservation.status !== 'ready' && reservation.status !== 'approved') {
        return { success: false, error: `ไม่สามารถแปลงการจองได้ สถานะปัจจุบัน: ${reservation.status}` }
    }

    try {
        // [HOTFIX] Ensure the user's profile is 'approved' before creating the loan request.
        // This prevents the 'USER_NOT_APPROVED' database trigger from rejecting the transaction
        // for legacy users who were created before the auto-approve flow was introduced.
        const adminClient = createAdminClient()
        await adminClient
            .from('profiles')
            .update({ status: 'approved' })
            .eq('id', reservation.user_id)
            .eq('status', 'pending')

        // 3. Mark reservation as completed FIRST (to bypass overlap trigger)
        // If we don't do this, the database trigger will see this 'ready' reservation
        // and think the new loan request is overlapping with it!
        const { error: preUpdateError } = await (supabase as any)
            .from('reservations')
            .update({ status: 'completed' })
            .eq('id', reservationId)
            
        if (preUpdateError) {
            console.error('[convertReservationToLoanAction] Pre-update error:', preUpdateError)
            return { success: false, error: 'ไม่สามารถอัปเดตสถานะการจองเบื้องต้นได้' }
        }

        // 4. Create loan request (auto-approved)
        const { data: loanData, error: loanError } = await (supabase as any)
            .from('loanRequests')
            .insert({
                user_id: reservation.user_id,
                equipment_id: reservation.equipment_id,
                start_date: reservation.start_date,
                end_date: reservation.end_date,
                status: 'approved',
                return_time: reservation.return_time || null
            })
            .select('id')
            .single()

        if (loanError || !loanData) {
            console.error('[convertReservationToLoanAction] Loan creation error:', loanError)
            // Rollback reservation
            await (supabase as any)
                .from('reservations')
                .update({ status: reservation.status })
                .eq('id', reservationId)
                
            const errorMsg = loanError?.message?.includes('USER_NOT_APPROVED') 
                ? 'ผู้ใช้นี้ยังไม่ได้รับการอนุมัติบัญชี (Profile is pending)'
                : (loanError?.message || 'ไม่สามารถสร้างคำขอยืมได้')
            return { success: false, error: errorMsg }
        }
        console.log('[convertReservationToLoanAction] Loan created:', loanData.id)

        const loanId = loanData.id

        // 5. Link loan_id to reservation and finalize it
        const { error: reservationUpdateError } = await (supabase as any)
            .from('reservations')
            .update({
                loan_id: loanId,
                completed_at: new Date().toISOString(),
                completed_by: user.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', reservationId)

        if (reservationUpdateError) {
            console.error('[convertReservationToLoanAction] Reservation update error:', reservationUpdateError)
            // Rollback: delete the created loan and revert reservation
            await (supabase as any).from('loanRequests').delete().eq('id', loanId)
            await (supabase as any).from('reservations').update({ status: reservation.status }).eq('id', reservationId)
            return { success: false, error: 'ไม่สามารถเชื่อมโยงคำขอยืมกับการจองได้' }
        }
        console.log('[convertReservationToLoanAction] Reservation finalized with loanId')

        // 5. Update equipment status to borrowed (🔴 Fix #1 — check error)
        const { error: equipmentUpdateError } = await adminClient
            .from('equipment')
            .update({ status: 'borrowed' })
            .eq('id', reservation.equipment_id)

        if (equipmentUpdateError) {
            console.error('[convertReservationToLoanAction] Equipment update error:', equipmentUpdateError)
            // Rollback: revert reservation and delete loan
            await (supabase as any)
                .from('reservations')
                .update({ status: reservation.status, loan_id: null, completed_at: null, completed_by: null })
                .eq('id', reservationId)
            await (supabase as any).from('loanRequests').delete().eq('id', loanId)
            return { success: false, error: 'ไม่สามารถอัปเดตสถานะอุปกรณ์ได้' }
        }
        console.log('[convertReservationToLoanAction] Equipment updated to borrowed')

        // 6. Log staff activity + Notify (parallel)
        const borrowerProfile2 = await (async () => {
            const { data } = await (supabase as any)
                .from('profiles')
                .select('first_name, last_name, email, user_id, departments(name)')
                .eq('id', reservation.user_id)
                .single()
            return data
        })()

        const borrowerName = borrowerProfile2
            ? `${borrowerProfile2.first_name || ''} ${borrowerProfile2.last_name || ''}`.trim()
            : 'ไม่ทราบ'
        const dept = borrowerProfile2?.departments?.name || '-'
        const staffName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        const equipmentName = reservation.equipment?.name || 'ไม่ทราบ'
        const equipmentNumber = reservation.equipment?.equipment_number || '-'
        const studentWelpruId = borrowerProfile2?.user_id
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        await notifyAndLog({
            eventKey: 'reservation_converted',
            discordMessage:
                `🔄 **แปลงการจองเป็นการยืม**\n\n` +
                `👤 **ผู้ยืม:** ${borrowerName}\n` +
                `🏢 **หน่วยงาน:** ${dept}\n\n` +
                `📦 **อุปกรณ์:** ${equipmentName}\n` +
                `🔖 **รหัส:** #${equipmentNumber}\n\n` +
                `📅 **วันที่รับ:** ${formatThaiDate(reservation.start_date)}\n` +
                `📅 **วันที่คืน:** ${formatThaiDate(reservation.end_date)}\n\n` +
                `👨‍💼 **ดำเนินการโดย:** ${staffName}\n` +
                `✅ **สถานะ:** อนุมัติอัตโนมัติ (จากการจอง)\n` +
                `🔗 [ดูรายการยืมของฉัน](${appUrl}/my-loans)`,
            discordType: 'loan',
            welpruUserIds: studentWelpruId ? [studentWelpruId] : [],
            welpruVariables: { equipment: equipmentName, borrower: borrowerName },
            welpruLink: `${appUrl}/my-loans`,
            activity: {
                staffId: user.id,
                staffRole: profile.role as 'staff' | 'admin',
                actionType: 'convert_to_loan',
                targetType: 'reservation',
                targetId: reservationId,
                targetUserId: reservation.user_id,
                isSelfAction: reservation.user_id === user.id,
                details: { loan_id: loanId },
            },
        })

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
