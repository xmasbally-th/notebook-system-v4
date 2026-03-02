import { createClient } from '@/lib/supabase/server'

export interface MyLoanItem {
    id: string
    type: 'loan'
    status: string
    start_date: string
    end_date: string
    created_at: string
    updated_at: string
    return_time?: string | null
    rejection_reason?: string | null
    equipment: {
        id: string
        name: string
        equipment_number: string
        images: string[]
    } | null
    evaluations?: { id: string; rating: number }[]
}

export interface MyReservationItem {
    id: string
    type: 'reservation'
    status: string
    start_date: string
    end_date: string
    created_at: string
    updated_at: string
    return_time?: string | null
    rejection_reason?: string | null
    equipment: {
        id: string
        name: string
        equipment_number: string
        images: string[]
    } | null
}

export type MyHistoryItem = MyLoanItem | MyReservationItem

export interface MyLoansPageData {
    loans: MyLoanItem[]
    reservations: MyReservationItem[]
    evaluationCutoffDate: string
}

/**
 * Fetch all data needed for My Loans page in parallel.
 * Runs on the server — no client-side waterfall.
 */
export async function getMyLoansPageData(): Promise<MyLoansPageData> {
    try {
        const supabase = await createClient()

        const [loansResult, reservationsResult, configResult] = await Promise.all([
            supabase
                .from('loanRequests')
                .select('id, status, start_date, end_date, created_at, updated_at, return_time, rejection_reason, equipment(id, name, equipment_number, images), evaluations(id, rating)')
                .order('created_at', { ascending: false }),
            supabase
                .from('reservations')
                .select('id, status, start_date, end_date, created_at, updated_at, return_time, rejection_reason, equipment(id, name, equipment_number, images)')
                .order('created_at', { ascending: false }),
            supabase
                .from('system_config')
                .select('evaluation_cutoff_date')
                .single(),
        ])

        const loans = (loansResult.data ?? []).map((l) => ({ ...l, type: 'loan' as const }))
        const reservations = (reservationsResult.data ?? []).map((r) => ({ ...r, type: 'reservation' as const }))
        const evaluationCutoffDate =
            (configResult.data as any)?.evaluation_cutoff_date ||
            new Date().toISOString().split('T')[0]

        return {
            loans: loans as unknown as MyLoanItem[],
            reservations: reservations as unknown as MyReservationItem[],
            evaluationCutoffDate,
        }
    } catch {
        return {
            loans: [],
            reservations: [],
            evaluationCutoffDate: new Date().toISOString().split('T')[0],
        }
    }
}
