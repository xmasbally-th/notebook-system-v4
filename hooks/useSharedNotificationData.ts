'use client'

import { useQuery } from '@tanstack/react-query'

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
        return endDate < today
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
