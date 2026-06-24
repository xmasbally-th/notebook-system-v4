'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyAndLog } from '@/lib/serverNotify'
import { loanActionSchema, rejectLoanSchema } from '@/lib/schemas'
import { requireStaff } from '@/lib/auth-guard'

export async function approveLoan(loanId: string) {
    // Validate input with Zod
    const parsed = loanActionSchema.safeParse({ loanId })
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || 'รหัสคำขอไม่ถูกต้อง' }
    }

    console.log('[approveLoan] Starting approval for loan:', loanId)

    // 1. Auth Guard — requires staff or admin
    const { user, error: authError } = await requireStaff()
    if (authError || !user) {
        return { success: false, error: authError || 'Unauthorized: Staff access required' }
    }

    const supabase = await createClient()

    try {
        // Fetch role for activity log
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return { success: false, error: 'Profile not found' }
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
            .select('*, equipment(name, equipment_number), profiles!fk_loanrequests_profiles(first_name, last_name)')
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

        // 3. Notify + Log (parallel: Discord + WeLPRU + Activity Log)
        const equipmentName = loan.equipment?.name || 'Unknown Equipment'
        const equipmentNumber = loan.equipment?.equipment_number || 'No Number'
        const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'Unknown User'
        const studentWelpruId = (loan.profiles as any)?.user_id
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        console.log('[approveLoan] Sending notifications + logging activity...')
        await notifyAndLog({
            eventKey: 'loan_approved',
            discordMessage:
                `✅ **อนุมัติคำขอยืม (Approved)**\n\n` +
                `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
                `👤 **ผู้ยืม:** ${borrowerName}\n` +
                `📅 **วันที่:** ${new Date(loan.start_date).toLocaleDateString('th-TH')} - ${new Date(loan.end_date).toLocaleDateString('th-TH')}\n` +
                `👮 **อนุมัติโดย:** Staff\n` +
                `🔗 [ดูรายการยืมของฉัน](${appUrl}/my-loans)`,
            discordType: 'loan',
            welpruUserIds: studentWelpruId ? [studentWelpruId] : [],
            welpruVariables: { equipment: equipmentName, borrower: borrowerName },
            welpruLink: `${appUrl}/my-loans`,
            activity: {
                staffId: user.id,
                staffRole: profile.role as 'staff' | 'admin',
                actionType: 'approve_loan',
                targetType: 'loan',
                targetId: loanId,
                targetUserId: loan.user_id,
                isSelfAction: loan.user_id === user.id,
            },
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
    // Validate input with Zod
    const parsed = rejectLoanSchema.safeParse({ loanId, reason })
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    console.log('[rejectLoan] Starting rejection for loan:', loanId)

    // 1. Auth Guard — requires staff or admin
    const { user, error: authError } = await requireStaff()
    if (authError || !user) {
        return { success: false, error: authError || 'Unauthorized: Staff access required' }
    }

    const supabase = await createClient()

    try {
        // Fetch role for activity log
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return { success: false, error: 'Profile not found' }
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
            .select('*, equipment(name, equipment_number), profiles!fk_loanrequests_profiles(first_name, last_name)')
            .single()

        if (error) {
            console.error('[rejectLoan] Update error:', error)
            throw new Error(`Failed to reject loan: ${error.message}`)
        }
        if (!loan) {
            throw new Error('Loan not found or already processed')
        }

        // 2.5 Notify + Log (parallel: Discord + WeLPRU + Activity Log)
        const equipmentName = loan.equipment?.name || 'Unknown Equipment'
        const equipmentNumber = loan.equipment?.equipment_number || 'No Number'
        const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim() || 'Unknown User'
        const studentWelpruId = (loan.profiles as any)?.user_id
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        await notifyAndLog({
            eventKey: 'loan_rejected',
            discordMessage:
                `❌ **คำขอยืมถูกปฏิเสธ (Rejected)**\n\n` +
                `📦 **อุปกรณ์:** ${equipmentName} (${equipmentNumber})\n` +
                `👤 **ผู้ยืม:** ${borrowerName}\n` +
                `💬 **เหตุผล:** ${reason}\n` +
                `👮 **ดำเนินการโดย:** Staff\n` +
                `🔗 [ดูรายการยืมของฉัน](${appUrl}/my-loans)`,
            discordType: 'loan',
            welpruUserIds: studentWelpruId ? [studentWelpruId] : [],
            welpruVariables: { equipment: equipmentName, borrower: borrowerName, reason },
            welpruLink: `${appUrl}/my-loans`,
            activity: {
                staffId: user.id,
                staffRole: profile.role as 'staff' | 'admin',
                actionType: 'reject_loan',
                targetType: 'loan',
                targetId: loanId,
                targetUserId: loan.user_id,
                isSelfAction: loan.user_id === user.id,
                details: { reason },
            },
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
