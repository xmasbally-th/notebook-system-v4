'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface PendingReservation {
    id: string
    user_id: string
    equipment_id: string
    created_at: string
}



export function useRealtimeReservations(enabled: boolean) {
    const [newReservation, setNewReservation] = useState<PendingReservation | null>(null)
    const [lastKnownCount, setLastKnownCount] = useState<number | null>(null)

    // Fetch pending reservations count using user's access token
    const { data: pendingReservationsData, isLoading, refetch } = useQuery({
        queryKey: ['pending-reservations-count'],
        queryFn: async () => {
            // Use direct fetch API with count
            const { data, count, error } = await supabase
                .from('reservations')
                .select('*', { count: 'exact' })
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)

            if (error) {
                console.error('[useRealtimeReservations] Error:', error.message)
                return { reservations: [], count: 0 }
            }

            return { reservations: data || [], count: count || 0 }
        },
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes (invalidated by realtime)
    })


    const queryClient = useQueryClient()
    useEffect(() => {
        if (!enabled) return

        const channel = supabase
            .channel('reservations-count-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                    filter: 'status=eq.pending'
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['pending-reservations-count'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [enabled, queryClient])

    const pendingCount = pendingReservationsData?.count || 0

    // Detect new reservations
    useEffect(() => {
        if (!enabled || lastKnownCount === null) {
            setLastKnownCount(pendingCount)
            return
        }

        if (pendingCount > lastKnownCount && pendingReservationsData?.reservations?.[0]) {
            setNewReservation(pendingReservationsData.reservations[0])
        }

        setLastKnownCount(pendingCount)
    }, [pendingCount, lastKnownCount, pendingReservationsData?.reservations, enabled])

    const clearNewReservation = useCallback(() => {
        setNewReservation(null)
    }, [])

    return {
        pendingCount,
        newReservation,
        clearNewReservation,
        isLoading,
        refetch,
    }
}
