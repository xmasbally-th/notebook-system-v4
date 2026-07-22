import { createClient } from '@/lib/supabase/server'

export interface StaffDashboardStats {
    pending: number
    approved: number
    overdue: number
    total: number
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

/**
 * Fetch staff dashboard stats using parallel queries.
 */
export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
    try {
        const supabase = await createClient()

        const [allLoansResult, overdueResult] = await Promise.all([
            supabase
                .from('loanRequests')
                .select('id, status', { count: 'exact' }),
            supabase
                .from('loanRequests')
                .select('id, end_date')
                .eq('status', 'approved')
                .lt('end_date', new Date().toISOString().split('T')[0]),
        ])

        const loans = allLoansResult.data ?? []
        const overdue = overdueResult.data?.length ?? 0

        const pending = loans.filter((l) => l.status === 'pending').length
        const approved = loans.filter((l) => l.status === 'approved').length

        return {
            pending,
            approved,
            overdue,
            total: loans.length,
        }
    } catch {
        return { pending: 0, approved: 0, overdue: 0, total: 0 }
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
