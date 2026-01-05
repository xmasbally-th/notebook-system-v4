'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'

interface PendingLoan {
    id: string
    user_id: string
    equipment_id: string
    created_at: string
}

const POLL_INTERVAL = 30000 // 30 seconds

export function useRealtimeLoans(isAdmin: boolean) {
    const [newLoan, setNewLoan] = useState<PendingLoan | null>(null)
    const [lastKnownCount, setLastKnownCount] = useState<number | null>(null)

    // Fetch pending loans count
    const { data: pendingLoansData, isLoading, refetch } = useQuery({
        queryKey: ['pending-loans-count'],
        queryFn: async () => {
            const { data, count, error } = await (supabase as any)
                .from('loanRequests')
                .select('*', { count: 'exact' })
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)

            if (error) throw error
            return { loans: data, count: count || 0 }
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
