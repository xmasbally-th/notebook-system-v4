'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import {
    calculateLoanStats,
    calculateReservationStats,
    calculateEquipmentStats,
    calculatePopularEquipment,
    formatOverdueItems,
    calculateUserStats,
    processStaffActivityLog,
    calculateMonthlyStats
} from '@/lib/reportDataProcessors'

// Get access token from session
async function getAccessToken(): Promise<string | null> {
    try {
        const { url, key } = getSupabaseCredentials()
        if (!url || !key) return null

        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(url, key)
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
    } catch {
        return null
    }
}

// Type exports
export interface DateRange {
    from: Date
    to: Date
}

export interface LoanStats {
    total: number
    pending: number
    approved: number
    returned: number
    rejected: number
    overdue: number
}

export interface ReservationStats {
    total: number
    pending: number
    approved: number
    completed: number
    cancelled: number
    rejected: number
}

export interface EquipmentStats {
    total: number
    ready: number
    borrowed: number
    maintenance: number
}

export interface PopularEquipment {
    id: string
    name: string
    equipment_number: string
    loan_count: number
    reservation_count: number
    total_usage: number
}

export interface OverdueItem {
    id: string
    user_name: string
    user_email: string
    equipment_name: string
    equipment_number: string
    end_date: string
    days_overdue: number
}

export interface UserStats {
    id: string
    email: string
    first_name: string
    last_name: string
    avatar_url?: string | null
    department: string
    user_type: string
    loan_count: number
    reservation_count: number
    total_activity: number
    overdue_count: number
}

export interface StaffActivityItem {
    id: string
    staff_id: string
    staff_name: string
    staff_role: string
    staff_avatar?: string | null
    action_type: string
    target_type: string
    target_id: string
    created_at: string
    details: Record<string, any>
}

export interface StaffActivityStats {
    total: number
    byActionType: { name: string; count: number }[]
    byStaff: { name: string; approve: number; reject: number; return: number; avatar?: string | null }[]
    recentActivities: StaffActivityItem[]
    dailyActivity: { date: string; count: number }[]
}

export interface MonthlyStats {
    month: string
    loans: number
    reservations: number
    returned: number
    overdue: number
}

export interface ReportData {
    loanStats: LoanStats
    reservationStats: ReservationStats
    equipmentStats: EquipmentStats
    popularEquipment: PopularEquipment[]
    overdueItems: OverdueItem[]
    todayLoans: number
    userStats: UserStats[]
    departments: string[]
    staffActivity: StaffActivityStats
    monthlyStats: MonthlyStats[]
}

export function useReportData(dateRange: DateRange) {
    return useQuery({
        queryKey: ['report-data', dateRange.from.toISOString(), dateRange.to.toISOString()],
        staleTime: 60000, // 1 minute
        queryFn: async (): Promise<ReportData> => {
            const { url, key } = getSupabaseCredentials()
            const token = await getAccessToken()

            if (!url || !key || !token) {
                throw new Error('Missing credentials')
            }

            const headers = {
                'apikey': key,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }

            const fromDate = dateRange.from.toISOString()
            const toDate = dateRange.to.toISOString()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Parallel fetch all data
            const [
                loansRes,
                reservationsRes,
                equipmentRes,
                overdueRes,
                profilesRes,
                staffActivityRes
            ] = await Promise.all([
                // Loans in date range
                fetch(`${url}/rest/v1/loanRequests?select=id,status,created_at,end_date,returned_at,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`, { headers }),
                // Reservations in date range (with equipment_id for usage stats - Issue #6 fix)
                fetch(`${url}/rest/v1/reservations?select=id,status,created_at,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`, { headers }),
                // All equipment
                fetch(`${url}/rest/v1/equipment?select=id,name,equipment_number,status`, { headers }),
                // Overdue loans (approved but past end_date)
                fetch(`${url}/rest/v1/loanRequests?select=id,end_date,user_id,equipment_id,profiles:user_id(first_name,last_name,email),equipment:equipment_id(name,equipment_number)&status=eq.approved&end_date=lt.${new Date().toISOString()}`, { headers }),
                // All profiles for user stats (added avatar_url)
                fetch(`${url}/rest/v1/profiles?status=eq.approved&select=id,email,first_name,last_name,avatar_url,department:departments(name),role,status`, { headers }),
                // Staff activity log in date range - REMOVED profiles embed to fix FK issue
                fetch(`${url}/rest/v1/staff_activity_log?select=id,staff_id,staff_role,action_type,target_type,target_id,created_at,details&created_at=gte.${fromDate}&created_at=lte.${toDate}&order=created_at.desc`, { headers })
            ])

            const [loans, reservations, equipment, overdueLoans, profiles, staffActivityLog] = await Promise.all([
                loansRes.json(),
                reservationsRes.json(),
                equipmentRes.json(),
                overdueRes.json(),
                profilesRes.json(),
                staffActivityRes.json()
            ])

            // Use processor functions
            const loanStats = calculateLoanStats(loans, overdueLoans)
            const reservationStats = calculateReservationStats(reservations)
            const equipmentStats = calculateEquipmentStats(equipment)
            const popularEquipment = calculatePopularEquipment(loans, reservations, equipment)
            const overdueItems = formatOverdueItems(overdueLoans)
            const { userStats, departments } = calculateUserStats(profiles, loans, reservations, overdueLoans)
            const staffActivity = processStaffActivityLog(staffActivityLog, profiles)
            const monthlyStats = calculateMonthlyStats(loans, reservations)

            // Count today's loans
            const todayLoans = Array.isArray(loans)
                ? loans.filter((l: any) => new Date(l.created_at) >= today).length
                : 0

            return {
                loanStats,
                reservationStats,
                equipmentStats,
                popularEquipment,
                overdueItems,
                todayLoans,
                userStats,
                departments,
                staffActivity,
                monthlyStats
            }
        }
    })
}
