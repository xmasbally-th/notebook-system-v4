'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendDiscordNotification } from '@/lib/notifications'

export async function approveLoan(loanId: string) {
    console.log('[approveLoan] Starting approval for loan:', loanId)
    const supabase = await createClient()

    try {
        // 1. Check authentication/authorization
        console.log('[approveLoan] Checking authentication...')
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
            console.error('[approveLoan] Auth error:', authError)
            throw new Error('Authentication failed: ' + authError.message)
        }

        if (!user) {
            console.error('[approveLoan] No user found')
            throw new Error('Unauthorized: Please login first')
        }

        console.log('[approveLoan] User authenticated:', user.id)

        // Check if user is staff or admin
        console.log('[approveLoan] Checking user role...')
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('[approveLoan] Profile fetch error:', profileError)
            throw new Error('Failed to fetch profile: ' + profileError.message)
        }

        if (!profile || !['admin', 'staff'].includes(profile.role)) {
            console.error('[approveLoan] User role not authorized:', profile?.role)
            throw new Error('Unauthorized: Staff access required')
        }

        console.log('[approveLoan] User role verified:', profile.role)

        // 2. Update loan status
        console.log('[approveLoan] Updating loan status...')
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

        if (error) {
            console.error('[approveLoan] Update error:', error)
            throw new Error(`Failed to approve loan: ${error.message}`)
        }
        if (!loan) {
            console.error('[approveLoan] Loan not found after update')
            throw new Error('Loan not found')
        }

        console.log('[approveLoan] Loan updated successfully:', loan.id)

        // 3. Send Discord Notification
        const equipmentName = loan.equipment?.name || 'Unknown Equipment'
        const equipmentNumber = loan.equipment?.equipment_number || 'No Number'
        const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'Unknown User'

        console.log('[approveLoan] Sending Discord notification...')
        await sendDiscordNotification(
            `✅ **อนุมัติคำขอยืม (Approved)**\n\n` +
            `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
            `👤 **ผู้ยืม:** ${borrowerName}\n` +
            `📅 **วันที่:** ${new Date(loan.start_date).toLocaleDateString('th-TH')} - ${new Date(loan.end_date).toLocaleDateString('th-TH')}\n` +
            `👮 **อนุมัติโดย:** Staff`
        )

        // 4. Revalidate paths
        console.log('[approveLoan] Revalidating paths...')
        revalidatePath('/staff/loans')
        revalidatePath('/staff/dashboard')
        revalidatePath('/my-loans') // For the user

        console.log('[approveLoan] Approval complete!')
        return { success: true }
    } catch (error: any) {
        console.error('[approveLoan] Error:', error)
        return { success: false, error: error.message }
    }
}
