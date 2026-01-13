'use client'

import { useMemo } from 'react'
import { useSharedNotificationData } from './useSharedNotificationData'

/**
 * Staff Notifications Hook
 * Uses shared data - NO additional queries
 * Computes notification counts for Staff dashboard
 */

interface StaffNotifications {
    pendingLoansCount: number
    dueTodayCount: number
    overdueCount: number
    pendingReservationsCount: number
    totalCount: number
    isLoading: boolean
    refetch: () => void
    // Detail data for dropdown
    pendingLoans: any[]
    dueToday: any[]
    overdue: any[]
    pendingReservations: any[]
}

export function useStaffNotifications(isStaff: boolean): StaffNotifications {
    const sharedData = useSharedNotificationData()

    // Memoize computed values
    const notifications = useMemo(() => {
        if (!isStaff) {
            return {
                pendingLoansCount: 0,
                dueTodayCount: 0,
                overdueCount: 0,
                pendingReservationsCount: 0,
                totalCount: 0,
                pendingLoans: [],
                dueToday: [],
                overdue: [],
                pendingReservations: [],
            }
        }

        const pendingLoansCount = sharedData.pendingLoans.length
        const dueTodayCount = sharedData.dueToday.length
        const overdueCount = sharedData.overdue.length
        const pendingReservationsCount = sharedData.pendingReservations.length
        const totalCount = pendingLoansCount + dueTodayCount + overdueCount + pendingReservationsCount

        return {
            pendingLoansCount,
            dueTodayCount,
            overdueCount,
            pendingReservationsCount,
            totalCount,
            pendingLoans: sharedData.pendingLoans,
            dueToday: sharedData.dueToday,
            overdue: sharedData.overdue,
            pendingReservations: sharedData.pendingReservations,
        }
    }, [isStaff, sharedData])

    return {
        ...notifications,
        isLoading: sharedData.isLoading,
        refetch: sharedData.refetch,
    }
}
