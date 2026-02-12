import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type SystemConfig = Database['public']['Tables']['system_config']['Row']
type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']



export function useSystemConfig() {
    const queryClient = useQueryClient()

    useEffect(() => {
        // Subscribe to realtime changes
        const channel = supabase
            .channel('system_config_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'system_config',
                    filter: 'id=eq.1'
                },
                (payload) => {
                    // Update cache immediately
                    if (payload.new) {
                        queryClient.setQueryData(['system_config'], payload.new as SystemConfig)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [queryClient])

    return useQuery({
        queryKey: ['system_config'],
        staleTime: 1000 * 60 * 5, // 5 minutes to reduce load
        retry: 1,
        retryDelay: 1000,
        queryFn: async (): Promise<SystemConfig> => {
            try {
                const timeoutMs = 10000 // Reduced to 10s timeout for faster fallback

                const timeoutPromise = new Promise<{ data: null, error: Error }>((resolve) => {
                    setTimeout(() => {
                        console.warn('[useSystemConfig] Query timed out after', timeoutMs, 'ms, using default config')
                        // Return error object instead of rejecting - prevents throwing
                        resolve({ data: null, error: new Error('Query timeout') })
                    }, timeoutMs)
                })

                const queryPromise = supabase
                    .from('system_config')
                    .select('*')
                    .single()

                // Use Promise.race to handle timeout
                const result = await Promise.race([queryPromise, timeoutPromise]) as { data: SystemConfig | null, error: any }
                const { data, error } = result

                if (error) {
                    console.error('[useSystemConfig] Supabase error:', error.message)
                    // Return default config instead of throwing
                    return getDefaultConfig()
                }

                if (!data) {
                    return getDefaultConfig()
                }

                return data
            } catch (err: any) {
                console.error('[useSystemConfig] Exception:', err?.message || err)
                // Always return default config on any error
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
        },
        document_logo_url: null,
        document_template_url: null,
        discord_webhook_auth: null,
        discord_webhook_reservations: null,
        discord_webhook_maintenance: null,
        evaluation_cutoff_date: null,
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
