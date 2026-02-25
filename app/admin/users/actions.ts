'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import { sendApprovalEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'
import {
    updateUserStatusSchema,
    updateUserRoleSchema,
    bulkUpdateUserStatusSchema,
    updateUserProfileSchema,
    uuidSchema
} from '@/lib/schemas'

export async function updateUserStatus(userId: string, newStatus: 'approved' | 'rejected' | 'pending') {
    // 1. Zod Validation
    const parsed = updateUserStatusSchema.safeParse({ userId, newStatus })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Check Admin Permission
    const auth = await requireAdmin()
    if (auth.error) return { error: auth.error }

    const adminClient = createAdminClient()

    // 3. Update Status
    const { error, data: updatedUser } = await adminClient
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId)
        .select('email, first_name, last_name, title')
        .single()

    if (error) return { error: error.message }

    // 4. Send Email if Approved
    if (newStatus === 'approved' && updatedUser) {
        const fullName = `${updatedUser.title || ''}${updatedUser.first_name} ${updatedUser.last_name || ''}`.trim()
        await sendApprovalEmail(updatedUser.email, fullName)
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'staff' | 'user') {
    // 1. Zod Validation
    const parsed = updateUserRoleSchema.safeParse({ userId, newRole })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Check Admin Permission
    const auth = await requireAdmin()
    if (auth.error) return { error: auth.error }

    const adminClient = createAdminClient()

    // 3. Update Role
    const { error } = await adminClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

// Bulk update multiple users' status
export async function updateMultipleUserStatus(
    userIds: string[],
    newStatus: 'approved' | 'rejected' | 'pending'
) {
    // 1. Zod Validation
    const parsed = bulkUpdateUserStatusSchema.safeParse({ userIds, newStatus })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Check Admin Permission
    const auth = await requireAdmin()
    if (auth.error) return { error: auth.error }

    const adminClient = createAdminClient()

    // 3. Get users for email notification
    let usersToNotify: any[] = []
    if (newStatus === 'approved') {
        const { data } = await adminClient
            .from('profiles')
            .select('id, email, first_name, last_name, title')
            .in('id', userIds)

        usersToNotify = data || []
    }

    // 4. Batch Update Status
    const { error } = await adminClient
        .from('profiles')
        .update({ status: newStatus })
        .in('id', userIds)

    if (error) return { error: error.message }

    // 5. Send Approval Emails (if approved)
    if (newStatus === 'approved' && usersToNotify.length > 0) {
        const emailPromises = usersToNotify.map(u => {
            const fullName = `${u.title || ''}${u.first_name} ${u.last_name || ''}`.trim()
            return sendApprovalEmail(u.email, fullName)
        })
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
    // 1. Zod Validation
    const parsed = updateUserProfileSchema.safeParse({
        userId,
        firstName: data.first_name,
        lastName: data.last_name,
        title: data.title,
        phoneNumber: data.phone_number,
        userType: data.user_type,
        departmentId: data.department_id
    })

    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Check Admin Permission
    const auth = await requireAdmin()
    if (auth.error) return { error: auth.error }

    const adminClient = createAdminClient()

    // 3. Update Profile
    const { error } = await adminClient
        .from('profiles')
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

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}

// Delete user - uses admin client to bypass RLS
export async function deleteUser(userId: string) {
    // 1. Zod Validation
    const parsed = uuidSchema.safeParse(userId)
    if (!parsed.success) {
        return { success: false, error: 'ID ผู้ใช้ไม่ถูกต้อง' }
    }

    // 2. Check Admin Permission
    const { user: currentUser, error: guardError } = await requireAdmin()
    if (guardError) return { success: false, error: guardError }

    // 3. Prevent self-deletion
    if (userId === currentUser!.id) {
        return { success: false, error: 'ไม่สามารถลบบัญชีของตัวเองได้' }
    }

    // 4. Use admin client to bypass RLS for delete operations
    const adminClient = createAdminClient()

    // 5. Check for blocking conditions (Active Loans/Reservations)
    const { count: activeLoanCount, error: loanError } = await adminClient
        .from('loanRequests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'approved')

    if (loanError) return { success: false, error: `ไม่สามารถตรวจสอบการยืมได้: ${loanError.message}` }
    if (activeLoanCount && activeLoanCount > 0) {
        return { success: false, error: `ไม่สามารถลบผู้ใช้ได้ เนื่องจากยังมีรายการยืมที่ "กำลังยืม" อยู่ (กรุณาทำรายการคืนก่อน)` }
    }

    const { count: activeResCount, error: resError } = await adminClient
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['approved', 'ready'])

    if (resError) return { success: false, error: `ไม่สามารถตรวจสอบการจองได้: ${resError.message}` }
    if (activeResCount && activeResCount > 0) {
        return { success: false, error: `ไม่สามารถลบผู้ใช้ได้ เนื่องจากยังมีรายการจองที่ "อนุมัติแล้ว/รอรับของ" (กรุณาทำรายการหรือยกเลิกก่อน)` }
    }

    // 6. Delete/Update related records (Cleanup logic)
    await Promise.all([
        adminClient.from('loanRequests').update({ approved_by: null }).eq('approved_by', userId),
        adminClient.from('reservations').update({ approved_by: null }).eq('approved_by', userId),
        adminClient.from('reservations').update({ ready_by: null }).eq('ready_by', userId),
        adminClient.from('reservations').update({ completed_by: null }).eq('completed_by', userId),
        adminClient.from('special_loan_requests').update({ created_by: null }).eq('created_by', userId),
        adminClient.from('special_loan_requests').update({ approved_by: null }).eq('approved_by', userId),
        adminClient.from('support_messages').update({ sender_id: null }).eq('sender_id', userId),
        adminClient.from('data_backups').update({ created_by: null }).eq('created_by', userId),
        adminClient.from('staff_activity_log').update({ staff_id: null }).eq('staff_id', userId),
        adminClient.from('staff_activity_log').update({ target_user_id: null }).eq('target_user_id', userId)
    ])

    // Delete user's data (History)
    await Promise.all([
        adminClient.from('loanRequests').delete().eq('user_id', userId),
        adminClient.from('reservations').delete().eq('user_id', userId),
        adminClient.from('notifications').delete().eq('user_id', userId),
        adminClient.from('evaluations').delete().eq('user_id', userId),
        adminClient.from('support_tickets').delete().eq('user_id', userId)
    ])

    // 7. Finally delete the user profile and auth user
    const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (profileError) {
        return { success: false, error: `ไม่สามารถลบโปรไฟล์ได้: ${profileError.message}` }
    }

    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
        return { success: false, error: `ลบโปรไฟล์สำเร็จ แต่ลบใน Auth ไม่สำเร็จ: ${deleteAuthError.message}` }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

