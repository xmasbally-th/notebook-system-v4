import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type SystemConfig = Database['public']['Tables']['system_config']['Row']
type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

export function useSystemConfig() {
    return useQuery({
        queryKey: ['system_config'],
        staleTime: 0,   // Always get fresh config for admin page
        retry: 2,       // Retry failed queries
        retryDelay: 1000,
        queryFn: async (): Promise<SystemConfig> => {
            console.log('[useSystemConfig] Starting fetch...')

            try {
                // Direct query without chaining .single() 
                const { data, error } = await (supabase as any)
                    .from('system_config')
                    .select('*')
                    .limit(1)

                console.log('[useSystemConfig] Query result:', { data, error })

                if (error) {
                    console.error('[useSystemConfig] Supabase error:', error.message, error.code)
                    throw new Error(`Database error: ${error.message}`)
                }

                // Get first row from array
                const config = Array.isArray(data) && data.length > 0 ? data[0] : null

                if (!config) {
                    console.warn('[useSystemConfig] No config found, using defaults')
                    return getDefaultConfig()
                }

                console.log('[useSystemConfig] Success:', config)
                return config as SystemConfig
            } catch (err: any) {
                console.error('[useSystemConfig] Exception:', err?.message || err)
                // Return default config on error so page doesn't stay stuck
                return getDefaultConfig()
            }
        }
    })
}

// Default config values
function getDefaultConfig(): SystemConfig {
    return {
        id: 1,
        max_loan_days: 7,
        max_items_per_user: 3,
        opening_time: '09:00:00',
        closing_time: '17:00:00',
        closed_days: [],
        is_loan_system_active: true,
        is_reservation_active: true,
        discord_webhook_url: null,
        announcement_message: null,
        announcement_active: false,
        updated_at: new Date().toISOString(),
        break_start_time: '12:00:00',
        break_end_time: '13:00:00',
        closed_dates: [],
        loan_limits_by_type: {
            student: { max_days: 3, max_items: 1 },
            lecturer: { max_days: 7, max_items: 3 },
            staff: { max_days: 5, max_items: 2 }
        }
    } as SystemConfig
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
