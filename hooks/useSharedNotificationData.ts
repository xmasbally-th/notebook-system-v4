'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

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



export function useSharedNotificationData(): SharedNotificationData {
    const queryClient = useQueryClient()

    // Realtime Subscription
    useEffect(() => {
        const handleLoanChange = async (payload: any) => {
            if (payload.eventType === 'INSERT') {
                const { data, error } = await supabase
                    .from('loanRequests')
                    .select('*,equipment(id,name,equipment_number),profiles(first_name,last_name,email)')
                    .eq('id', payload.new.id)
                    .single()

                if (!error && data) {
                    queryClient.setQueryData(['shared-loans-data'], (old: { loans: LoanRequest[] } | undefined) => {
                        if (!old) return { loans: [data] }
                        return { loans: [data, ...old.loans] }
                    })
                }
            } else if (payload.eventType === 'UPDATE') {
                queryClient.setQueryData(['shared-loans-data'], (old: { loans: LoanRequest[] } | undefined) => {
                    if (!old) return old
                    return {
                        loans: old.loans.map(loan =>
                            loan.id === payload.new.id ? { ...loan, ...payload.new } : loan
                        )
                    }
                })
            } else if (payload.eventType === 'DELETE') {
                queryClient.setQueryData(['shared-loans-data'], (old: { loans: LoanRequest[] } | undefined) => {
                    if (!old) return old
                    return {
                        loans: old.loans.filter(loan => loan.id !== payload.old.id)
                    }
                })
            }
        }

        const handleReservationChange = async (payload: any) => {
            if (payload.eventType === 'INSERT') {
                if (payload.new.status === 'pending') {
                    queryClient.setQueryData(['shared-reservations-data'], (old: { reservations: Reservation[] } | undefined) => {
                        if (!old) return { reservations: [payload.new] }
                        return { reservations: [payload.new, ...old.reservations] }
                    })
                }
            } else if (payload.eventType === 'UPDATE') {
                if (payload.new.status !== 'pending') {
                    queryClient.setQueryData(['shared-reservations-data'], (old: { reservations: Reservation[] } | undefined) => {
                        if (!old) return old
                        return { reservations: old.reservations.filter(r => r.id !== payload.new.id) }
                    })
                } else {
                    queryClient.setQueryData(['shared-reservations-data'], (old: { reservations: Reservation[] } | undefined) => {
                        if (!old) return old
                        return {
                            reservations: old.reservations.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r)
                        }
                    })
                }
            } else if (payload.eventType === 'DELETE') {
                queryClient.setQueryData(['shared-reservations-data'], (old: { reservations: Reservation[] } | undefined) => {
                    if (!old) return old
                    return { reservations: old.reservations.filter(r => r.id !== payload.old.id) }
                })
            }
        }

        const channel = supabase
            .channel('shared-data-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loanRequests' }, handleLoanChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, handleReservationChange)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [queryClient])

    // Fetch all loan requests with relevant data
    const { data: loansData, isLoading: loansLoading, refetch: refetchLoans } = useQuery({
        queryKey: ['shared-loans-data'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loanRequests')
                .select('*,equipment(id,name,equipment_number),profiles(first_name,last_name,email)')
                .order('created_at', { ascending: false })

                .limit(100) // Optimization: Limit initial fetch

            if (error) {
                console.error('[SharedData] Loans fetch error:', error)
                return { loans: [] }
            }

            return { loans: data || [] }
        },
        staleTime: Infinity, // Keep data fresh essentially forever, only update via realtime
    })

    // Fetch pending reservations
    const { data: reservationsData, isLoading: reservationsLoading, refetch: refetchReservations } = useQuery({
        queryKey: ['shared-reservations-data'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('[SharedData] Reservations fetch error:', error)
                return { reservations: [] }
            }

            return { reservations: data || [] }
        },
        staleTime: Infinity,
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
