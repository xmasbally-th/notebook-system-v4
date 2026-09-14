import { createClient } from '@/lib/supabase/server'

export interface StaffDashboardStats {
    pending: number
    approved: number
    overdue: number
    total: number
    pendingReservations: number
    todayBorrowed: number
    todayReturned: number
    todayDue: number
}

export interface RecentActivityItem {
    id: string
    status: string
    updated_at: string
    profiles: {
        first_name: string | null
        last_name: string | null
    } | null
    equipment: {
        name: string | null
        equipment_number: string | null
    } | null
}

export interface EquipmentInventoryItem {
    id: string
    name: string
    equipment_number: string
    status: string
    category_name?: string
    current_borrower?: {
        name: string
        end_date: string
    } | null
}

export interface EquipmentInventorySummary {
    total: number
    borrowedCount: number
    availableCount: number
    maintenanceCount: number
    items: EquipmentInventoryItem[]
}

export interface PendingLoanQueueItem {
    id: string
    start_date: string
    end_date: string
    return_time?: string | null
    created_at: string
    reason: string | null
    profiles: {
        id: string
        first_name: string | null
        last_name: string | null
        phone_number: string | null
        user_id: string | null
        email: string | null
        user_type?: string | null
    } | null
    equipment: {
        id: string
        name: string | null
        equipment_number: string | null
        images?: any
    } | null
}

export interface TodayReservationQueueItem {
    id: string
    start_date: string
    end_date: string
    pickup_time?: string | null
    return_time?: string | null
    status: string
    created_at: string
    profiles: {
        id: string
        first_name: string | null
        last_name: string | null
        phone_number: string | null
        user_id: string | null
        email?: string | null
        departments?: { name: string } | null
    } | null
    equipment: {
        id: string
        name: string | null
        equipment_number: string | null
    } | null
}

export interface OverdueLoanQueueItem {
    id: string
    start_date: string
    end_date: string
    days_overdue: number
    profiles: {
        id: string
        first_name: string | null
        last_name: string | null
        phone_number: string | null
        email: string | null
        user_id: string | null
    } | null
    equipment: {
        id: string
        name: string | null
        equipment_number: string | null
    } | null
}

export interface StaffActionQueues {
    pendingLoans: PendingLoanQueueItem[]
    todayReservations: TodayReservationQueueItem[]
    overdueLoans: OverdueLoanQueueItem[]
}

/**
 * Fetch staff dashboard stats using parallel queries.
 */
export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
    try {
        const supabase = await createClient()
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const todayStartIso = `${todayStr}T00:00:00.000Z`
        const todayEndIso = `${todayStr}T23:59:59.999Z`

        const [
            totalResult,
            pendingResult,
            approvedResult,
            overdueResult,
            pendingResResult,
            todayBorrowedResult,
            todayReturnedResult,
            todayDueResult
        ] = await Promise.all([
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved').lt('end_date', todayStr),
            supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('updated_at', todayStartIso),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'returned').gte('updated_at', todayStartIso),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('end_date', todayStartIso).lte('end_date', todayEndIso)
        ])

        return {
            total: totalResult.count ?? 0,
            pending: pendingResult.count ?? 0,
            approved: approvedResult.count ?? 0,
            overdue: overdueResult.count ?? 0,
            pendingReservations: pendingResResult.count ?? 0,
            todayBorrowed: todayBorrowedResult.count ?? 0,
            todayReturned: todayReturnedResult.count ?? 0,
            todayDue: todayDueResult.count ?? 0,
        }
    } catch (e: any) {
        if (e?.digest === 'DYNAMIC_SERVER_USAGE') {
            throw e
        }
        console.error('[getStaffDashboardStats] Error:', e)
        return {
            pending: 0,
            approved: 0,
            overdue: 0,
            total: 0,
            pendingReservations: 0,
            todayBorrowed: 0,
            todayReturned: 0,
            todayDue: 0
        }
    }
}

/**
 * Fetch 10 most recent loan activity items including equipment number.
 */
export async function getRecentActivity(): Promise<RecentActivityItem[]> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('loanRequests')
            .select('id, status, updated_at, profiles!fk_loanrequests_profiles(first_name, last_name), equipment(name, equipment_number)')
            .order('updated_at', { ascending: false })
            .limit(10)

        if (error || !data) return []
        return data as unknown as RecentActivityItem[]
    } catch {
        return []
    }
}

/**
 * Fetch detailed equipment inventory status breakdown (borrowed, remaining, which items).
 */
export async function getEquipmentInventorySummary(): Promise<EquipmentInventorySummary> {
    try {
        const supabase = await createClient()

        // Fetch equipment & active loans
        const [equipmentRes, activeLoansRes] = await Promise.all([
            supabase
                .from('equipment')
                .select('id, name, equipment_number, status, equipment_types(name)')
                .order('equipment_number', { ascending: true }),
            supabase
                .from('loanRequests')
                .select('equipment_id, end_date, profiles!fk_loanrequests_profiles(first_name, last_name)')
                .eq('status', 'approved')
        ])

        const equipmentList = equipmentRes.data || []
        const activeLoans = activeLoansRes.data || []

        const activeLoansMap = new Map()
        activeLoans.forEach((loan: any) => {
            const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim()
            activeLoansMap.set(loan.equipment_id, {
                name: borrowerName || 'ผู้ใช้',
                end_date: loan.end_date
            })
        })

        let borrowedCount = 0
        let availableCount = 0
        let maintenanceCount = 0

        const items: EquipmentInventoryItem[] = equipmentList.map((item: any) => {
            const isBorrowed = item.status === 'borrowed' || activeLoansMap.has(item.id)
            const currentBorrower = activeLoansMap.get(item.id) || null

            if (isBorrowed) {
                borrowedCount++
            } else if (item.status === 'maintenance' || item.status === 'retired') {
                maintenanceCount++
            } else {
                availableCount++
            }

            return {
                id: item.id,
                name: item.name,
                equipment_number: item.equipment_number || '-',
                status: isBorrowed ? 'borrowed' : item.status,
                category_name: item.equipment_types?.name || 'ทั่วไป',
                current_borrower: currentBorrower
            }
        })

        return {
            total: items.length,
            borrowedCount,
            availableCount,
            maintenanceCount,
            items
        }
    } catch (e: any) {
        if (e?.digest === 'DYNAMIC_SERVER_USAGE') {
            throw e
        }
        console.error('[getEquipmentInventorySummary] Error:', e)
        return {
            total: 0,
            borrowedCount: 0,
            availableCount: 0,
            maintenanceCount: 0,
            items: []
        }
    }
}

/**
 * Fetch prioritized action queues for staff:
 * 1. Pending loan requests (need approval)
 * 2. Today's reservation pickups or active reservations
 * 3. Overdue loans watchlist
 */
export async function getStaffActionQueues(): Promise<StaffActionQueues> {
    try {
        const supabase = await createClient()
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]

        const [pendingLoansRes, reservationsRes, overdueLoansRes] = await Promise.all([
            // 1. Pending loans
            supabase
                .from('loanRequests')
                .select(`
                    id,
                    start_date,
                    end_date,
                    return_time,
                    reason,
                    created_at,
                    profiles!fk_loanrequests_profiles(id, first_name, last_name, phone_number, user_id, email, user_type),
                    equipment(id, name, equipment_number, images)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(6),

            // 2. Active reservations that are pending or ready/approved for today
            supabase
                .from('reservations')
                .select(`
                    id,
                    user_id,
                    start_date,
                    end_date,
                    pickup_time,
                    return_time,
                    status,
                    created_at,
                    equipment(id, name, equipment_number)
                `)
                .in('status', ['pending', 'approved', 'ready'])
                .order('start_date', { ascending: true })
                .limit(6),

            // 3. Overdue loans
            supabase
                .from('loanRequests')
                .select(`
                    id,
                    start_date,
                    end_date,
                    profiles!fk_loanrequests_profiles(id, first_name, last_name, phone_number, email, user_id),
                    equipment(id, name, equipment_number)
                `)
                .eq('status', 'approved')
                .lt('end_date', todayStr)
                .order('end_date', { ascending: true })
                .limit(6)
        ])

        const pendingLoans = (pendingLoansRes.data || []) as unknown as PendingLoanQueueItem[]

        // Hydrate profiles for reservations
        const rawReservations = reservationsRes.data || []
        const resUserIds = Array.from(new Set(rawReservations.map((r: any) => r.user_id).filter(Boolean)))
        let resProfilesMap = new Map<string, any>()
        if (resUserIds.length > 0) {
            const { data: resProfiles } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, phone_number, user_id, email, departments(name)')
                .in('id', resUserIds)
            if (resProfiles) {
                resProfilesMap = new Map(resProfiles.map((p: any) => [p.id, p]))
            }
        }

        const todayReservations: TodayReservationQueueItem[] = rawReservations.map((r: any) => {
            const prof = resProfilesMap.get(r.user_id) || null
            return {
                id: r.id,
                start_date: r.start_date,
                end_date: r.end_date,
                pickup_time: r.pickup_time,
                return_time: r.return_time,
                status: r.status,
                created_at: r.created_at,
                profiles: prof ? {
                    id: prof.id,
                    first_name: prof.first_name,
                    last_name: prof.last_name,
                    phone_number: prof.phone_number,
                    user_id: prof.user_id,
                    email: prof.email,
                    departments: Array.isArray(prof.departments) ? prof.departments[0] : prof.departments
                } : null,
                equipment: r.equipment
            }
        })

        // Map overdue loans and calculate days_overdue
        const overdueLoans: OverdueLoanQueueItem[] = (overdueLoansRes.data || []).map((loan: any) => {
            const endDate = new Date(loan.end_date)
            const diffTime = Math.max(0, now.getTime() - endDate.getTime())
            const daysOverdue = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

            return {
                id: loan.id,
                start_date: loan.start_date,
                end_date: loan.end_date,
                days_overdue: daysOverdue,
                profiles: loan.profiles,
                equipment: loan.equipment
            }
        })

        return {
            pendingLoans,
            todayReservations,
            overdueLoans
        }
    } catch (e: any) {
        if (e?.digest === 'DYNAMIC_SERVER_USAGE') {
            throw e
        }
        console.error('[getStaffActionQueues] Error:', e)
        return {
            pendingLoans: [],
            todayReservations: [],
            overdueLoans: []
        }
    }
}
