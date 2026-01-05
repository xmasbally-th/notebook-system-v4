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

export async function updateUserRole(userId: string, newRole: 'admin' | 'user') {
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

