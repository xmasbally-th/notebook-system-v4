import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type NotificationType = 'general' | 'auth' | 'loan' | 'reservation' | 'maintenance'

export async function sendDiscordNotification(message: string, type: NotificationType = 'general') {
    try {
        let discordWebhookUrl: string | null = null

        // Helper to select the correct webhook URL based on type
        const getWebhookUrl = (config: any) => {
            switch (type) {
                case 'auth':
                    return config.discord_webhook_auth || config.discord_webhook_url
                case 'reservation':
                    return config.discord_webhook_reservations || config.discord_webhook_url
                case 'maintenance':
                    return config.discord_webhook_maintenance || config.discord_webhook_url
                case 'loan':
                case 'general':
                default:
                    return config.discord_webhook_url
            }
        }

        // 1. Try to get config using Service Role (Bypass RLS)
        // This is robust against RLS policies that might block regular users
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const supabaseAdmin = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                )
                const { data: config } = await supabaseAdmin
                    .from('system_config')
                    .select('*') // Select all columns to get new webhook fields
                    .eq('id', 1)
                    .single()

                if (config) {
                    discordWebhookUrl = getWebhookUrl(config)
                }
            } catch (e) {
                console.error('Failed to fetch config with Service Role:', e)
            }
        }

        // 2. Fallback: Get Webhook URL using user session
        if (!discordWebhookUrl) {
            const supabase = await createClient()
            const { data: config } = await (supabase as any)
                .from('system_config')
                .select('*')
                .eq('id', 1)
                .single()

            if (config) {
                discordWebhookUrl = getWebhookUrl(config)
            }
        }

        if (!discordWebhookUrl) {
            console.warn(`Discord Webhook URL not configured for type: ${type} (Checked both Service Role and User Session)`)
            return
        }

        // 3. Send Payload
        const response = await fetch(discordWebhookUrl, {
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
