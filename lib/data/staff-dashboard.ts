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
    } | null
}

/**
 * Fetch staff dashboard stats using parallel queries.
 * Runs on the server — no client-side waterfall.
 */
export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
    try {
        const supabase = await createClient()

        // Fetch all required data in parallel
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
 * Fetch 10 most recent loan activity items.
 * Selects only the fields needed for display.
 */
export async function getRecentActivity(): Promise<RecentActivityItem[]> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('loanRequests')
            .select('id, status, updated_at, profiles(first_name, last_name), equipment(name)')
            .order('updated_at', { ascending: false })
            .limit(10)

        if (error || !data) return []
        return data as unknown as RecentActivityItem[]
    } catch {
        return []
    }
}
