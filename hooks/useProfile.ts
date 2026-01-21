'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

// Get Supabase credentials
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

// Create client for auth operations
function getSupabaseClient() {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null
    return createBrowserClient<Database>(url, key)
}

export function useProfile(userId?: string) {
    return useQuery({
        queryKey: ['profile', userId || 'current'],
        staleTime: 30000, // 30 seconds
        retry: 1,
        queryFn: async () => {


            try {
                const { url, key } = getSupabaseCredentials()
                const client = getSupabaseClient()

                if (!url || !key || !client) {
                    console.error('[useProfile] Missing credentials or client')
                    return null
                }

                let targetUserId = userId

                // If no userId provided, fetch current user from auth
                if (!targetUserId) {
                    const { data: { user } } = await client.auth.getUser()
                    if (!user) {

                        return null
                    }
                    targetUserId = user.id
                }



                // Get user's access token for proper RLS
                const { data: { session } } = await client.auth.getSession()
                const accessToken = session?.access_token || key

                // Use direct fetch API
                const endpoint = `${url}/rest/v1/profiles?id=eq.${targetUserId}&select=*`

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    console.error('[useProfile] HTTP Error:', response.status)
                    return null
                }

                const data = await response.json()


                if (Array.isArray(data) && data.length > 0) {
                    return data[0] as Profile
                }

                return null
            } catch (err: any) {
                console.error('[useProfile] Exception:', err?.message || err)
                return null
            }
        },
    })
}
