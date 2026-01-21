import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

type Equipment = Database['public']['Tables']['equipment']['Row']

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
        console.error('[useEquipment] Missing Supabase env vars')
        return null
    }
    return createBrowserClient<Database>(url, key)
}

export function useEquipment(id?: string) {
    return useQuery({
        queryKey: ['equipment', id],
        staleTime: 0,
        retry: 1,
        queryFn: async () => {


            try {
                const { url, key } = getSupabaseCredentials()

                if (!url || !key) {
                    console.error('[useEquipment] Missing credentials')
                    return id ? null : []
                }

                // Use direct fetch API
                const endpoint = id
                    ? `${url}/rest/v1/equipment?id=eq.${id}&select=*`
                    : `${url}/rest/v1/equipment?select=*&order=created_at.desc`

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    console.error('[useEquipment] HTTP Error:', response.status)
                    return id ? null : []
                }

                const data = await response.json()


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
            const client = getSupabaseClient()
            if (!client) throw new Error('Supabase client not available')

            const { data, error } = await (client as any)
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
