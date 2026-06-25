'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import { sendApprovalEmail } from '@/lib/email'
import { sendDiscordNotification, sendWeLPRUNotification } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import {
    updateUserStatusSchema,
    updateUserRoleSchema,
    bulkUpdateUserStatusSchema,
    updateUserProfileSchema,
    uuidSchema
} from '@/lib/schemas'

export async function updateUserStatus(
    userId: string,
    newStatus: 'approved' | 'rejected' | 'pending',
    rejectReason?: string
) {
    // 1. Zod Validation
    const parsed = updateUserStatusSchema.safeParse({ userId, newStatus, rejectReason })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // 2. Check Admin Permission
    const auth = await requireAdmin()
    if (auth.error) return { error: auth.error }

    // Prevent self-status modification
    if (userId === auth.user!.id) {
        return { error: 'ไม่สามารถเปลี่ยนสถานะบัญชีของตัวเองได้' }
    }

    // 3. Create admin client (requires SUPABASE_SERVICE_ROLE_KEY)
    let adminClient
    try {
        adminClient = createAdminClient()
    } catch (e: any) {
        console.error('[updateUserStatus] createAdminClient failed:', e)
        return { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: กรุณาตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในระบบ' }
    }

    // 4. Update Status and Rejection Reason
    const updates = {
        status: newStatus,
        reject_reason: newStatus === 'rejected' ? (rejectReason || null) : null
    }

    const { error, data: updatedUser } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('email, first_name, last_name, title')
        .single()

    if (error) return { error: error.message }

    // 4. Send Notifications (Email, Discord, WeLPRU)
    if (updatedUser) {
        const fullName = `${updatedUser.title || ''}${updatedUser.first_name} ${updatedUser.last_name || ''}`.trim()
        
        if (newStatus === 'approved') {
            try { await sendApprovalEmail(updatedUser.email, fullName) } catch (e) { console.error(e) }
            try { await sendDiscordNotification(`✅ **บัญชีได้รับการอนุมัติ**\nผู้ใช้: ${fullName} (${updatedUser.email})\nโดย: ${auth.user?.email || 'Admin'}`, 'auth') } catch (e) { console.error(e) }
            try { await sendWeLPRUNotification({ userIds: [userId], title: 'บัญชีได้รับการอนุมัติ 🎉', body: 'บัญชีของคุณผ่านการอนุมัติ คุณสามารถเริ่มใช้งานฟีเจอร์ยืมและจองอุปกรณ์ได้ทันที' }) } catch (e) { console.error(e) }
        } else if (newStatus === 'rejected') {
            try { await sendDiscordNotification(`❌ **บัญชีถูกปฏิเสธ**\nผู้ใช้: ${fullName} (${updatedUser.email})\nโดย: ${auth.user?.email || 'Admin'}`, 'auth') } catch (e) { console.error(e) }
            try { await sendWeLPRUNotification({ userIds: [userId], title: 'บัญชีไม่ผ่านการอนุมัติ ❌', body: 'บัญชีของคุณไม่ผ่านการอนุมัติสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }) } catch (e) { console.error(e) }
        }
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

    // Prevent self-role modification
    if (userId === auth.user!.id) {
        return { error: 'ไม่สามารถเปลี่ยนสิทธิ์การเข้าถึงของตัวเองได้' }
    }

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

    // Prevent self-status modification in bulk update
    if (userIds.includes(auth.user!.id)) {
        return { error: 'ไม่สามารถเปลี่ยนสถานะบัญชีของตัวเองในรายการกลุ่มได้' }
    }

    // 3. Create admin client (requires SUPABASE_SERVICE_ROLE_KEY)
    let adminClient
    try {
        adminClient = createAdminClient()
    } catch (e: any) {
        console.error('[updateMultipleUserStatus] createAdminClient failed:', e)
        return { error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: กรุณาตั้งค่า SUPABASE_SERVICE_ROLE_KEY ในระบบ' }
    }

    // 4. Get users for email/discord notification
    let usersToNotify: any[] = []
    if (newStatus === 'approved' || newStatus === 'rejected') {
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

    // 5. Send Notifications
    if (usersToNotify.length > 0) {
        if (newStatus === 'approved') {
            // Email
            const emailPromises = usersToNotify.map(u => {
                const fullName = `${u.title || ''}${u.first_name} ${u.last_name || ''}`.trim()
                return sendApprovalEmail(u.email, fullName)
            })
            await Promise.allSettled(emailPromises)
            
            // Discord & WeLPRU
            try {
                const names = usersToNotify.map(u => `${u.first_name} ${u.last_name || ''}`).join(', ')
                await sendDiscordNotification(`✅ **อนุมัติบัญชีกลุ่ม (${usersToNotify.length} คน)**\nผู้ใช้: ${names}\nโดย: ${auth.user?.email || 'Admin'}`, 'auth')
                const ids = usersToNotify.map(u => u.id)
                await sendWeLPRUNotification({ userIds: ids, title: 'บัญชีได้รับการอนุมัติ 🎉', body: 'บัญชีของคุณผ่านการอนุมัติ คุณสามารถเริ่มใช้งานฟีเจอร์ยืมและจองอุปกรณ์ได้ทันที' })
            } catch (e) { console.error(e) }
        } else if (newStatus === 'rejected') {
            try {
                const names = usersToNotify.map(u => `${u.first_name} ${u.last_name || ''}`).join(', ')
                await sendDiscordNotification(`❌ **ปฏิเสธบัญชีกลุ่ม (${usersToNotify.length} คน)**\nผู้ใช้: ${names}\nโดย: ${auth.user?.email || 'Admin'}`, 'auth')
                const ids = usersToNotify.map(u => u.id)
                await sendWeLPRUNotification({ userIds: ids, title: 'บัญชีไม่ผ่านการอนุมัติ ❌', body: 'บัญชีของคุณไม่ผ่านการอนุมัติสิทธิ์การใช้งาน กรุณาติดต่อผู้ดูแลระบบ' })
            } catch (e) { console.error(e) }
        }
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
        user_id?: string
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
        departmentId: data.department_id,
        user_id: data.user_id
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
            user_id: data.user_id,
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
        adminClient.from('data_backups').update({ created_by: null }).eq('created_by', userId),
        adminClient.from('staff_activity_log').update({ staff_id: null }).eq('staff_id', userId),
        adminClient.from('staff_activity_log').update({ target_user_id: null }).eq('target_user_id', userId)
    ])

    // Delete user's data (History)
    await Promise.all([
        adminClient.from('loanRequests').delete().eq('user_id', userId),
        adminClient.from('reservations').delete().eq('user_id', userId),
        adminClient.from('notifications').delete().eq('user_id', userId),
        adminClient.from('evaluations').delete().eq('user_id', userId)
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

