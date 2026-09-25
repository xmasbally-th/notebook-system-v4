'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface PendingEvaluationLoan {
    id: string
    updated_at: string
    start_date: string
    end_date: string
    return_time?: string | null
    equipment: {
        id: string
        name: string
        equipment_number: string
        images?: string[]
    } | null
    evaluations?: { id: string }[]
}

interface PendingEvaluationsResult {
    pendingLoans: PendingEvaluationLoan[]
    pendingCount: number
    cutoffDate: string
}

export function usePendingEvaluations() {
    const { data, isLoading, refetch } = useQuery<PendingEvaluationsResult>({
        queryKey: ['pending-evaluations'],
        staleTime: 30 * 1000, // 30 seconds
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                return { pendingLoans: [], pendingCount: 0, cutoffDate: '' }
            }

            // Get cutoff date from system_config via RPC to bypass RLS lockout
            const { data: cutoffDateRaw, error: configError } = await (supabase as any)
                .rpc('get_evaluation_cutoff_date')

            if (configError) {
                console.error('[usePendingEvaluations] Error fetching cutoff date via RPC:', configError)
            }

            const cutoffDate = cutoffDateRaw || new Date().toISOString().split('T')[0]

            // Fetch returned loans that might not be evaluated
            const { data: loans, error } = await (supabase as any)
                .from('loanRequests')
                .select('id, updated_at, start_date, end_date, return_time, equipment(id, name, equipment_number, images), evaluations(id)')
                .eq('user_id', session.user.id)
                .eq('status', 'returned')
                .gte('updated_at', cutoffDate)
                .order('updated_at', { ascending: false })

            if (error || !loans) {
                return { pendingLoans: [], pendingCount: 0, cutoffDate }
            }

            // Filter loans that have NO evaluations
            const pendingLoans: PendingEvaluationLoan[] = loans.filter((loan: any) =>
                !loan.evaluations || loan.evaluations.length === 0
            )

            return {
                pendingLoans,
                pendingCount: pendingLoans.length,
                cutoffDate
            }
        }
    })

    return {
        pendingLoans: data?.pendingLoans || [],
        pendingCount: data?.pendingCount || 0,
        hasPendingEvaluations: (data?.pendingCount || 0) > 0,
        cutoffDate: data?.cutoffDate || '',
        isLoading,
        refetch
    }
}
