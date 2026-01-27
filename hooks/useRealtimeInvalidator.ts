'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'

function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

/**
 * Hook to invalidate query keys when Realtime events occur
 * @param tables Array of table names to listen to (or object with table and filter)
 * @param queryKeys Array of query keys to invalidate
 */
export function useRealtimeInvalidator(
    tables: string[],
    queryKeys: string[][]
) {
    const queryClient = useQueryClient()

    useEffect(() => {
        const { url, key } = getSupabaseCredentials()
        if (!url || !key) return

        const client = createBrowserClient(url, key)
        const channelName = `invalidator-${tables.join('-')}`

        let channel = client.channel(channelName)

        tables.forEach(table => {
            channel = channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table },
                () => {
                    // Invalidate all provided keys
                    queryKeys.forEach(queryKey => {
                        queryClient.invalidateQueries({ queryKey })
                    })
                }
            )
        })

        channel.subscribe()

        return () => {
            client.removeChannel(channel)
        }
    }, [tables.join(','), queryKeys.join(',')]) // Re-subscribe if tables/keys change
}
