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
