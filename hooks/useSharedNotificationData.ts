'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Shared Notification Data Hook
 * Single source of truth for notification-related data across all roles
 * Reduces database queries by sharing data between Staff/Admin/User hooks
 */

interface LoanRequest {
    id: string
    user_id: string
    equipment_id: string
    start_date: string
    end_date: string
    return_time: string | null
    status: string
    created_at: string
    equipment?: {
        id: string
        name: string
        equipment_number: string
    }
    profiles?: {
        first_name: string | null
        last_name: string | null
        email: string
    }
}

interface Reservation {
    id: string
    user_id: string
    equipment_id: string
    start_date: string
    end_date: string
    status: string
    created_at: string
}

interface SharedNotificationData {
    pendingLoans: LoanRequest[]
    activeLoans: LoanRequest[]
    dueToday: LoanRequest[]
    overdue: LoanRequest[]
    pendingReservations: Reservation[]
    isLoading: boolean
    refetch: () => void
}

const POLL_INTERVAL = 30000 // 30 seconds

function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
}

export function useSharedNotificationData(): SharedNotificationData {
    const queryClient = useQueryClient()

    // Realtime Subscription for Loans and Reservations
    useEffect(() => {
        const { url, key } = getSupabaseCredentials()
        if (!url || !key) return

        const client = createBrowserClient(url, key)

        const channel = client
            .channel('shared-data-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'loanRequests' },
                (payload: any) => {
                    // console.log('Loan change:', payload)
                    queryClient.invalidateQueries({ queryKey: ['shared-loans-data'] })
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reservations' },
                (payload: any) => {
                    // console.log('Reservation change:', payload)
                    queryClient.invalidateQueries({ queryKey: ['shared-reservations-data'] })
                }
            )
            .subscribe()

        return () => {
            client.removeChannel(channel)
        }
    }, [queryClient])

    // Fetch all loan requests with relevant data
    const { data: loansData, isLoading: loansLoading, refetch: refetchLoans } = useQuery({
        queryKey: ['shared-loans-data'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return { loans: [] }

            try {
                // Fetch loans with equipment and user info
                const response = await fetch(
                    `${url}/rest/v1/loanRequests?select=*,equipment(id,name,equipment_number),profiles(first_name,last_name,email)&order=created_at.desc`,
                    {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${key}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )

                if (!response.ok) {
                    console.error('[SharedData] Loans fetch error:', response.status)
                    return { loans: [] }
                }

                const loans = await response.json()
                return { loans: loans || [] }
            } catch (error) {
                console.error('[SharedData] Loans exception:', error)
                return { loans: [] }
            }
        },
        refetchInterval: POLL_INTERVAL,
        staleTime: 10000,
    })

    // Fetch pending reservations
    const { data: reservationsData, isLoading: reservationsLoading, refetch: refetchReservations } = useQuery({
        queryKey: ['shared-reservations-data'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return { reservations: [] }

            try {
                const response = await fetch(
                    `${url}/rest/v1/reservations?status=eq.pending&select=*&order=created_at.desc`,
                    {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${key}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )

                if (!response.ok) {
                    // Table might not exist yet
                    if (response.status === 404) {
                        return { reservations: [] }
                    }
                    console.error('[SharedData] Reservations fetch error:', response.status)
                    return { reservations: [] }
                }

                const reservations = await response.json()
                return { reservations: reservations || [] }
            } catch (error) {
                console.error('[SharedData] Reservations exception:', error)
                return { reservations: [] }
            }
        },
        refetchInterval: POLL_INTERVAL,
        staleTime: 10000,
    })

    const allLoans = loansData?.loans || []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    // Categorize loans
    const pendingLoans = allLoans.filter((loan: LoanRequest) => loan.status === 'pending')
    const activeLoans = allLoans.filter((loan: LoanRequest) => loan.status === 'approved')

    const dueToday = activeLoans.filter((loan: LoanRequest) => {
        const endDate = new Date(loan.end_date)
        return endDate >= today && endDate < tomorrow
    })

    const overdue = activeLoans.filter((loan: LoanRequest) => {
        const endDate = new Date(loan.end_date)
        if (loan.return_time) {
            const [hours, minutes] = loan.return_time.split(':').map(Number)
            endDate.setHours(hours, minutes, 0, 0)
            return endDate < now
        }
        return endDate < today // Default to < midnight of today (meaning yesterday was last day)
    })

    const refetch = () => {
        refetchLoans()
        refetchReservations()
    }

    return {
        pendingLoans,
        activeLoans,
        dueToday,
        overdue,
        pendingReservations: reservationsData?.reservations || [],
        isLoading: loansLoading || reservationsLoading,
        refetch,
    }
}
