'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'

interface PendingLoan {
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

export function useRealtimeLoans(isAdmin: boolean) {
    const [newLoan, setNewLoan] = useState<PendingLoan | null>(null)
    const [lastKnownCount, setLastKnownCount] = useState<number | null>(null)

    // Fetch pending loans count
    const { data: pendingLoansData, isLoading, refetch } = useQuery({
        queryKey: ['pending-loans-count'],
        queryFn: async () => {
            console.log('[useRealtimeLoans] Fetching pending loans...')

            try {
                const { url, key } = getSupabaseCredentials()

                if (!url || !key) {
                    console.error('[useRealtimeLoans] Missing credentials')
                    return { loans: [], count: 0 }
                }

                // Use direct fetch API with count
                const endpoint = `${url}/rest/v1/loanRequests?status=eq.pending&select=*&order=created_at.desc&limit=1`

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
                    console.error('[useRealtimeLoans] HTTP Error:', response.status)
                    return { loans: [], count: 0 }
                }

                const data = await response.json()
                const countHeader = response.headers.get('content-range')
                const count = countHeader ? parseInt(countHeader.split('/')[1]) || 0 : data.length

                console.log('[useRealtimeLoans] Success:', { count, loans: data.length })
                return { loans: data, count }
            } catch (err: any) {
                console.error('[useRealtimeLoans] Exception:', err?.message || err)
                return { loans: [], count: 0 }
            }
        },
        enabled: isAdmin,
        refetchInterval: POLL_INTERVAL,
    })

    const pendingCount = pendingLoansData?.count || 0

    // Detect new loans
    useEffect(() => {
        if (!isAdmin || lastKnownCount === null) {
            setLastKnownCount(pendingCount)
            return
        }

        if (pendingCount > lastKnownCount && pendingLoansData?.loans?.[0]) {
            setNewLoan(pendingLoansData.loans[0])
        }

        setLastKnownCount(pendingCount)
    }, [pendingCount, lastKnownCount, pendingLoansData?.loans, isAdmin])

    const clearNewLoan = useCallback(() => {
        setNewLoan(null)
    }, [])

    return {
        pendingCount,
        newLoan,
        clearNewLoan,
        isLoading,
        refetch,
    }
}
