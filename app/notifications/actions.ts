'use server'

import { createClient } from '@/lib/supabase/server'
import { sendDiscordNotification } from '@/lib/notifications'
import { formatThaiDate, formatThaiDateTime } from '@/lib/formatThaiDate'
import {
    notifyReservationSchema,
    notifyReservationStatusSchema,
    notifyReturnSchema
} from '@/lib/schemas'

// Notify new reservation
export async function notifyReservationCreated(reservationId: string) {
    try {
        // 1. Zod Validation
        const parsed = notifyReservationSchema.safeParse({ reservationId })
        if (!parsed.success) {
            console.error('Invalid reservationId for notification:', parsed.error.issues[0]?.message)
            return
        }

        const supabase = await createClient()

        const { data: reservation } = await supabase
            .from('reservations')
            .select('*, profiles(first_name, last_name, email, departments(name)), equipment(name, equipment_number)')
            .eq('id', reservationId)
            .single()

        if (!reservation) return

        const profile = reservation.profiles as any
        const equipment = reservation.equipment as any
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
        const dept = profile?.departments?.name || '-'

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        const message = `
**📅 การจองอุปกรณ์ใหม่ (New Reservation)**

👤 **ผู้จอง:** ${fullName}
🏢 **หน่วยงาน:** ${dept}
📧 **อีเมล:** ${profile?.email}

📦 **อุปกรณ์:** ${equipment?.name}
🔖 **รหัส:** #${equipment?.equipment_number}

📅 **วันที่รับ:** ${formatThaiDate(reservation.start_date)}
📅 **วันที่คืน:** ${formatThaiDate(reservation.end_date)}

🔗 [ตรวจสอบการจอง](${appUrl}/admin/reservations)
        `.trim()

        await sendDiscordNotification(message, 'reservation')
    } catch (error) {
        console.error('Error notifying reservation created:', error)
    }
}

// Notify reservation status change (Approved, Rejected, Ready)
export async function notifyReservationStatusChange(reservationId: string, status: string, byUserId?: string) {
    try {
        // 1. Zod Validation
        const parsed = notifyReservationStatusSchema.safeParse({ reservationId, status, byUserId })
        if (!parsed.success) {
            console.error('Invalid parameters for status notification:', parsed.error.issues[0]?.message)
            return
        }

        const supabase = await createClient()

        const { data: reservation } = await supabase
            .from('reservations')
            .select('*, profiles(first_name, last_name, email), equipment(name, equipment_number)')
            .eq('id', reservationId)
            .single()

        if (!reservation) return

        const profile = reservation.profiles as any
        const equipment = reservation.equipment as any
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()

        let header = `**📝 อัปเดตสถานะการจอง**`
        let statusText = status
        let color = ''

        if (status === 'approved') {
            header = `**✅ การจองได้รับการอนุมัติ (Approved)**`
            statusText = 'อนุมัติแล้ว'
        } else if (status === 'rejected') {
            header = `**❌ การจองถูกปฏิเสธ (Rejected)**`
            statusText = 'ถูกปฏิเสธ'
        } else if (status === 'ready') {
            header = `**🔔 อุปกรณ์พร้อมรับแล้ว (Ready to Pickup)**`
            statusText = 'พร้อมรับ'
        } else if (status === 'cancelled') {
            header = `**🚫 การจองถูกยกเลิก (Cancelled)**`
            statusText = 'ยกเลิก'
        }

        const message = `
${header}

👤 **ผู้จอง:** ${fullName}
📦 **อุปกรณ์:** ${equipment?.name} (${equipment?.equipment_number})

📅 **วันที่รับ:** ${formatThaiDate(reservation.start_date)}
📅 **สถานะ:** ${statusText}
${reservation.rejection_reason ? `💬 **เหตุผล:** ${reservation.rejection_reason}` : ''}
        `.trim()

        await sendDiscordNotification(message, 'reservation')
    } catch (error) {
        console.error('Error notifying reservation status:', error)
    }
}

// Notify Return
export async function notifyReturn(loanId: string, condition: string, notes?: string) {
    try {
        // 1. Zod Validation
        const parsed = notifyReturnSchema.safeParse({ loanId, condition, notes })
        if (!parsed.success) {
            console.error('Invalid parameters for return notification:', parsed.error.issues[0]?.message)
            return
        }

        const supabase = await createClient()

        const { data: loan } = await supabase
            .from('loanRequests')
            .select('*, profiles(first_name, last_name, email), equipment(name, equipment_number)')
            .eq('id', loanId)
            .single()

        if (!loan) return

        const profile = loan.profiles as any
        const equipment = loan.equipment as any
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()

        const isDamaged = condition !== 'good'
        const header = isDamaged ? '**⚠️ คืนอุปกรณ์ (มีปัญหา/ชำรุด) (Returned with Issues)**' : '**✅ คืนอุปกรณ์สำเร็จ (Returned)**'

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        const message = `
${header}

👤 **ผู้ยืม:** ${fullName}
📦 **อุปกรณ์:** ${equipment?.name} (${equipment?.equipment_number})

📅 **วันที่คืนจริง:** ${formatThaiDateTime(new Date())}
🛠 **สภาพ:** ${condition === 'good' ? 'ปกติ' : condition === 'damaged' ? 'ชำรุด' : 'อุปกรณ์ไม่ครบ'}
${notes ? `📝 **หมายเหตุ:** ${notes}` : ''}

🔗 [ตรวจสอบรายการคืน](${appUrl}/staff/returns)
        `.trim()

        // Use 'maintenance' webhook if damaged, otherwise 'loan' (which falls back to general)
        const type = isDamaged ? 'maintenance' : 'loan'
        await sendDiscordNotification(message, type)
    } catch (error) {
        console.error('Error notifying return:', error)
    }
}

// Notify Overdue Loan Reminder
export async function notifyOverdueLoan(loanId: string, daysOverdue: number) {
    try {
        const supabase = await createClient()

        // Fetch loan details
        const { data: loan } = await supabase
            .from('loanRequests')
            .select('*, profiles(id, first_name, last_name, email, phone_number, user_id), equipment(name, equipment_number)')
            .eq('id', loanId)
            .single()

        if (!loan) {
            return { success: false, error: 'ไม่พบรายการยืมค้างส่ง' }
        }

        const profile = loan.profiles as any
        const equipment = loan.equipment as any
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
        const equipmentName = equipment?.name || 'อุปกรณ์'
        const equipmentNumber = equipment?.equipment_number || 'ไม่ระบุ'
        const studentWelpruId = profile?.user_id // LPUR ID if exists
        
        // 1. Create System Notification for User in DB
        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id: profile.id,
                type: 'loan_overdue',
                title: 'แจ้งเตือน: เลยกำหนดคืนอุปกรณ์ ⚠️',
                message: `อุปกรณ์ ${equipmentName} (${equipmentNumber}) เลยกำหนดส่งคืนมาแล้ว ${daysOverdue} วัน กรุณานำส่งคืนที่เคาน์เตอร์บริการโดยด่วนที่สุด`,
                related_entity_id: loanId
            })
            
        if (notifError) {
            console.error('Error creating database notification:', notifError.message)
        }

        // 2. WeLPRU & Discord notification using notifyAndLog helper
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        const discordMessage = `
⚠️ **แจ้งเตือนเลยกำหนดส่งคืน (Overdue Loan Reminder)**

👤 **ผู้ยืม:** ${fullName}
📧 **อีเมล:** ${profile?.email || '-'}
📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})
📅 **กำหนดคืนเดิม:** ${formatThaiDate(loan.end_date)}
⏰ **เลยกำหนดสะสม:** \`${daysOverdue} วัน\`

🔗 [ตรวจสอบประวัติยืมคืน](${appUrl}/my-loans)
        `.trim()

        const { notifyAndLog } = await import('@/lib/serverNotify')
        await notifyAndLog({
            discordMessage,
            discordType: 'loan',
            welpruUserIds: studentWelpruId ? [studentWelpruId] : [],
            welpruTitle: 'แจ้งเตือนเลยกำหนดส่งคืนอุปกรณ์ ⚠️',
            welpruBody: `คอมพิวเตอร์ ${equipmentName} เลยกำหนดส่งคืนมาแล้ว ${daysOverdue} วัน กรุณานำมาคืนโดยด่วน`,
        })

        return { success: true }
    } catch (error: any) {
        console.error('Error notifying overdue loan:', error)
        return { success: false, error: error.message }
    }
}

