'use server'

import { createClient } from '@/lib/supabase/server'
import { sendDiscordNotification } from '@/lib/notifications'
import { formatThaiDate, formatThaiDateTime } from '@/lib/formatThaiDate'

// Notify new reservation
export async function notifyReservationCreated(reservationId: string) {
    try {
        const supabase = await createClient()

        const { data: reservation } = await (supabase as any)
            .from('reservations')
            .select('*, profiles(first_name, last_name, email, departments(name)), equipment(name, equipment_number)')
            .eq('id', reservationId)
            .single()

        if (!reservation) return

        const profile = reservation.profiles
        const equipment = reservation.equipment
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
        const dept = profile?.departments?.name || '-'
        // Assuming time is stored in start_date/end_dateISO strings

        const message = `
**📅 การจองอุปกรณ์ใหม่ (New Reservation)**

👤 **ผู้จอง:** ${fullName}
🏢 **หน่วยงาน:** ${dept}
📧 **อีเมล:** ${profile?.email}

📦 **อุปกรณ์:** ${equipment?.name}
🔖 **รหัส:** #${equipment?.equipment_number}

📅 **วันที่รับ:** ${formatThaiDate(reservation.start_date)}
📅 **วันที่คืน:** ${formatThaiDate(reservation.end_date)}

🔗 [ตรวจสอบการจอง](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reservations)
        `.trim()

        await sendDiscordNotification(message)
    } catch (error) {
        console.error('Error notifying reservation created:', error)
    }
}

// Notify reservation status change (Approved, Rejected, Ready)
export async function notifyReservationStatusChange(reservationId: string, status: string, byUserId?: string) {
    try {
        const supabase = await createClient()

        const { data: reservation } = await (supabase as any)
            .from('reservations')
            .select('*, profiles(first_name, last_name, email), equipment(name, equipment_number)')
            .eq('id', reservationId)
            .single()

        if (!reservation) return

        const profile = reservation.profiles
        const equipment = reservation.equipment
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

        await sendDiscordNotification(message)
    } catch (error) {
        console.error('Error notifying reservation status:', error)
    }
}

// Notify Return
export async function notifyReturn(loanId: string, condition: string, notes?: string) {
    try {
        const supabase = await createClient()

        const { data: loan } = await (supabase as any)
            .from('loanRequests')
            .select('*, profiles(first_name, last_name, email), equipment(name, equipment_number)')
            .eq('id', loanId)
            .single()

        if (!loan) return

        const profile = loan.profiles
        const equipment = loan.equipment
        const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()

        const isDamaged = condition !== 'good'
        const header = isDamaged ? '**⚠️ คืนอุปกรณ์ (มีปัญหา/ชำรุด) (Returned with Issues)**' : '**✅ คืนอุปกรณ์สำเร็จ (Returned)**'

        const message = `
${header}

👤 **ผู้ยืม:** ${fullName}
📦 **อุปกรณ์:** ${equipment?.name} (${equipment?.equipment_number})

📅 **วันที่คืนจริง:** ${formatThaiDateTime(new Date())}
🛠 **สภาพ:** ${condition === 'good' ? 'ปกติ' : condition === 'damaged' ? 'ชำรุด' : 'อุปกรณ์ไม่ครบ'}
${notes ? `📝 **หมายเหตุ:** ${notes}` : ''}

🔗 [ตรวจสอบรายการคืน](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/returns)
        `.trim()

        await sendDiscordNotification(message)
    } catch (error) {
        console.error('Error notifying return:', error)
    }
}
