import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

type EquipmentType = Database['public']['Tables']['equipment_types']['Row']
type EquipmentTypeInsert = Database['public']['Tables']['equipment_types']['Insert']
type EquipmentTypeUpdate = Database['public']['Tables']['equipment_types']['Update']

// Create client directly for this hook
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) {
        console.error('[useEquipmentTypes] Missing Supabase env vars')
        return null
    }
    return createBrowserClient<Database>(url, key)
}

export function useEquipmentTypes(id?: string) {
    return useQuery({
        queryKey: ['equipment-types', id],
        staleTime: 0,  // Always refetch on mount for admin page
        retry: 1,
        queryFn: async () => {
            console.log('[useEquipmentTypes] Fetching equipment types...', id ? `id: ${id}` : 'all')

            try {
                const client = getSupabaseClient()
                console.log('[useEquipmentTypes] Client created:', !!client)

                if (!client) {
                    console.error('[useEquipmentTypes] No client available')
                    return []
                }

                // Wrap in timeout to prevent hanging
                const timeoutMs = 8000
                console.log('[useEquipmentTypes] Executing query with timeout:', timeoutMs)

                let queryPromise
                if (id) {
                    queryPromise = client
                        .from('equipment_types')
                        .select('*')
                        .eq('id', id)
                        .single()
                } else {
                    queryPromise = client
                        .from('equipment_types')
                        .select('*')
                        .order('name', { ascending: true })
                }

                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        console.error('[useEquipmentTypes] Query timed out after', timeoutMs, 'ms')
                        reject(new Error('Query timeout'))
                    }, timeoutMs)
                })

                const { data, error } = await Promise.race([queryPromise, timeoutPromise])
                console.log('[useEquipmentTypes] Query completed:', { hasData: !!data, error: error?.message })

                if (error) {
                    console.error('[useEquipmentTypes] Error:', error)
                    return id ? null : []
                }

                console.log('[useEquipmentTypes] Success:', Array.isArray(data) ? `${data.length} items` : 'single item')

                if (Array.isArray(data)) {
                    return data as EquipmentType[]
                }
                return data as EquipmentType
            } catch (err: any) {
                console.error('[useEquipmentTypes] Exception:', err?.message || err)
                return id ? null : []
            }
        },
    })
}

export function useEquipmentTypeMutation() {
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: async (data: EquipmentTypeInsert) => {
            const client = getSupabaseClient()
            if (!client) throw new Error('Supabase client not available')

            const { data: result, error } = await (client as any)
                .from('equipment_types')
                .insert(data)
                .select()
                .single()

            if (error) throw error
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-types'] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: EquipmentTypeUpdate }) => {
            const client = getSupabaseClient()
            if (!client) throw new Error('Supabase client not available')

            const { data: result, error } = await (client as any)
                .from('equipment_types')
                .update(data)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return result
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-types'] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const client = getSupabaseClient()
            if (!client) throw new Error('Supabase client not available')

            const { error } = await (client as any)
                .from('equipment_types')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-types'] })
        },
    })

    return {
        create: createMutation,
        update: updateMutation,
        delete: deleteMutation,
    }
}
