import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type Equipment = Database['public']['Tables']['equipment']['Row']



export function useEquipment(id?: string | null, filters?: { typeId?: string | null, search?: string | null, enabled?: boolean }) {
    const queryClient = useQueryClient()

    useEffect(() => {
        // Subscribe to realtime equipment changes
        const channel = supabase
            .channel('equipment-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'equipment'
                },
                (payload) => {
                    // console.log('Equipment change:', payload)
                    queryClient.invalidateQueries({ queryKey: ['equipment'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [queryClient])

    return useQuery({
        queryKey: ['equipment', id, filters?.typeId, filters?.search],
        enabled: filters?.enabled !== false, // Default to true if not specified
        staleTime: 1000 * 60 * 5, // 5 minutes (invalidated by realtime)
        retry: 1,
        queryFn: async () => {
            try {
                let query = supabase
                    .from('equipment')
                    .select('id,name,equipment_number,brand,model,status,description,equipment_type_id,images,search_keywords,created_at')

                if (id) {
                    query = query.eq('id', id) as any
                } else {
                    // Apply filters
                    if (filters?.typeId && filters.typeId !== 'all') {
                        query = query.eq('equipment_type_id', filters.typeId)
                    }

                    if (filters?.search) {
                        const s = filters.search
                        // Search in name, equipment_number, brand, model
                        query = query.or(`name.ilike.%${s}%,equipment_number.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%`)
                    }

                    query = query.order('created_at', { ascending: false })
                }

                const { data, error } = await query

                if (error) {
                    console.error('[useEquipment] Supabase Error:', error.message)
                    return id ? null : []
                }

                // Process data to ensure arrays are correct
                const processItem = (item: any) => ({
                    ...item,
                    images: Array.isArray(item.images) ? item.images : [],
                    search_keywords: Array.isArray(item.search_keywords) ? item.search_keywords : [],
                })

                if (id && Array.isArray(data) && data.length > 0) {
                    return processItem(data[0]) as Equipment
                }

                if (Array.isArray(data)) {
                    return data.map(processItem) as Equipment[]
                }

                return data
            } catch (err: any) {
                console.error('[useEquipment] Exception:', err?.message || err)
                return id ? null : []
            }
        },
    })
}

export function useEquipmentMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newEquipment: Database['public']['Tables']['equipment']['Insert']) => {
            const { data, error } = await (supabase as any)
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
