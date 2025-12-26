import { createClient } from '@/lib/supabase/server'

export async function sendDiscordNotification(message: string) {
    try {
        const supabase = await createClient()

        // 1. Get Webhook URL
        const { data: config } = await (supabase as any)
            .from('system_config')
            .select('discord_webhook_url')
            .eq('id', 1)
            .single()

        if (!config?.discord_webhook_url) {
            console.warn('Discord Webhook URL not configured')
            return
        }

        // 2. Send Payload
        const response = await fetch(config.discord_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message,
                username: 'Notebook System Bot',
            }),
        })

        if (!response.ok) {
            console.error('Failed to send Discord notification:', await response.text())
        }
    } catch (error) {
        console.error('Error in sendDiscordNotification:', error)
    }
}
