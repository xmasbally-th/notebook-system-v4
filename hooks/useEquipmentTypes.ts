import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type EquipmentType = Database['public']['Tables']['equipment_types']['Row']
type EquipmentTypeInsert = Database['public']['Tables']['equipment_types']['Insert']
type EquipmentTypeUpdate = Database['public']['Tables']['equipment_types']['Update']

export function useEquipmentTypes(id?: string) {
    return useQuery({
        queryKey: ['equipment-types', id],
        staleTime: 0,  // Always refetch on mount for admin page
        retry: 2,
        queryFn: async () => {
            console.log('[useEquipmentTypes] Fetching equipment types...', id ? `id: ${id}` : 'all')

            let query: any = supabase
                .from('equipment_types' as any)
                .select('*')

            if (id) {
                query = query.eq('id', id).single()
            } else {
                query = query.order('name', { ascending: true })
            }

            const { data, error } = await query

            if (error) {
                console.error('[useEquipmentTypes] Error:', error)
                throw error
            }

            console.log('[useEquipmentTypes] Success:', Array.isArray(data) ? `${data.length} items` : 'single item')

            if (Array.isArray(data)) {
                return data as EquipmentType[]
            }
            return data as EquipmentType
        },
    })
}

export function useEquipmentTypeMutation() {
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: async (data: EquipmentTypeInsert) => {
            const { data: result, error } = await supabase
                .from('equipment_types' as any)
                .insert(data as any)
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
            const { data: result, error } = await (supabase as any)
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
            const { error } = await supabase
                .from('equipment_types' as any)
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
