import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function sendDiscordNotification(message: string) {
    try {
        let discordWebhookUrl: string | null = null

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
                    .select('discord_webhook_url')
                    .eq('id', 1)
                    .single()

                if (config?.discord_webhook_url) {
                    discordWebhookUrl = config.discord_webhook_url
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
                .select('discord_webhook_url')
                .eq('id', 1)
                .single()

            discordWebhookUrl = config?.discord_webhook_url
        }

        if (!discordWebhookUrl) {
            console.warn('Discord Webhook URL not configured (Checked both Service Role and User Session)')
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
