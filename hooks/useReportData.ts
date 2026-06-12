'use client'

import { useMemo } from 'react'
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
    calculateMonthlyStats,
    getDueDate
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

// Helper fetch function using Supabase credentials
async function fetchSupabase<T = any>(endpoint: string): Promise<T> {
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

    const res = await fetch(`${url}/rest/v1/${endpoint}`, { headers })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Failed to fetch ${endpoint}: ${text || res.statusText}`)
    }
    return res.json()
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

export interface EquipmentType {
    id: string
    name: string
    icon: string
}

export interface Equipment {
    id: string
    name: string
    equipment_number: string
    status: string
    equipment_type_id: string
    images: string[]
    brand?: string
    model?: string
}

export interface PopularEquipment {
    id: string
    name: string
    equipment_number: string
    loan_count: number
    returned_count: number
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

export interface MonthlyStatsDetail {
    id: string
    type: 'loan' | 'reservation'
    date: string
    user_name: string
    department: string
    equipment_name: string
    equipment_number: string
    status: string
}

export interface MonthlyStats {
    month: string
    monthKey: string
    loans: number
    reservations: number
    returned: number
    overdue: number
    equipmentTypeUsage: { name: string; icon: string; count: number }[]
    popularEquipment: { id: string; name: string; equipment_number: string; count: number }[]
    departmentUsage: { department: string; count: number }[]
    details: MonthlyStatsDetail[]
}

export interface SpecialLoanItem {
    id: string
    borrower_id: string | null
    borrower_name: string
    borrower_department: string | null
    external_borrower_org: string | null
    equipment_type_name: string
    quantity: number
    equipment_numbers: string[]
    loan_date: string
    return_date: string
    purpose: string
    status: 'active' | 'returned' | 'cancelled'
    returned_at: string | null
    created_at: string
}

export interface SpecialLoanStats {
    total: number
    active: number
    returned: number
    cancelled: number
    totalEquipment: number
    items: SpecialLoanItem[]
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
    departmentStats: { department: string; loans: number; reservations: number; total: number }[]
    staffActivity: StaffActivityStats
    monthlyStats: MonthlyStats[]
    equipmentTypes: EquipmentType[]
    allEquipment: Equipment[]
    borrowedEquipmentIds: Set<string>
    specialLoanStats: SpecialLoanStats
}

export function useReportData(dateRange: DateRange) {
    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    const today = useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    }, [])

    const sixMonthsAgo = useMemo(() => {
        const d = new Date(dateRange.to)
        d.setMonth(d.getMonth() - 5)
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
    }, [dateRange.to])
    const sixMonthsAgoISO = sixMonthsAgo.toISOString()

    // 1. Loans query
    const loansQuery = useQuery({
        queryKey: ['report-loans', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`loanRequests?select=id,status,created_at,end_date,returned_at,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`)
    })

    // 2. Reservations query
    const reservationsQuery = useQuery({
        queryKey: ['report-reservations', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`reservations?select=id,status,created_at,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`)
    })

    // 3. Equipment query (unfiltered, longer staleTime)
    const equipmentQuery = useQuery({
        queryKey: ['report-equipment'],
        staleTime: 5 * 60 * 1000, // 5 minutes
        queryFn: () => fetchSupabase<any[]>(`equipment?select=id,name,equipment_number,status,equipment_type_id,images,brand,model`)
    })

    // 4. Overdue query (all approved, longer staleTime)
    const overdueQuery = useQuery({
        queryKey: ['report-overdue-raw'],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`loanRequests?select=id,end_date,return_time,user_id,equipment_id,profiles!fk_loanrequests_profiles(first_name,last_name,email),equipment:equipment_id(name,equipment_number)&status=eq.approved`)
    })

    // 5. Profiles query (unfiltered, longer staleTime)
    const profilesQuery = useQuery({
        queryKey: ['report-profiles'],
        staleTime: 5 * 60 * 1000, // 5 minutes
        queryFn: () => fetchSupabase<any[]>(`profiles?status=eq.approved&select=id,email,first_name,last_name,avatar_url,department:departments(name),role,status`)
    })

    // 6. Staff activity log query
    const staffActivityQuery = useQuery({
        queryKey: ['report-staff-activity', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`staff_activity_log?select=id,staff_id,staff_role,action_type,target_type,target_id,created_at,details&created_at=gte.${fromDate}&created_at=lte.${toDate}&order=created_at.desc`)
    })

    // 7. Equipment types query
    const equipmentTypesQuery = useQuery({
        queryKey: ['report-equipment-types'],
        staleTime: 10 * 60 * 1000, // 10 minutes
        queryFn: () => fetchSupabase<any[]>(`equipment_types?select=id,name,icon&order=name.asc`)
    })

    // 8. Special loans query
    const specialLoansQuery = useQuery({
        queryKey: ['report-special-loans', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`special_loan_requests?select=id,borrower_id,borrower_name,external_borrower_org,equipment_type_name,quantity,equipment_numbers,loan_date,return_date,purpose,status,returned_at,created_at&created_at=gte.${fromDate}&created_at=lte.${toDate}&order=created_at.desc`)
    })

    // 9. Historical loans query
    const historicalLoansQuery = useQuery({
        queryKey: ['report-historical-loans', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`loanRequests?select=id,status,created_at,end_date,returned_at,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`)
    })

    // 10. Historical reservations query
    const historicalReservationsQuery = useQuery({
        queryKey: ['report-historical-reservations', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`reservations?select=id,status,created_at,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`)
    })

    const isLoading = loansQuery.isLoading ||
        reservationsQuery.isLoading ||
        equipmentQuery.isLoading ||
        overdueQuery.isLoading ||
        profilesQuery.isLoading ||
        staffActivityQuery.isLoading ||
        equipmentTypesQuery.isLoading ||
        specialLoansQuery.isLoading ||
        historicalLoansQuery.isLoading ||
        historicalReservationsQuery.isLoading

    const error = loansQuery.error ||
        reservationsQuery.error ||
        equipmentQuery.error ||
        overdueQuery.error ||
        profilesQuery.error ||
        staffActivityQuery.error ||
        equipmentTypesQuery.error ||
        specialLoansQuery.error ||
        historicalLoansQuery.error ||
        historicalReservationsQuery.error

    const data = useMemo<ReportData | undefined>(() => {
        if (
            !loansQuery.data ||
            !reservationsQuery.data ||
            !equipmentQuery.data ||
            !overdueQuery.data ||
            !profilesQuery.data ||
            !staffActivityQuery.data ||
            !equipmentTypesQuery.data ||
            !specialLoansQuery.data ||
            !historicalLoansQuery.data ||
            !historicalReservationsQuery.data
        ) {
            return undefined
        }

        const loans = loansQuery.data
        const reservations = reservationsQuery.data
        const equipment = equipmentQuery.data
        const rawOverdueLoans = overdueQuery.data
        const profiles = profilesQuery.data
        const staffActivityLog = staffActivityQuery.data
        const equipmentTypes = equipmentTypesQuery.data
        const specialLoansRaw = specialLoansQuery.data
        const monthlyLoans = historicalLoansQuery.data
        const monthlyReservations = historicalReservationsQuery.data

        // Filter overdue loans accurately using return_time & date range constraints (due date <= toDate)
        const now = new Date()
        const overdueLoans = Array.isArray(rawOverdueLoans)
            ? rawOverdueLoans.filter((loan: any) => {
                const dueDate = getDueDate(loan.end_date, loan.return_time)
                return now > dueDate && dueDate <= dateRange.to
            })
            : []

        // Process special loan stats
        let specialLoans: SpecialLoanItem[] = Array.isArray(specialLoansRaw) ? specialLoansRaw : []

        // Map borrower_department from profiles if borrower_id exists
        if (specialLoans.length > 0 && Array.isArray(profiles)) {
            specialLoans = specialLoans.map(loan => {
                if (loan.borrower_id) {
                    const profile = profiles.find(p => p.id === loan.borrower_id)
                    if (profile && profile.department) {
                        loan.borrower_department = profile.department.name
                    }
                }
                return loan
            })
        }

        const specialLoanStats: SpecialLoanStats = {
            total: specialLoans.length,
            active: specialLoans.filter(l => l.status === 'active').length,
            returned: specialLoans.filter(l => l.status === 'returned').length,
            cancelled: specialLoans.filter(l => l.status === 'cancelled').length,
            totalEquipment: specialLoans.reduce((sum, l) => sum + (l.quantity || 0), 0),
            items: specialLoans
        }

        // Use processor functions
        const loanStats = calculateLoanStats(loans, overdueLoans)
        const reservationStats = calculateReservationStats(reservations)
        const equipmentStats = calculateEquipmentStats(equipment)
        const popularEquipment = calculatePopularEquipment(loans, reservations, equipment)
        const overdueItems = formatOverdueItems(overdueLoans)
        const { userStats, departments, departmentStats } = calculateUserStats(profiles, loans, reservations, overdueLoans)
        const staffActivity = processStaffActivityLog(staffActivityLog, profiles)
        const monthlyStats = calculateMonthlyStats(monthlyLoans, monthlyReservations, equipment, profiles, equipmentTypes)

        // Count today's loans
        const todayLoans = Array.isArray(loans)
            ? loans.filter((l: any) => new Date(l.created_at) >= today).length
            : 0

        // Build a set of equipment IDs that are currently borrowed (loan status = approved)
        const borrowedEquipmentIds = new Set<string>(
            Array.isArray(loans)
                ? loans.filter((l: any) => l.status === 'approved' && l.equipment_id).map((l: any) => l.equipment_id)
                : []
        )

        return {
            loanStats,
            reservationStats,
            equipmentStats,
            popularEquipment,
            overdueItems,
            todayLoans,
            userStats,
            departments,
            departmentStats,
            staffActivity,
            monthlyStats,
            equipmentTypes: Array.isArray(equipmentTypes) ? equipmentTypes : [],
            allEquipment: Array.isArray(equipment) ? equipment : [],
            borrowedEquipmentIds,
            specialLoanStats
        }
    }, [
        loansQuery.data,
        reservationsQuery.data,
        equipmentQuery.data,
        overdueQuery.data,
        profilesQuery.data,
        staffActivityQuery.data,
        equipmentTypesQuery.data,
        specialLoansQuery.data,
        historicalLoansQuery.data,
        historicalReservationsQuery.data,
        dateRange.to,
        today
    ])

    return { data, isLoading, error }
}
