import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type Equipment = Database['public']['Tables']['equipment']['Row']

export function useEquipment(id?: string) {
    return useQuery({
        queryKey: ['equipment', id],
        queryFn: async () => {
            const query = supabase
                .from('equipment')
                .select('*')

            if (id) {
                query.eq('id', id).single()
            } else {
                query.order('created_at', { ascending: false })
            }

            const { data, error } = await query
            if (error) throw error

            // Defensive programming: Ensure arrays are arrays
            if (Array.isArray(data)) {
                return data.map(item => ({
                    ...item,
                    images: Array.isArray(item.images) ? item.images : [], // Critical fix
                    search_keywords: Array.isArray(item.search_keywords) ? item.search_keywords : [],
                })) as Equipment[]
            } else if (data) {
                return {
                    ...data,
                    images: Array.isArray(data.images) ? data.images : [],
                    search_keywords: Array.isArray(data.search_keywords) ? data.search_keywords : [],
                } as Equipment
            }

            return data
        },
    })
}

export function useEquipmentMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newEquipment: Database['public']['Tables']['equipment']['Insert']) => {
            const { data, error } = await supabase
                .from('equipment')
                .insert(newEquipment)
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment'] })
        },
    })
}
