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
            console.log('[useSystemConfig] Starting fetch...')

            try {
                const supabaseClient = supabase as any
                console.log('[useSystemConfig] Supabase client available:', !!supabaseClient)

                const query = supabaseClient.from('system_config')
                console.log('[useSystemConfig] Query created:', !!query)

                const selectQuery = query.select('*')
                console.log('[useSystemConfig] Select query created:', !!selectQuery)

                const result = await selectQuery.single()
                console.log('[useSystemConfig] Query completed, result:', result)

                const { data, error } = result

                if (error) {
                    console.error('[useSystemConfig] Supabase error:', error.message, error.code, error)
                    throw error
                }

                if (!data) {
                    console.warn('[useSystemConfig] No data returned, system_config table might be empty')
                    // Return default config if no data
                    throw new Error('ไม่พบข้อมูลการตั้งค่าระบบ กรุณาตรวจสอบ database')
                }

                console.log('[useSystemConfig] Success:', data)
                return data as SystemConfig
            } catch (err) {
                console.error('[useSystemConfig] Exception:', err)
                throw err
            }
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
