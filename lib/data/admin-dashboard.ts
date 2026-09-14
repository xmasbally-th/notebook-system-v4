import { createClient } from '@/lib/supabase/server'

export interface AdminDashboardStats {
    equipment: number
    equipmentAvailable: number
    equipmentBorrowed: number
    equipmentMaintenance: number
    pendingUsers: number
    totalUsers: number
    pendingLoans: number
    activeLoans: number
    overdueLoans: number
    pendingReservations: number
}

export interface AdminPendingUser {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    title: string | null
    user_type: string | null
    phone_number: string | null
    user_id: string | null
    avatar_url: string | null
    created_at: string
    departments: { name: string } | null
}

export interface AdminEquipmentCategory {
    id: string
    name: string
    total: number
    available: number
    borrowed: number
    maintenance: number
}

export interface AdminPendingLoan {
    id: string
    start_date: string
    end_date: string
    return_time?: string | null
    reason: string | null
    created_at: string
    profiles: {
        first_name: string | null
        last_name: string | null
        email: string | null
        phone_number: string | null
        user_id: string | null
    } | null
    equipment: {
        id: string
        name: string | null
        equipment_number: string | null
    } | null
}

export interface AdminOverdueLoan {
    id: string
    start_date: string
    end_date: string
    days_overdue: number
    profiles: {
        first_name: string | null
        last_name: string | null
        email: string | null
        phone_number: string | null
        user_id: string | null
    } | null
    equipment: {
        id: string
        name: string | null
        equipment_number: string | null
    } | null
}

export interface AdminDashboardData {
    stats: AdminDashboardStats
    pendingUsers: AdminPendingUser[]
    equipmentCategories: AdminEquipmentCategory[]
    pendingLoans: AdminPendingLoan[]
    overdueLoans: AdminOverdueLoan[]
}

/**
 * Fetch all essential metrics, action queues, and category breakdown for the Admin Dashboard in parallel.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
    try {
        const supabase = await createClient()
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]

        const [
            equipmentTotalRes,
            equipmentAvailableRes,
            equipmentBorrowedRes,
            equipmentMaintRes,
            pendingUsersCountRes,
            totalUsersCountRes,
            pendingLoansCountRes,
            activeLoansCountRes,
            overdueLoansCountRes,
            pendingResCountRes,
            pendingUsersListRes,
            pendingLoansListRes,
            overdueLoansListRes,
            equipmentCategoryListRes
        ] = await Promise.all([
            supabase.from('equipment').select('*', { count: 'exact', head: true }),
            supabase.from('equipment').select('*', { count: 'exact', head: true }).in('status', ['ready', 'active', 'available']),
            supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'borrowed'),
            supabase.from('equipment').select('*', { count: 'exact', head: true }).in('status', ['maintenance', 'retired']),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
            supabase.from('loanRequests').select('*', { count: 'exact', head: true }).eq('status', 'approved').lt('end_date', todayStr),
            supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('profiles').select('id, email, first_name, last_name, title, user_type, phone_number, user_id, avatar_url, created_at, departments(name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(6),
            supabase.from('loanRequests').select('id, start_date, end_date, return_time, reason, created_at, profiles!fk_loanrequests_profiles(first_name, last_name, email, phone_number, user_id), equipment(id, name, equipment_number)').eq('status', 'pending').order('created_at', { ascending: false }).limit(6),
            supabase.from('loanRequests').select('id, start_date, end_date, profiles!fk_loanrequests_profiles(first_name, last_name, email, phone_number, user_id), equipment(id, name, equipment_number)').eq('status', 'approved').lt('end_date', todayStr).order('end_date', { ascending: true }).limit(6),
            supabase.from('equipment').select('id, status, equipment_types(id, name)')
        ])

        const stats: AdminDashboardStats = {
            equipment: equipmentTotalRes.count ?? 0,
            equipmentAvailable: equipmentAvailableRes.count ?? 0,
            equipmentBorrowed: equipmentBorrowedRes.count ?? 0,
            equipmentMaintenance: equipmentMaintRes.count ?? 0,
            pendingUsers: pendingUsersCountRes.count ?? 0,
            totalUsers: totalUsersCountRes.count ?? 0,
            pendingLoans: pendingLoansCountRes.count ?? 0,
            activeLoans: activeLoansCountRes.count ?? 0,
            overdueLoans: overdueLoansCountRes.count ?? 0,
            pendingReservations: pendingResCountRes.count ?? 0
        }

        const pendingUsers = (pendingUsersListRes.data || []) as unknown as AdminPendingUser[]
        const pendingLoans = (pendingLoansListRes.data || []) as unknown as AdminPendingLoan[]

        const overdueLoans: AdminOverdueLoan[] = (overdueLoansListRes.data || []).map((loan: any) => {
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

        // Group equipment by category
        const categoryMap = new Map<string, AdminEquipmentCategory>()
        for (const eq of (equipmentCategoryListRes.data || [])) {
            const typeObj = Array.isArray(eq.equipment_types) ? eq.equipment_types[0] : eq.equipment_types
            const typeName = typeObj?.name || 'ทั่วไป'
            const typeId = typeObj?.id || 'general'
            
            if (!categoryMap.has(typeName)) {
                categoryMap.set(typeName, {
                    id: typeId,
                    name: typeName,
                    total: 0,
                    available: 0,
                    borrowed: 0,
                    maintenance: 0
                })
            }
            const cat = categoryMap.get(typeName)!
            cat.total++
            if (eq.status === 'borrowed') {
                cat.borrowed++
            } else if (eq.status === 'maintenance' || eq.status === 'retired') {
                cat.maintenance++
            } else {
                cat.available++
            }
        }

        const equipmentCategories = Array.from(categoryMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 6)

        return {
            stats,
            pendingUsers,
            equipmentCategories,
            pendingLoans,
            overdueLoans
        }
    } catch (e: any) {
        if (e?.digest === 'DYNAMIC_SERVER_USAGE') {
            throw e
        }
        console.error('[getAdminDashboardData] Error:', e)
        return {
            stats: {
                equipment: 0,
                equipmentAvailable: 0,
                equipmentBorrowed: 0,
                equipmentMaintenance: 0,
                pendingUsers: 0,
                totalUsers: 0,
                pendingLoans: 0,
                activeLoans: 0,
                overdueLoans: 0,
                pendingReservations: 0
            },
            pendingUsers: [],
            equipmentCategories: [],
            pendingLoans: [],
            overdueLoans: []
        }
    }
}
