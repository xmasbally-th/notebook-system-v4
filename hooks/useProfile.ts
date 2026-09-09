'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId?: string) {
    return useQuery({
        queryKey: ['profile', userId || 'current'],
        staleTime: 30000, // 30 seconds
        retry: 1,
        queryFn: async (): Promise<Profile | null> => {
            try {
                let targetUserId = userId

                // If no userId provided, fetch current user from auth
                if (!targetUserId) {
                    const { data: { user }, error: userError } = await supabase.auth.getUser()
                    if (userError || !user) return null
                    targetUserId = user.id
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', targetUserId)
                    .single()

                if (error) {
                    console.error('[useProfile] Supabase error:', error.message)
                    return null
                }

                return data as Profile
            } catch (err: any) {
                console.error('[useProfile] Exception:', err?.message || err)
                return null
            }
        },
    })
}
