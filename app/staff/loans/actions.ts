'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendDiscordNotification } from '@/lib/notifications'

export async function approveLoan(loanId: string) {
    const supabase = await createClient()

    try {
        // 1. Check authentication/authorization
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // Check if user is staff or admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['admin', 'staff'].includes(profile.role)) {
            throw new Error('Unauthorized: Staff access required')
        }

        // 2. Update loan status
        const { data: loan, error } = await supabase
            .from('loanRequests')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('id', loanId)
            // Select relations for notification message
            .select('*, equipment(name, equipment_number), profiles(first_name, last_name)')
            .single()

        if (error) throw new Error(`Failed to approve loan: ${error.message}`)
        if (!loan) throw new Error('Loan not found')

        // 3. Send Discord Notification
        const equipmentName = loan.equipment?.name || 'Unknown Equipment'
        const equipmentNumber = loan.equipment?.equipment_number || 'No Number'
        const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'Unknown User'

        await sendDiscordNotification(
            `✅ **อนุมัติคำขอยืม (Approved)**\n\n` +
            `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
            `👤 **ผู้ยืม:** ${borrowerName}\n` +
            `📅 **วันที่:** ${new Date(loan.start_date).toLocaleDateString('th-TH')} - ${new Date(loan.end_date).toLocaleDateString('th-TH')}\n` +
            `👮 **อนุมัติโดย:** Staff`
        )

        // 4. Revalidate paths
        revalidatePath('/staff/loans')
        revalidatePath('/staff/dashboard')
        revalidatePath('/my-loans') // For the user

        return { success: true }
    } catch (error: any) {
        console.error('[approveLoan] Error:', error)
        return { success: false, error: error.message }
    }
}
