import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/supabase/types'

type Equipment = Database['public']['Tables']['equipment']['Row']



export function useEquipment(id?: string) {
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
        queryKey: ['equipment', id],
        staleTime: 1000 * 60 * 5, // 5 minutes (invalidated by realtime)
        retry: 1,
        queryFn: async () => {


            try {
                // Use direct fetch API
                // Note: We use supabase.auth.getSession() to get headers if needed, 
                // but here we are using the shared client which is properly configured.
                // Actually, for consistency with previous refactor, we can use the shared client directly!
                // But the original code used fetch. Let's switch to shared client to be clean.

                let query = supabase
                    .from('equipment')
                    .select('*')

                if (id) {
                    query = query.eq('id', id) as any
                } else {
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
