import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type SystemConfig = Database['public']['Tables']['system_config']['Row']
type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

export function useSystemConfig() {
    return useQuery({
        queryKey: ['system_config'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('system_config')
                .select('*')
                .single()

            if (error) throw error
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
