import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId: string | undefined) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            return data as Profile
        },
        enabled: !!userId,
    })
}
