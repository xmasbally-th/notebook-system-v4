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

// ─── WeLPRU Push Notifications ────────────────────────────────────────────────

const WELPRU_API_URL = 'https://api.lpruhub.com/api'

// Helper for safe MSSQL limits
function truncateText(text: string | undefined, maxLength: number): string | undefined {
    if (!text) return text;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function safeLink(link: string | undefined): string | undefined {
    if (!link) return link;
    if (link.length > 255) {
        console.warn(`[WeLPRU] Link exceeds 255 chars, dropping link: ${link.substring(0, 50)}...`);
        return undefined; // Drop link if it's too long instead of breaking it
    }
    return link;
}

export interface WeLPRUDirectMessageParams {
    userIds: string[]; // List of Student IDs or PIDs
    title: string;
    body: string;
    link?: string;
    data?: Record<string, any>;
}

export interface WeLPRUGroupMessageParams {
    targetGroup: 'all' | 'student' | 'personnel';
    title: string;
    body: string;
    data?: Record<string, any>;
}

/**
 * Sends a direct/bulk push notification to specific users via WeLPRU app.
 */
export async function sendWeLPRUNotification(params: WeLPRUDirectMessageParams): Promise<{ success: boolean; error?: string }> {
    try {
        // Read API Key: DB first, fallback to env var
        let apiKey: string | null = null
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            )
            const { data: config } = await supabaseAdmin
                .from('system_config')
                .select('welpru_notifications_enabled, welpru_api_key')
                .eq('id', 1)
                .single()
            if (!(config as any)?.welpru_notifications_enabled) return { success: false, error: 'WeLPRU notifications are disabled in settings' }
            apiKey = (config as any)?.welpru_api_key || null
        }
        if (!apiKey) apiKey = process.env.WELPRU_API_KEY || null
        if (!apiKey) {
            console.log('[WeLPRU] Notification skipped - API Key not configured.')
            return { success: false, error: 'WeLPRU API Key not configured' }
        }

        if (!params.userIds || params.userIds.length === 0) {
            console.warn('[WeLPRU] No user IDs provided.')
            return { success: false, error: 'No user IDs provided' }
        }

        // WeLPRU API requires `user_id` as a singular string (one request per user)
        const safeTitle = truncateText(params.title, 50);
        const safeBody = truncateText(params.body, 250);
        const validLink = safeLink(params.link);

        const results = await Promise.allSettled(
            params.userIds.map((uid) => {
                const payload = {
                    user_id: uid,
                    title: safeTitle,
                    body: safeBody,
                    ...(validLink && { link: validLink }),
                    ...(params.data && { data: params.data }),
                }
                return fetch(`${WELPRU_API_URL}/notify/user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey!,
                    },
                    body: JSON.stringify(payload),
                }).then(async (res) => {
                    if (!res.ok) {
                        const errText = await res.text()
                        console.error(`[WeLPRU] API returned ${res.status} for user ${uid}: ${errText}`)
                        throw new Error(`API Error: ${res.status} ${errText}`)
                    }
                    return res
                })
            })
        )

        const failed = results.filter((r) => r.status === 'rejected')
        if (failed.length > 0) {
            const firstErr = (failed[0] as PromiseRejectedResult).reason?.message || 'Unknown error'
            if (failed.length === params.userIds.length) {
                return { success: false, error: firstErr }
            }
            // Partial success — log but don't fail entirely
            console.warn(`[WeLPRU] ${failed.length}/${params.userIds.length} notifications failed.`)
        }

        console.log(`[WeLPRU] Successfully queued notification for ${params.userIds.length - failed.length}/${params.userIds.length} users.`)
        return { success: true }
    } catch (error: any) {
        // Fail gracefully
        console.error('[WeLPRU] Error in sendWeLPRUNotification:', error)
        return { success: false, error: error?.message || 'Unknown error' }
    }
}

/**
 * Sends a broadcast push notification to a group via WeLPRU app.
 */
export async function sendWeLPRUGroupBroadcast(params: WeLPRUGroupMessageParams): Promise<{ success: boolean; error?: string }> {
    try {
        // Read API Key: DB first, fallback to env var
        let apiKey: string | null = null
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            )
            const { data: config } = await supabaseAdmin
                .from('system_config')
                .select('welpru_notifications_enabled, welpru_api_key')
                .eq('id', 1)
                .single()
        if (!(config as any)?.welpru_notifications_enabled) return { success: false, error: 'WeLPRU notifications are disabled in settings' }
            apiKey = (config as any)?.welpru_api_key || null
        }
        if (!apiKey) apiKey = process.env.WELPRU_API_KEY || null
        if (!apiKey) {
            console.log('[WeLPRU] Group Broadcast skipped - API Key not configured.')
            return { success: false, error: 'WeLPRU API Key not configured' }
        }

        const safeTitle = truncateText(params.title, 50);
        const safeBody = truncateText(params.body, 250);

        const payload = {
            target_group: params.targetGroup,
            title: safeTitle,
            body: safeBody,
            ...(params.data && { data: params.data }),
        }

        const res = await fetch(`${WELPRU_API_URL}/notify/group`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error(`[WeLPRU] API returned ${res.status}: ${errText}`)
            return { success: false, error: `API Error: ${res.status} ${errText}` }
        }

        // 200 OK expected for group broadcasts
        console.log(`[WeLPRU] Successfully sent broadcast to group: ${params.targetGroup}.`)
        return { success: true }
    } catch (error: any) {
        // Fail gracefully
        console.error('[WeLPRU] Error in sendWeLPRUGroupBroadcast:', error)
        return { success: false, error: error?.message || 'Unknown error' }
    }
}

