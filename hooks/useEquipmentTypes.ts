import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/supabase/types'

type EquipmentType = Database['public']['Tables']['equipment_types']['Row']
type EquipmentTypeInsert = Database['public']['Tables']['equipment_types']['Insert']
type EquipmentTypeUpdate = Database['public']['Tables']['equipment_types']['Update']

export function useEquipmentTypes(id?: string) {
    return useQuery({
        queryKey: ['equipment-types', id],
        staleTime: 0, // Always refetch on mount for admin page
        retry: 1,
        queryFn: async () => {
            try {
                if (id) {
                    const { data, error } = await supabase
                        .from('equipment_types')
                        .select('*')
                        .eq('id', id)
                        .single()

                    if (error) {
                        console.error('[useEquipmentTypes] Error fetching type:', error.message)
                        return null
                    }
                    return data as EquipmentType
                }

                const { data, error } = await supabase
                    .from('equipment_types')
                    .select('*')
                    .order('name', { ascending: true })

                if (error) {
                    console.error('[useEquipmentTypes] Error fetching types:', error.message)
                    return []
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
            const { data: result, error } = await (supabase as any)
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
            const { error } = await (supabase as any)
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
