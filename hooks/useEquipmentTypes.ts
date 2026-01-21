import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

type EquipmentType = Database['public']['Tables']['equipment_types']['Row']
type EquipmentTypeInsert = Database['public']['Tables']['equipment_types']['Insert']
type EquipmentTypeUpdate = Database['public']['Tables']['equipment_types']['Update']

// Get Supabase credentials
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

// Create client for mutations
function getSupabaseClient() {
    const { url, key } = getSupabaseCredentials()
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


            try {
                const { url, key } = getSupabaseCredentials()


                if (!url || !key) {
                    console.error('[useEquipmentTypes] Missing credentials')
                    return []
                }

                // Use direct fetch API instead of Supabase client
                const endpoint = id
                    ? `${url}/rest/v1/equipment_types?id=eq.${id}&select=*`
                    : `${url}/rest/v1/equipment_types?select=*&order=name.asc`



                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    }
                })



                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('[useEquipmentTypes] HTTP Error:', response.status, errorText)
                    return id ? null : []
                }

                const data = await response.json()


                if (id && Array.isArray(data) && data.length > 0) {
                    return data[0] as EquipmentType
                }

                return (data || []) as EquipmentType[]
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
