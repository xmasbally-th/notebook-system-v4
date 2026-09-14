'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import { sendWeLPRUNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'

export async function sendEvaluationReminder(loanId: string) {
    try {
        const { user, error: authError } = await requireAdmin()
        if (authError || !user) {
            return { success: false, error: authError || 'Unauthorized: ไม่มีสิทธิ์เข้าถึง' }
        }

        const adminClient = createAdminClient()

        // 1. Fetch loan with borrower profile and equipment
        const { data: loan, error: loanError } = await adminClient
            .from('loanRequests')
            .select(`
                id,
                user_id,
                status,
                profiles:user_id(id, first_name, last_name, email, user_id),
                equipment:equipment_id(name, equipment_number)
            `)
            .eq('id', loanId)
            .single()

        if (loanError || !loan) {
            return { success: false, error: 'ไม่พบข้อมูลรายการยืมอุปกรณ์' }
        }

        if (loan.status !== 'returned') {
            return { success: false, error: 'อุปกรณ์ยังไม่ได้ทำการส่งคืน' }
        }

        // Check if evaluation already exists
        const { data: existingEval } = await adminClient
            .from('evaluations')
            .select('id')
            .eq('loan_id', loanId)
            .maybeSingle()

        if (existingEval) {
            return { success: false, error: 'รายการนี้ได้รับการประเมินเรียบร้อยแล้ว' }
        }

        const profile = loan.profiles as any
        const equipment = loan.equipment as any
        const equipmentName = equipment?.name || 'อุปกรณ์'
        const equipmentNumber = equipment?.equipment_number || '-'

        // 2. Insert In-App Notification
        const { error: notifError } = await adminClient
            .from('notifications')
            .insert({
                user_id: loan.user_id,
                type: 'system',
                title: 'แจ้งเตือน: รบกวนประเมินความพึงพอใจการใช้งานอุปกรณ์ ⭐',
                message: `คุณได้ทำการคืน ${equipmentName} (#${equipmentNumber}) เรียบร้อยแล้ว ขอความกรุณาสละเวลาทำแบบประเมินความพึงพอใจเพื่อนำไปพัฒนาการให้บริการ`,
                related_entity_id: loan.id
            })

        if (notifError) {
            console.error('[sendEvaluationReminder] In-app notification error:', notifError)
        }

        // 3. WeLPRU Push Notification if user_id (Student/Staff ID) exists
        const studentWelpruId = profile?.user_id
        if (studentWelpruId) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
            await sendWeLPRUNotification({
                userIds: [studentWelpruId],
                title: 'ประเมินความพึงพอใจการใช้งานอุปกรณ์ ⭐',
                body: `คุณได้ส่งคืน ${equipmentName} เรียบร้อยแล้ว ขอความกรุณาทำแบบประเมินความพึงพอใจเพื่อช่วยเราปรับปรุงบริการ`,
                link: `${appUrl}/my-loans`
            })
        }

        revalidatePath('/admin/evaluations')
        return { success: true, message: `ส่งแจ้งเตือนให้ ${profile?.first_name || 'ผู้ยืม'} เรียบร้อยแล้ว` }
    } catch (err: any) {
        console.error('[sendEvaluationReminder] Error:', err)
        return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการส่งแจ้งเตือน' }
    }
}
