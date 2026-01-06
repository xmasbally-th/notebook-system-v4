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
        queryFn: async () => {
            console.log('[useSystemConfig] Starting fetch...')

            // Timeout wrapper to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Query timeout - took more than 10 seconds')), 10000)
            })

            try {
                const supabaseClient = supabase as any

                if (!supabaseClient || !supabaseClient.from) {
                    console.error('[useSystemConfig] Supabase client not available')
                    throw new Error('Supabase client not initialized')
                }

                console.log('[useSystemConfig] Executing query...')

                const fetchPromise = supabaseClient
                    .from('system_config')
                    .select('*')
                    .eq('id', 1)
                    .single()

                const result = await Promise.race([fetchPromise, timeoutPromise]) as any
                console.log('[useSystemConfig] Query completed, result:', result)

                const { data, error } = result

                if (error) {
                    console.error('[useSystemConfig] Supabase error:', error.message, error.code)
                    // If no rows found, return default config instead of throwing
                    if (error.code === 'PGRST116') {
                        console.log('[useSystemConfig] No config found, returning defaults')
                        return getDefaultConfig()
                    }
                    throw new Error(`Database error: ${error.message}`)
                }

                if (!data) {
                    console.warn('[useSystemConfig] No data returned, using defaults')
                    return getDefaultConfig()
                }

                console.log('[useSystemConfig] Success:', data)
                return data as SystemConfig
            } catch (err: any) {
                console.error('[useSystemConfig] Exception:', err?.message || err)
                throw err
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
