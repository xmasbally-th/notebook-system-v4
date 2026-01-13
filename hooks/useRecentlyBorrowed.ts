'use client'

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) {
        console.error('[useRecentlyBorrowed] Missing Supabase env vars')
        return null
    }
    return createBrowserClient<Database>(url, key)
}

export interface RecentlyBorrowedItem {
    equipment_id: string
    last_borrowed_at: string
}

export function useRecentlyBorrowed() {
    return useQuery({
        queryKey: ['recently_borrowed'],
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        queryFn: async (): Promise<RecentlyBorrowedItem[]> => {
            const client = getSupabaseClient()
            if (!client) {
                return []
            }

            // Get current user
            const { data: { user } } = await client.auth.getUser()
            if (!user) {
                return []
            }

            // Fetch user's loan history (approved or returned loans)
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            const { data: session } = await client.auth.getSession()
            const accessToken = session?.session?.access_token || key

            const response = await fetch(
                `${url}/rest/v1/loanRequests?user_id=eq.${user.id}&status=in.(approved,returned)&select=equipment_id,created_at&order=created_at.desc&limit=20`,
                {
                    headers: {
                        'apikey': key || '',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            )

            if (!response.ok) {
                console.error('[useRecentlyBorrowed] Failed to fetch loans')
                return []
            }

            const loans = await response.json()

            // Group by equipment_id and get the most recent borrow date
            const equipmentMap = new Map<string, string>()

            for (const loan of loans) {
                if (!equipmentMap.has(loan.equipment_id)) {
                    equipmentMap.set(loan.equipment_id, loan.created_at)
                }
            }

            // Convert to array
            return Array.from(equipmentMap.entries()).map(([equipment_id, last_borrowed_at]) => ({
                equipment_id,
                last_borrowed_at,
            }))
        },
    })
}

// Helper function to check if an equipment was recently borrowed
export function isRecentlyBorrowed(equipmentId: string, recentlyBorrowed: RecentlyBorrowedItem[]): boolean {
    return recentlyBorrowed.some(item => item.equipment_id === equipmentId)
}

// Helper function to sort equipment by recently borrowed first
export function sortByRecentlyBorrowed<T extends { id: string }>(
    equipment: T[],
    recentlyBorrowed: RecentlyBorrowedItem[]
): T[] {
    const recentIds = new Set(recentlyBorrowed.map(r => r.equipment_id))

    return [...equipment].sort((a, b) => {
        const aRecent = recentIds.has(a.id)
        const bRecent = recentIds.has(b.id)

        if (aRecent && !bRecent) return -1
        if (!aRecent && bRecent) return 1
        return 0
    })
}
