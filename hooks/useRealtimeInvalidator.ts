'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase-helpers'

/**
 * Hook to invalidate query keys when Realtime events occur.
 * Uses singleton client and debounces invalidation to avoid rapid re-renders.
 */
export function useRealtimeInvalidator(
    tables: string[],
    queryKeys: string[][]
) {
    const queryClient = useQueryClient()
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const client = getSupabaseBrowserClient()
        if (!client) return

        const channelName = `invalidator-${tables.join('-')}`

        let channel = client.channel(channelName)

        tables.forEach(table => {
            channel = channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table },
                () => {
                    // Debounce: batch rapid changes into one invalidation (300ms)
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current)
                    }
                    debounceTimerRef.current = setTimeout(() => {
                        queryKeys.forEach(queryKey => {
                            queryClient.invalidateQueries({ queryKey })
                        })
                    }, 300)
                }
            )
        })

        channel.subscribe()

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
            client.removeChannel(channel)
        }
    }, [tables.join(','), queryKeys.join(',')])
}
