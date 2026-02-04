'use server'

import { createClient } from '@/lib/supabase/server'
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

// Delete user
export async function deleteUser(userId: string) {
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

    // 2. Prevent self-deletion
    if (userId === user.id) {
        throw new Error('ไม่สามารถลบบัญชีของตัวเองได้')
    }

    // 3. Delete related records first (due to foreign key constraints)
    // Delete notifications
    await supabase.from('notifications' as any).delete().eq('user_id', userId)

    // Delete evaluations
    await supabase.from('evaluations' as any).delete().eq('user_id', userId)

    // Delete loan requests
    await supabase.from('loanRequests' as any).delete().eq('user_id', userId)

    // Delete reservations
    await supabase.from('reservations' as any).delete().eq('user_id', userId)

    // Delete support messages (for tickets owned by user)
    const { data: userTickets } = await supabase
        .from('support_tickets' as any)
        .select('id')
        .eq('user_id', userId)

    if (userTickets && userTickets.length > 0) {
        const ticketIds = userTickets.map((t: any) => t.id)
        await supabase.from('support_messages' as any).delete().in('ticket_id', ticketIds)
    }

    // Delete support tickets
    await supabase.from('support_tickets' as any).delete().eq('user_id', userId)

    // Delete staff activity logs (if user was staff)
    await supabase.from('staff_activity_log' as any).delete().eq('staff_id', userId)

    // 4. Finally delete the user profile
    const { error } = await supabase
        .from('profiles' as any)
        .delete()
        .eq('id', userId)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/users')
    return { success: true }
}

