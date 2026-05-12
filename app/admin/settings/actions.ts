'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWeLPRUNotification, sendWeLPRUGroupBroadcast } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'

export async function sendManualNotification(params: {
    type: 'group' | 'individual'
    targetGroup?: 'all' | 'student' | 'personnel'
    userIds?: string[]
    title: string
    body: string
    link?: string
}) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' }
        }

        // Verify admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return { success: false, error: 'Permission denied' }
        }

        if (params.type === 'group' && params.targetGroup) {
            const res = await sendWeLPRUGroupBroadcast({
                targetGroup: params.targetGroup,
                title: params.title,
                body: params.body
            })
            if (res && !res.success) {
                 return { success: false, error: res.error }
            }
        } else if (params.type === 'individual' && params.userIds && params.userIds.length > 0) {
            const res = await sendWeLPRUNotification({
                userIds: params.userIds,
                title: params.title,
                body: params.body,
                link: params.link
            })
            if (res && !res.success) {
                 return { success: false, error: res.error }
            }
        } else {
            return { success: false, error: 'Invalid parameters' }
        }

        return { success: true }
    } catch (error: any) {
        console.error('sendManualNotification Error:', error)
        return { success: false, error: error?.message || 'Failed to send notification' }
    }
}
