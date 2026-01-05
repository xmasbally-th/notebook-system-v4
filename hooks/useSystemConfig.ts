import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type SystemConfig = Database['public']['Tables']['system_config']['Row']
type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

export function useSystemConfig() {
    return useQuery({
        queryKey: ['system_config'],
        staleTime: 0,   // Always get fresh config for admin page
        retry: 3,       // Retry more for critical config
        queryFn: async () => {
            console.log('[useSystemConfig] Fetching system config...')

            const { data, error } = await (supabase as any)
                .from('system_config')
                .select('*')
                .single()

            if (error) {
                console.error('[useSystemConfig] Error:', error)
                throw error
            }

            console.log('[useSystemConfig] Success:', data ? 'config loaded' : 'no config')
            return data as SystemConfig
        }
    })
}

export function useUpdateSystemConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (updates: SystemConfigUpdate) => {
            const { data, error } = await (supabase as any)
                .from('system_config')
                .update(updates)
                .eq('id', 1) // Always update the singleton row
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_config'] })
        }
    })
}
