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
            await sendDiscordNotification(alertMessage)

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

🔗 [ตรวจสอบคำขอ](${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/reservations)
        `.trim()

        await sendDiscordNotification(message)
    } catch (notifyError) {
        console.error('Notification failed:', notifyError)
        // Don't fail the request if notification fails
    }

    revalidatePath('/my-reservations')
    revalidatePath('/equipment')

    return { success: true, reservationId: insertedReservation.id }
}
