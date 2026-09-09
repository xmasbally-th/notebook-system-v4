'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { supabase } from '@/lib/supabase/client'
import {
    calculateLoanStats,
    calculateReservationStats,
    calculateEquipmentStats,
    calculatePopularEquipment,
    calculateEquipmentUsageMap,
    formatOverdueItems,
    calculateUserStats,
    processStaffActivityLog,
    calculateMonthlyStats,
    getDueDate
} from '@/lib/reportDataProcessors'

// Token caching to eliminate redundant concurrent getSession calls
let cachedToken: { token: string | null; expiry: number } | null = null
let pendingTokenPromise: Promise<string | null> | null = null

async function getAccessToken(): Promise<string | null> {
    const now = Date.now()
    if (cachedToken && cachedToken.expiry > now) {
        return cachedToken.token
    }
    if (pendingTokenPromise) {
        return pendingTokenPromise
    }

    pendingTokenPromise = (async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token || null
            cachedToken = { token, expiry: Date.now() + 30000 } // Cache for 30s
            return token
        } catch {
            return null
        } finally {
            pendingTokenPromise = null
        }
    })()

    return pendingTokenPromise
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

export interface BorrowedEquipmentInfo {
    loanId: string
    borrowerId: string
    borrowerName: string
    borrowerEmail?: string
    borrowerDepartment?: string
    borrowerAvatar?: string | null
    startDate?: string | null
    endDate: string
    returnTime?: string | null
    purpose?: string | null
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
    borrowedEquipmentMap: Record<string, BorrowedEquipmentInfo>
    equipmentUsageMap: Record<string, { loan_count: number; returned_count: number }>
    specialLoanStats: SpecialLoanStats
}

export function useReportData(dateRange: DateRange, activeTab: string = 'overview') {
    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    const today = useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    }, [])

    // 1. Loans query (core)
    const loansQuery = useQuery({
        queryKey: ['report-loans', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`loanRequests?select=id,status,created_at,start_date,end_date,return_time,returned_at,purpose,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`)
    })

    // 2. Reservations query (core)
    const reservationsQuery = useQuery({
        queryKey: ['report-reservations', fromDate, toDate],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`reservations?select=id,status,created_at,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`)
    })

    // 3. Equipment query without unused 'images' column (core, 5 min cache)
    const equipmentQuery = useQuery({
        queryKey: ['report-equipment'],
        staleTime: 5 * 60 * 1000,
        queryFn: () => fetchSupabase<any[]>(`equipment?select=id,name,equipment_number,status,equipment_type_id,brand,model`)
    })

    // 4. Overdue query (all approved with borrower profile, core)
    const overdueQuery = useQuery({
        queryKey: ['report-overdue-raw'],
        staleTime: 60000,
        queryFn: () => fetchSupabase<any[]>(`loanRequests?select=id,start_date,end_date,return_time,purpose,user_id,equipment_id,profiles!fk_loanrequests_profiles(first_name,last_name,email,avatar_url,department:departments(name)),equipment:equipment_id(name,equipment_number)&status=eq.approved`)
    })

    // 5. Profiles query (core, 5 min cache)
    const profilesQuery = useQuery({
        queryKey: ['report-profiles'],
        staleTime: 5 * 60 * 1000,
        queryFn: () => fetchSupabase<any[]>(`profiles?status=eq.approved&select=id,email,first_name,last_name,avatar_url,department:departments(name),role,status`)
    })

    // 6. Equipment types query (core, 10 min cache)
    const equipmentTypesQuery = useQuery({
        queryKey: ['report-equipment-types'],
        staleTime: 10 * 60 * 1000,
        queryFn: () => fetchSupabase<any[]>(`equipment_types?select=id,name,icon&order=name.asc`)
    })

    // 7. Staff activity log query (tab-specific: only enabled when on 'activity' tab)
    const staffActivityQuery = useQuery({
        queryKey: ['report-staff-activity', fromDate, toDate],
        staleTime: 60000,
        enabled: activeTab === 'activity',
        queryFn: () => fetchSupabase<any[]>(`staff_activity_log?select=id,staff_id,staff_role,action_type,target_type,target_id,created_at,details&created_at=gte.${fromDate}&created_at=lte.${toDate}&order=created_at.desc`)
    })

    // 8. Special loans query (tab-specific: only enabled when on 'loans' tab)
    const specialLoansQuery = useQuery({
        queryKey: ['report-special-loans', fromDate, toDate],
        staleTime: 60000,
        enabled: activeTab === 'loans',
        queryFn: () => fetchSupabase<any[]>(`special_loan_requests?select=id,borrower_id,borrower_name,external_borrower_org,equipment_type_name,quantity,equipment_numbers,loan_date,return_date,purpose,status,returned_at,created_at&created_at=gte.${fromDate}&created_at=lte.${toDate}&order=created_at.desc`)
    })

    // Decoupled loading: core queries determine primary loading state
    const isCoreLoading = loansQuery.isLoading ||
        reservationsQuery.isLoading ||
        equipmentQuery.isLoading ||
        overdueQuery.isLoading ||
        profilesQuery.isLoading ||
        equipmentTypesQuery.isLoading

    const isLoading = isCoreLoading ||
        (activeTab === 'activity' && staffActivityQuery.isLoading) ||
        (activeTab === 'loans' && specialLoansQuery.isLoading)

    const error = loansQuery.error ||
        reservationsQuery.error ||
        equipmentQuery.error ||
        overdueQuery.error ||
        profilesQuery.error ||
        equipmentTypesQuery.error ||
        (activeTab === 'activity' ? staffActivityQuery.error : null) ||
        (activeTab === 'loans' ? specialLoansQuery.error : null)

    const data = useMemo<ReportData | undefined>(() => {
        // Return undefined only if core queries haven't resolved yet
        if (
            !loansQuery.data ||
            !reservationsQuery.data ||
            !equipmentQuery.data ||
            !overdueQuery.data ||
            !profilesQuery.data ||
            !equipmentTypesQuery.data
        ) {
            return undefined
        }

        const loans = loansQuery.data
        const reservations = reservationsQuery.data
        const equipment = equipmentQuery.data
        const rawOverdueLoans = overdueQuery.data
        const profiles = profilesQuery.data
        const staffActivityLog = staffActivityQuery.data || []
        const equipmentTypes = equipmentTypesQuery.data
        const specialLoansRaw = specialLoansQuery.data || []
        const monthlyLoans = loans
        const monthlyReservations = reservations

        // Filter overdue loans accurately using return_time & date range constraints (due date <= toDate)
        const now = new Date()
        const overdueLoans = Array.isArray(rawOverdueLoans)
            ? rawOverdueLoans.filter((loan: any) => {
                const dueDate = getDueDate(loan.end_date, loan.return_time)
                return now > dueDate && dueDate <= dateRange.to
            })
            : []

        // Pre-build profile map for O(1) lookups
        const profileMap = new Map<string, any>()
        if (Array.isArray(profiles)) {
            profiles.forEach(p => profileMap.set(p.id, p))
        }

        // Process special loan stats
        let specialLoans: SpecialLoanItem[] = Array.isArray(specialLoansRaw) ? [...specialLoansRaw] : []
        if (specialLoans.length > 0 && profileMap.size > 0) {
            specialLoans = specialLoans.map(loan => {
                if (loan.borrower_id) {
                    const profile = profileMap.get(loan.borrower_id)
                    if (profile && profile.department) {
                        loan.borrower_department = typeof profile.department === 'string'
                            ? profile.department
                            : profile.department.name || ''
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

        // Build borrowedEquipmentMap for immediate borrower lookup in EquipmentTab
        const borrowedEquipmentMap: Record<string, BorrowedEquipmentInfo> = {}
        if (Array.isArray(rawOverdueLoans)) {
            rawOverdueLoans.forEach((loan: any) => {
                if (loan.equipment_id && !borrowedEquipmentMap[loan.equipment_id]) {
                    const profile = loan.profiles || profileMap.get(loan.user_id)
                    const deptName = profile?.department
                        ? (typeof profile.department === 'string' ? profile.department : profile.department.name || '')
                        : ''
                    borrowedEquipmentMap[loan.equipment_id] = {
                        loanId: loan.id,
                        borrowerId: loan.user_id,
                        borrowerName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'ไม่ทราบชื่อ',
                        borrowerEmail: profile?.email,
                        borrowerDepartment: deptName,
                        borrowerAvatar: profile?.avatar_url,
                        startDate: loan.start_date,
                        endDate: loan.end_date,
                        returnTime: loan.return_time,
                        purpose: loan.purpose
                    }
                }
            })
        }

        // Use processor functions (with optimized O(N) performance)
        const loanStats = calculateLoanStats(loans, overdueLoans)
        const reservationStats = calculateReservationStats(reservations)
        const equipmentStats = calculateEquipmentStats(equipment)
        const popularEquipment = calculatePopularEquipment(loans, reservations, equipment)
        const equipmentUsageMap = calculateEquipmentUsageMap(loans, equipment)
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
            Array.isArray(rawOverdueLoans)
                ? rawOverdueLoans.filter((l: any) => l.equipment_id).map((l: any) => l.equipment_id)
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
            borrowedEquipmentMap,
            equipmentUsageMap,
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
        dateRange.to,
        today
    ])

    return { data, isLoading, error }
}
