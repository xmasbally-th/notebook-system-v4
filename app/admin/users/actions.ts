'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendApprovalEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export async function updateUserStatus(userId: string, newStatus: 'approved' | 'rejected' | 'pending') {
    const supabase = await createClient()

    // 1. Check Admin Permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    // 2. Update Status
    const { error, data: updatedUser } = await supabase
        .from('profiles' as any)
        .update({ status: newStatus })
        .eq('id', userId)
        .select('email, first_name, last_name, title')
        .single()

    if (error) throw new Error(error.message)

    // 3. Send Email if Approved
    if (newStatus === 'approved' && updatedUser) {
        const fullName = `${updatedUser.title || ''}${updatedUser.first_name} ${updatedUser.last_name || ''}`.trim()
        await sendApprovalEmail(updatedUser.email, fullName)
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'staff' | 'user') {
    const supabase = await createClient()

    // 1. Check Admin Permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    // 2. Update Role
    const { error } = await supabase
        .from('profiles' as any)
        .update({ role: newRole })
        .eq('id', userId)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/users')
    return { success: true }
}

// Bulk update multiple users' status
export async function updateMultipleUserStatus(
    userIds: string[],
    newStatus: 'approved' | 'rejected' | 'pending'
) {
    const supabase = await createClient()

    // 1. Check Admin Permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    // 2. Get users for email notification
    let usersToNotify: any[] = []
    if (newStatus === 'approved') {
        const { data } = await supabase
            .from('profiles' as any)
            .select('id, email, first_name, last_name, title')
            .in('id', userIds)

        usersToNotify = data || []
    }

    // 3. Batch Update Status
    const { error } = await supabase
        .from('profiles' as any)
        .update({ status: newStatus })
        .in('id', userIds)

    if (error) throw new Error(error.message)

    // 4. Send Approval Emails (if approved)
    if (newStatus === 'approved' && usersToNotify.length > 0) {
        const emailPromises = usersToNotify.map(u => {
            const fullName = `${u.title || ''}${u.first_name} ${u.last_name || ''}`.trim()
            return sendApprovalEmail(u.email, fullName)
        })

        // Send emails in parallel
        await Promise.allSettled(emailPromises)
    }

    revalidatePath('/admin/users')
    return { success: true, count: userIds.length }
}

// Update user profile information
export async function updateUserProfile(
    userId: string,
    data: {
        first_name?: string
        last_name?: string
        title?: string
        phone_number?: string
        user_type?: string
        department_id?: string | null
    }
) {
    const supabase = await createClient()

    // 1. Check Admin Permission
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
        .from('profiles' as any)
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminProfile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    // 2. Update Profile
    const { error } = await supabase
        .from('profiles' as any)
        .update({
            first_name: data.first_name,
            last_name: data.last_name,
            title: data.title,
            phone_number: data.phone_number,
            user_type: data.user_type,
            department_id: data.department_id,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/users')
    return { success: true }
}

// Delete user - uses admin client to bypass RLS
export async function deleteUser(userId: string) {
    try {
        const supabase = await createClient()

        // 1. Check Admin Permission with regular client
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: adminProfile } = await supabase
            .from('profiles' as any)
            .select('role')
            .eq('id', user.id)
            .single()

        if (adminProfile?.role !== 'admin') {
            throw new Error('Forbidden: Admin access required')
        }

        // 2. Prevent self-deletion
        if (userId === user.id) {
            throw new Error('ไม่สามารถลบบัญชีของตัวเองได้')
        }

        // 3. Use admin client to bypass RLS for delete operations
        const adminClient = createAdminClient()

        // 4. Check for blocking conditions (Active Loans/Reservations)
        const { count: activeLoanCount, error: loanError } = await adminClient
            .from('loanRequests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'approved')

        if (loanError) throw new Error(`ไม่สามารถตรวจสอบการยืมได้: ${loanError.message}`)
        if (activeLoanCount && activeLoanCount > 0) {
            throw new Error(`ไม่สามารถลบผู้ใช้ได้ เนื่องจากยังมีรายการยืมที่ "กำลังยืม" อยู่ (กรุณาทำรายการคืนก่อน)`)
        }

        const { count: activeResCount, error: resError } = await adminClient
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('status', ['approved', 'ready'])

        if (resError) throw new Error(`ไม่สามารถตรวจสอบการจองได้: ${resError.message}`)
        if (activeResCount && activeResCount > 0) {
            throw new Error(`ไม่สามารถลบผู้ใช้ได้ เนื่องจากยังมีรายการจองที่ "อนุมัติแล้ว/รอรับของ" (กรุณาทำรายการหรือยกเลิกก่อน)`)
        }

        // 5. Delete/Update related records (Cleanup logic)

        // Clear approved_by/created_by references in related tables
        await Promise.all([
            adminClient.from('loanRequests').update({ approved_by: null }).eq('approved_by', userId),
            adminClient.from('reservations').update({ approved_by: null }).eq('approved_by', userId),
            adminClient.from('reservations').update({ ready_by: null }).eq('ready_by', userId),
            adminClient.from('reservations').update({ completed_by: null }).eq('completed_by', userId),
            adminClient.from('special_loan_requests').update({ created_by: null }).eq('created_by', userId),
            adminClient.from('special_loan_requests').update({ approved_by: null }).eq('approved_by', userId),
            adminClient.from('support_messages').update({ sender_id: null }).eq('sender_id', userId),
            adminClient.from('data_backups').update({ deleted_by: null }).eq('deleted_by', userId),
            adminClient.from('data_backups').update({ restored_by: null }).eq('restored_by', userId)
        ])

        // Delete user's data (Loans, Reservations, Notifications, Evaluations)
        // Note: Active loans/reservations are already blocked above, so these are safe to delete (history)
        await Promise.all([
            adminClient.from('loanRequests').delete().eq('user_id', userId),
            adminClient.from('reservations').delete().eq('user_id', userId),
            adminClient.from('notifications').delete().eq('user_id', userId),
            adminClient.from('evaluations').delete().eq('user_id', userId),
            adminClient.from('support_tickets').delete().eq('user_id', userId)
        ])

        // Handle support_messages linked to deleted tickets 
        // (Supabase CASCADE might handle this, but explicit cleanup is safer if not set)

        // Log Anonymization (instead of delete)
        // If user was staff, anonymize their actions
        await adminClient.from('staff_activity_log').update({ staff_id: null }).eq('staff_id', userId)
        // If user was a target of an action, anonymize target
        await adminClient.from('staff_activity_log').update({ target_user_id: null }).eq('target_user_id', userId)



        // 5. Finally delete the user profile
        const { error } = await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (error) {
            console.error('Delete profile error:', error)
            throw new Error(`ไม่สามารถลบผู้ใช้ได้: ${error.message}`)
        }

        // 6. Delete from Auth (Supabase Authentication)
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

        if (authError) {
            console.error('Delete auth user error:', authError)
            return { success: false, error: `ลบข้อมูลใน Database สำเร็จ แต่ลบใน Auth ไม่สำเร็จ: ${authError.message}` }
        }

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error: any) {
        console.error('deleteUser error:', error)
        return { success: false, error: error.message || 'เกิดข้อผิดพลาดในการลบผู้ใช้' }
    }
}

