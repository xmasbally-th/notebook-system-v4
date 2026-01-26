import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

type SystemConfig = Database['public']['Tables']['system_config']['Row']
type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

// Create client directly for this hook
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) {
        console.error('[useSystemConfig] Missing Supabase env vars')
        return null
    }
    return createBrowserClient<Database>(url, key)
}

export function useSystemConfig() {
    return useQuery({
        queryKey: ['system_config'],
        staleTime: 0,   // Always get fresh config for admin page
        retry: 1,       // Retry once only
        retryDelay: 1000,
        queryFn: async (): Promise<SystemConfig> => {


            try {
                const client = getSupabaseClient()


                if (!client) {
                    console.error('[useSystemConfig] No client available')
                    return getDefaultConfig()
                }

                // Wrap in timeout to prevent hanging
                const timeoutMs = 15000


                const queryPromise = client
                    .from('system_config')
                    .select('*')
                    .limit(1)

                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        console.error('[useSystemConfig] Query timed out after', timeoutMs, 'ms')
                        reject(new Error('Query timeout'))
                    }, timeoutMs)
                })

                const { data, error } = await Promise.race([queryPromise, timeoutPromise])


                if (error) {
                    console.error('[useSystemConfig] Supabase error:', error.message, error.code)
                    return getDefaultConfig()
                }

                // Get first row from array
                const config = Array.isArray(data) && data.length > 0 ? data[0] : null

                if (!config) {
                    console.warn('[useSystemConfig] No config found, using defaults')
                    return getDefaultConfig()
                }


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
        },
        document_logo_url: null,
        document_template_url: null
    } as SystemConfig
}

export function useUpdateSystemConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (updates: SystemConfigUpdate) => {
            const client = getSupabaseClient()
            if (!client) {
                throw new Error('Supabase client not available')
            }

            const { data, error } = await (client as any)
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
