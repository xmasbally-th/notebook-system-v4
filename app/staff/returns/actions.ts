'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyAndLog } from '@/lib/serverNotify'
import { requireStaff } from '@/lib/auth-guard'
import { z } from 'zod'

const returnLoanSchema = z.object({
    loanId: z.string().uuid(),
    equipmentId: z.string().uuid(),
    condition: z.enum(['good', 'damaged', 'lost', 'missing_parts']),
    notes: z.string().optional()
})

export async function returnLoan(formData: {
    loanId: string
    equipmentId: string
    condition: 'good' | 'damaged' | 'lost' | 'missing_parts'
    notes?: string
}) {
    // 1. Validate Input
    const parsed = returnLoanSchema.safeParse(formData)
    if (!parsed.success) {
        return { success: false, error: 'ข้อมูลไม่ถูกต้อง' }
    }
    const { loanId, equipmentId, condition, notes } = parsed.data

    // 2. Auth Guard
    const { user, profile, error: authError } = await requireStaff()
    if (authError || !user || !profile) {
        return { success: false, error: authError || 'Unauthorized: Staff access required' }
    }

    const supabase = await createClient()

    try {
        // Fetch loan details including borrower name & equipment info
        const { data: loan, error: loanFetchError } = await supabase
            .from('loanRequests')
            .select('*, equipment(name, equipment_number), profiles(first_name, last_name, user_id)')
            .eq('id', loanId)
            .single()

        if (loanFetchError || !loan) {
            return { success: false, error: 'ไม่พบข้อมูลการยืม' }
        }

        if (loan.status === 'returned') {
            return { success: false, error: 'รายการนี้ทำคืนเรียบร้อยแล้ว' }
        }

        // Update loan status to returned, return_condition, return_notes
        const { error: loanUpdateError } = await supabase
            .from('loanRequests')
            .update({
                status: 'returned',
                returned_at: new Date().toISOString(),
                return_condition: condition,
                return_notes: notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', loanId)

        if (loanUpdateError) {
            throw new Error(`Failed to update loan status: ${loanUpdateError.message}`)
        }

        // Update equipment status based on return condition
        // good -> ready, damaged/lost -> maintenance
        const newEquipmentStatus = condition === 'good' ? 'ready' : 'maintenance'
        const { error: equipmentUpdateError } = await supabase
            .from('equipment')
            .update({
                status: newEquipmentStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', equipmentId)

        if (equipmentUpdateError) {
            console.error('Failed to update equipment status:', equipmentUpdateError)
        }

        // Notify and log activity
        const equipmentName = loan.equipment?.name || 'Unknown Equipment'
        const equipmentNumber = loan.equipment?.equipment_number || 'No Number'
        const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'Unknown User'
        const studentWelpruId = (loan.profiles as any)?.user_id

        const staffName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Staff'

        await notifyAndLog({
            eventKey: 'loan_returned',
            discordMessage:
                `📥 **คืนอุปกรณ์แล้ว (Returned)**\n\n` +
                `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
                `👤 **ผู้ยืม:** ${borrowerName}\n` +
                `🔧 **สภาพส่งคืน:** ${condition === 'good' ? '🟢 ดี' : condition === 'damaged' ? '🟡 ชำรุด' : condition === 'missing_parts' ? '🟠 ขาดชิ้นส่วน' : '🔴 สูญหาย'}\n` +
                `💬 **หมายเหตุ:** ${notes || '-'}\n` +
                `👮 **ผู้รับคืน:** ${staffName} (${profile.role})`,
            discordType: 'loan',
            welpruUserIds: studentWelpruId ? [studentWelpruId] : [],
            welpruVariables: { equipment: equipmentName, borrower: borrowerName, condition: condition === 'good' ? 'ดี' : 'ชำรุด/ขาดชิ้นส่วน/สูญหาย' },
            activity: {
                staffId: user.id,
                staffRole: profile.role as 'staff' | 'admin',
                actionType: 'mark_returned',
                targetType: 'loan',
                targetId: loanId,
                targetUserId: loan.user_id,
                isSelfAction: loan.user_id === user.id,
                details: { condition, notes },
            },
        })

        // Revalidate Paths
        revalidatePath('/staff/returns')
        revalidatePath('/staff/dashboard')
        revalidatePath('/my-loans')

        return { success: true }
    } catch (e: any) {
        console.error('[returnLoan] Error:', e)
        return { success: false, error: e.message || 'เกิดข้อผิดพลาดในการดำเนินการ' }
    }
}
