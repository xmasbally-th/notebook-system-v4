// useReservations - React hooks for reservation management
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { Reservation, ReservationStatus } from '@/lib/reservations'

// Get access token helper
async function getAccessToken(): Promise<string | null> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null

    const { createBrowserClient } = await import('@supabase/ssr')
    const client = createBrowserClient(url, key)
    const { data: { session } } = await client.auth.getSession()
    return session?.access_token || null
}

/**
 * Fetch user's own reservations
 */
export function useUserReservations() {
    return useQuery({
        queryKey: ['user-reservations'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            if (!session?.user?.id) return []

            const response = await fetch(
                `${url}/rest/v1/reservations?user_id=eq.${session.user.id}&select=*,equipment(name,equipment_number,images,equipment_types(name,icon))&order=created_at.desc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session.access_token}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        }
    })
}

/**
 * Fetch all reservations (Staff/Admin)
 */
export function useAllReservations(statusFilter?: ReservationStatus | 'all') {
    return useQuery({
        queryKey: ['all-reservations', statusFilter],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const accessToken = await getAccessToken()
            if (!accessToken) return []

            let queryUrl = `${url}/rest/v1/reservations?select=*,profiles(first_name,last_name,email,phone_number),equipment(name,equipment_number,images,equipment_types(name,icon))&order=created_at.desc`

            if (statusFilter && statusFilter !== 'all') {
                queryUrl += `&status=eq.${statusFilter}`
            }

            const response = await fetch(queryUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            if (!response.ok) return []
            return response.json()
        }
    })
}

/**
 * Get equipment availability calendar (reservations + loans)
 */
export function useEquipmentAvailability(equipmentId: string) {
    return useQuery({
        queryKey: ['equipment-availability', equipmentId],
        staleTime: 60000,
        enabled: !!equipmentId,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return { reservations: [], loans: [] }

            const accessToken = await getAccessToken()

            // Fetch reservations
            const resResponse = await fetch(
                `${url}/rest/v1/reservations?equipment_id=eq.${equipmentId}&status=in.(pending,approved,ready)&select=id,start_date,end_date,status`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken || key}`
                    }
                }
            )

            // Fetch loans
            const loanResponse = await fetch(
                `${url}/rest/v1/loanRequests?equipment_id=eq.${equipmentId}&status=in.(pending,approved)&select=id,start_date,end_date,status`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken || key}`
                    }
                }
            )

            const reservations = resResponse.ok ? await resResponse.json() : []
            const loans = loanResponse.ok ? await loanResponse.json() : []

            return { reservations, loans }
        }
    })
}

/**
 * Staff Activity Log (Admin)
 */
export function useStaffActivityLog(filters?: {
    staffId?: string
    actionType?: string
    startDate?: string
    endDate?: string
}) {
    return useQuery({
        queryKey: ['staff-activity-log', filters],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const accessToken = await getAccessToken()
            if (!accessToken) return []

            let queryUrl = `${url}/rest/v1/staff_activity_log?select=*,profiles:staff_id(first_name,last_name,email)&order=created_at.desc&limit=100`

            if (filters?.staffId) {
                queryUrl += `&staff_id=eq.${filters.staffId}`
            }
            if (filters?.actionType) {
                queryUrl += `&action_type=eq.${filters.actionType}`
            }
            if (filters?.startDate) {
                queryUrl += `&created_at=gte.${filters.startDate}`
            }
            if (filters?.endDate) {
                queryUrl += `&created_at=lte.${filters.endDate}`
            }

            const response = await fetch(queryUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            if (!response.ok) return []
            return response.json()
        }
    })
}

/**
 * Get staff list for filter dropdown
 */
export function useStaffList() {
    return useQuery({
        queryKey: ['staff-list'],
        staleTime: 300000, // 5 minutes
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const accessToken = await getAccessToken()
            if (!accessToken) return []

            const response = await fetch(
                `${url}/rest/v1/profiles?role=in.(staff,admin)&status=eq.approved&select=id,first_name,last_name,role&order=first_name`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        }
    })
}
