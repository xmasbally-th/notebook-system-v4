import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type NotificationType = 'general' | 'auth' | 'loan' | 'reservation' | 'maintenance'

// ─── Retry helper ─────────────────────────────────────────────────────────────

/**
 * Sends a fetch request with exponential-backoff retry.
 * Retries on network errors or non-2xx HTTP responses.
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 2
): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options)
            if (response.ok) return response

            // Rate-limited by Discord — wait longer
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After')
                const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (attempt + 1)
                await new Promise((r) => setTimeout(r, waitMs))
                continue
            }

            lastError = new Error(`Discord returned ${response.status}: ${await response.text()}`)
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
        }

        // Exponential backoff before next retry: 500ms, 1000ms, ...
        if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)))
        }
    }

    throw lastError ?? new Error('Discord notification failed after retries')
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function sendDiscordNotification(message: string, type: NotificationType = 'general') {
    try {
        let discordWebhookUrl: string | null = null

        // Helper to select the correct webhook URL based on type
        const getWebhookUrl = (config: any): string | null => {
            switch (type) {
                case 'auth':
                    return config.discord_webhook_auth || config.discord_webhook_url || null
                case 'reservation':
                    return config.discord_webhook_reservations || config.discord_webhook_url || null
                case 'maintenance':
                    return config.discord_webhook_maintenance || config.discord_webhook_url || null
                case 'loan':
                case 'general':
                default:
                    return config.discord_webhook_url || null
            }
        }

        // 1. Fetch config using Service Role (bypasses RLS — most reliable)
        // system_config is a single-row table with id = 1
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
                const supabaseAdmin = createSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY
                )
                const { data: config } = await supabaseAdmin
                    .from('system_config')
                    .select('discord_webhook_url, discord_webhook_auth, discord_webhook_reservations, discord_webhook_maintenance')
                    .eq('id', 1)
                    .single()

                if (config) {
                    discordWebhookUrl = getWebhookUrl(config)
                }
            } catch (e) {
                console.error('[Discord] Failed to fetch config with Service Role:', e)
            }
        }

        if (!discordWebhookUrl) {
            console.warn(`[Discord] Webhook not configured for type: ${type}`)
            return
        }

        // 2. Send with retry
        await fetchWithRetry(
            discordWebhookUrl,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: message,
                    username: 'Notebook System Bot',
                }),
            },
            2 // up to 3 total attempts
        )
    } catch (error) {
        // Never throw — notification failures must not break the main action
        console.error('[Discord] Error in sendDiscordNotification:', error)
    }
}

