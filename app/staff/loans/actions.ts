'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendDiscordNotification } from '@/lib/notifications'
import type { ActionType } from '@/lib/staffActivityLog'

// Server-side function to log staff activity
async function logStaffActivityServer(
    supabase: any,
    entry: {
        staffId: string
        staffRole: 'staff' | 'admin'
        actionType: ActionType
        targetType: 'loan' | 'reservation' | 'notification' | 'special_loan' | 'evaluation'
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

        // 2. Fetch loan details to validate dates
        console.log('[approveLoan] Fetching loan details for validation...')
        const { data: loanToValidate, error: fetchError } = await supabase
            .from('loanRequests')
            .select('start_date, end_date, status')
            .eq('id', loanId)
            .single()

        if (fetchError || !loanToValidate) {
            console.error('[approveLoan] Loan fetch error:', fetchError)
            throw new Error('Loan not found')
        }

        // Check if already approved or rejected
        if (loanToValidate.status !== 'pending') {
            console.error('[approveLoan] Loan is not pending:', loanToValidate.status)
            throw new Error(`คำขอนี้ไม่อยู่ในสถานะรออนุมัติ (สถานะ: ${loanToValidate.status})`)
        }

        // Validate date range: end_date must be >= start_date
        const startDate = new Date(loanToValidate.start_date)
        const endDate = new Date(loanToValidate.end_date)

        // Compare dates without time
        const startDateOnly = new Date(startDate)
        startDateOnly.setHours(0, 0, 0, 0)
        const endDateOnly = new Date(endDate)
        endDateOnly.setHours(0, 0, 0, 0)

        if (endDateOnly < startDateOnly) {
            console.error('[approveLoan] Invalid date range:', { start: loanToValidate.start_date, end: loanToValidate.end_date })
            throw new Error(`ไม่สามารถอนุมัติได้: วันที่คืน (${endDate.toLocaleDateString('th-TH')}) ก่อนวันที่ยืม (${startDate.toLocaleDateString('th-TH')})`)
        }

        // 3. Update loan status
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
            `👮 **อนุมัติโดย:** Staff`,
            'loan'
        )

        // 4. Log staff activity
        console.log('[approveLoan] Logging staff activity...')
        await logStaffActivityServer(supabase, {
            staffId: user.id,
            staffRole: profile.role as 'staff' | 'admin',
            actionType: 'approve_loan',
            targetType: 'loan',
            targetId: loanId,
            targetUserId: loan.user_id,
            isSelfAction: loan.user_id === user.id
        })

        // 5. Revalidate paths
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

// Bulk approve loans with validation
export async function bulkApproveLoans(loanIds: string[]) {
    const results: { id: string; success: boolean; error?: string }[] = []

    for (const id of loanIds) {
        const result = await approveLoan(id)
        results.push({
            id,
            success: result.success,
            error: result.success ? undefined : result.error
        })
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return {
        success: failedCount === 0,
        successCount,
        failedCount,
        results
    }
}

// Reject loan with reason
export async function rejectLoan(loanId: string, reason: string) {
    console.log('[rejectLoan] Starting rejection for loan:', loanId)
    const supabase = await createClient()

    try {
        // 1. Check authentication/authorization
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            throw new Error('Unauthorized: Please login first')
        }

        // Check if user is staff or admin
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile || !['admin', 'staff'].includes(profile.role)) {
            throw new Error('Unauthorized: Staff access required')
        }

        // 2. Update loan status
        const { data: loan, error } = await supabase
            .from('loanRequests')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', loanId)
            .eq('status', 'pending') // Only reject pending loans
            .select('*, equipment(name, equipment_number), profiles(first_name, last_name)')
            .single()

        if (error) {
            console.error('[rejectLoan] Update error:', error)
            throw new Error(`Failed to reject loan: ${error.message}`)
        }
        if (!loan) {
            throw new Error('Loan not found or already processed')
        }

        // 2.5 Send Discord Notification (Added)
        const equipmentName = loan.equipment?.name || 'Unknown Equipment'
        const equipmentNumber = loan.equipment?.equipment_number || 'No Number'
        const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'Unknown User'

        await sendDiscordNotification(
            `❌ **คำขอยืมถูกปฏิเสธ (Rejected)**\n\n` +
            `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
            `👤 **ผู้ยืม:** ${borrowerName}\n` +
            `💬 **เหตุผล:** ${reason}\n` +
            `👮 **ดำเนินการโดย:** Staff`,
            'loan'
        )

        // 3. Log staff activity
        await logStaffActivityServer(supabase, {
            staffId: user.id,
            staffRole: profile.role as 'staff' | 'admin',
            actionType: 'reject_loan',
            targetType: 'loan',
            targetId: loanId,
            targetUserId: loan.user_id,
            isSelfAction: loan.user_id === user.id,
            details: { reason }
        })

        // 4. Revalidate paths
        revalidatePath('/staff/loans')
        revalidatePath('/staff/dashboard')
        revalidatePath('/my-loans')

        return { success: true }
    } catch (error: any) {
        console.error('[rejectLoan] Error:', error)
        return { success: false, error: error.message }
    }
}

// Bulk reject loans
export async function bulkRejectLoans(loanIds: string[], reason: string) {
    const results: { id: string; success: boolean; error?: string }[] = []

    for (const id of loanIds) {
        const result = await rejectLoan(id, reason)
        results.push({
            id,
            success: result.success,
            error: result.success ? undefined : result.error
        })
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    return {
        success: failedCount === 0,
        successCount,
        failedCount,
        results
    }
}
