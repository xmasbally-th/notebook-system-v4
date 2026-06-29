import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type _SystemConfigBase = Database['public']['Tables']['system_config']['Row']
type _SystemConfigUpdateBase = Database['public']['Tables']['system_config']['Update']

// Extended with new archive columns (added via migration 20260302)
type ArchiveFields = {
    archive_enabled: boolean | null
    archive_notifications_after_days: number | null
    last_archived_at: string | null
}

type SystemConfig = _SystemConfigBase & ArchiveFields
type SystemConfigUpdate = _SystemConfigUpdateBase & Partial<ArchiveFields>


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
                // 1. Try loading settings via admin server action (masked secrets)
                const { getSystemConfigForAdmin } = await import('@/app/admin/settings/actions')
                const res = await getSystemConfigForAdmin()
                
                if (res.success && res.data) {
                    return res.data as SystemConfig
                }

                // 2. Fallback for normal users: load safe public config via RPC
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_public_system_config')
                
                if (rpcError) {
                    console.error('[useSystemConfig] RPC fallback failed:', rpcError.message)
                    return getDefaultConfig()
                }
                
                if (!rpcData) {
                    return getDefaultConfig()
                }
                
                // Merge RPC data with default config to ensure all fields exist
                return {
                    ...getDefaultConfig(),
                    ...(rpcData as any)
                }
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
        // WeLPRU notifications
        welpru_notifications_enabled: false,
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
        support_auto_reply_enabled: true,
        support_auto_reply_message: null,
        archive_enabled: false,
        archive_notifications_after_days: 90,
        last_archived_at: null,
        notification_settings: null,
        welpru_api_key: null,
        admin_welpru_ids: [],
    } as SystemConfig
}

export function useUpdateSystemConfig() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (updates: SystemConfigUpdate) => {
            const { updateSystemConfigAction } = await import('@/app/admin/settings/actions')
            const res = await updateSystemConfigAction(updates)
            if (!res.success) {
                throw new Error(res.error || 'Failed to update configuration')
            }
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_config'] })
        }
    })
}

