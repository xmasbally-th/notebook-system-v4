'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'

interface PendingReservation {
    id: string
    user_id: string
    equipment_id: string
    created_at: string
}

const POLL_INTERVAL = 30000 // 30 seconds

// Get Supabase credentials
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

export function useRealtimeReservations(enabled: boolean) {
    const [newReservation, setNewReservation] = useState<PendingReservation | null>(null)
    const [lastKnownCount, setLastKnownCount] = useState<number | null>(null)

    // Fetch pending reservations count
    const { data: pendingReservationsData, isLoading, refetch } = useQuery({
        queryKey: ['pending-reservations-count'],
        queryFn: async () => {
            console.log('[useRealtimeReservations] Fetching pending reservations...')

            try {
                const { url, key } = getSupabaseCredentials()

                if (!url || !key) {
                    console.error('[useRealtimeReservations] Missing credentials')
                    return { reservations: [], count: 0 }
                }

                // Use direct fetch API with count
                const endpoint = `${url}/rest/v1/reservations?status=eq.pending&select=*&order=created_at.desc&limit=1`

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'count=exact'
                    }
                })

                if (!response.ok) {
                    // Table might not exist yet
                    if (response.status === 404) {
                        return { reservations: [], count: 0 }
                    }
                    console.error('[useRealtimeReservations] HTTP Error:', response.status)
                    return { reservations: [], count: 0 }
                }

                const data = await response.json()
                const countHeader = response.headers.get('content-range')
                const count = countHeader ? parseInt(countHeader.split('/')[1]) || 0 : data.length

                console.log('[useRealtimeReservations] Success:', { count, reservations: data.length })
                return { reservations: data, count }
            } catch (err: any) {
                console.error('[useRealtimeReservations] Exception:', err?.message || err)
                return { reservations: [], count: 0 }
            }
        },
        enabled,
        refetchInterval: POLL_INTERVAL,
    })

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
