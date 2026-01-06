import { createBrowserClient } from '@supabase/ssr'

/**
 * Shared Supabase helpers for browser-side operations
 * Using direct client creation to avoid proxy issues in production
 */

// Get credentials
export function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

// Get browser client for auth operations
export function getSupabaseBrowserClient() {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

// Direct fetch helper for database operations
export async function supabaseFetch<T>(
    endpoint: string,
    options?: {
        method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
        body?: any
        headers?: Record<string, string>
    }
): Promise<{ data: T | null; error: string | null }> {
    const { url, key } = getSupabaseCredentials()

    if (!url || !key) {
        return { data: null, error: 'Missing Supabase credentials' }
    }

    const fullUrl = `${url}/rest/v1/${endpoint}`
    const method = options?.method || 'GET'

    try {
        const response = await fetch(fullUrl, {
            method,
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': method === 'GET' ? 'return=representation' : 'return=representation',
                ...options?.headers
            },
            body: options?.body ? JSON.stringify(options.body) : undefined
        })

        if (!response.ok) {
            const errorText = await response.text()
            return { data: null, error: errorText }
        }

        const data = await response.json()
        return { data, error: null }
    } catch (err: any) {
        return { data: null, error: err?.message || 'Unknown error' }
    }
}
