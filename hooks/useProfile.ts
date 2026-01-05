import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId?: string) {
    return useQuery({
        queryKey: ['profile', userId || 'current'],
        queryFn: async () => {
            let targetUserId = userId

            // If no userId provided, fetch current user
            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return null
                targetUserId = user.id
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', targetUserId)
                .single()

            if (error) throw error
            return data as Profile
        },
    })
}
