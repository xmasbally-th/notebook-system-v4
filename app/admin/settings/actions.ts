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

const MASK_VALUE = '••••••••••••••••'

function maskSensitiveFields(config: any) {
    if (!config) return null
    const masked = { ...config }
    if (masked.welpru_api_key) masked.welpru_api_key = MASK_VALUE
    if (masked.discord_webhook_url) masked.discord_webhook_url = MASK_VALUE
    if (masked.discord_webhook_auth) masked.discord_webhook_auth = MASK_VALUE
    if (masked.discord_webhook_reservations) masked.discord_webhook_reservations = MASK_VALUE
    if (masked.discord_webhook_maintenance) masked.discord_webhook_maintenance = MASK_VALUE
    return masked
}

export async function getSystemConfigForAdmin() {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized', data: null }
        }

        // Verify admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profile?.role !== 'admin') {
            return { success: false, error: 'Permission denied', data: null }
        }

        const { data, error } = await supabase
            .from('system_config')
            .select('*')
            .eq('id', 1)
            .single()

        if (error) {
            console.error('getSystemConfigForAdmin DB Error:', error)
            return { success: false, error: error.message, data: null }
        }

        return { success: true, data: maskSensitiveFields(data) }
    } catch (error: any) {
        console.error('getSystemConfigForAdmin Error:', error)
        return { success: false, error: error?.message || 'Failed to fetch configuration', data: null }
    }
}

export async function updateSystemConfigAction(updates: any) {
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

        // Filter out masked values
        const cleanUpdates = { ...updates }
        const sensitiveKeys = [
            'welpru_api_key',
            'discord_webhook_url',
            'discord_webhook_auth',
            'discord_webhook_reservations',
            'discord_webhook_maintenance'
        ]

        sensitiveKeys.forEach(key => {
            if (cleanUpdates[key] === MASK_VALUE) {
                delete cleanUpdates[key]
            }
        })

        // Also clean up id and updated_at if present
        delete cleanUpdates.id
        delete cleanUpdates.updated_at

        const { data, error } = await supabase
            .from('system_config')
            .update(cleanUpdates)
            .eq('id', 1)
            .select()
            .single()

        if (error) {
            console.error('updateSystemConfigAction DB Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/admin/settings')
        return { success: true, data: maskSensitiveFields(data) }
    } catch (error: any) {
        console.error('updateSystemConfigAction Error:', error)
        return { success: false, error: error?.message || 'Failed to update configuration' }
    }
}

