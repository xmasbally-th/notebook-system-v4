'use server'

import { sendDiscordNotification } from '@/lib/notifications'
import { createClient } from '@/lib/supabase/server'

export async function notifyNewRegistration(userId: string) {
    const supabase = await createClient()

    // Fetch user details for the message
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('first_name, last_name, email, departments(name)')
        .eq('id', userId)
        .single()

    if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        const dept = profile.departments?.name || 'N/A'

        const message = `
**🔔 New User Registration**
**Name:** ${fullName}
**Email:** ${profile.email}
**Department:** ${dept}
**Status:** Pending Approval
        `.trim()

        await sendDiscordNotification(message)
    }
}
