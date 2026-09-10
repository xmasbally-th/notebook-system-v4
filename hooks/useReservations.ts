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

            // Fetch reservations without problematic joins
            let queryUrl = `${url}/rest/v1/reservations?select=*&order=created_at.desc`

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
            const reservations = await response.json()

            if (reservations.length === 0) return []

            // Fetch profiles for users
            const userIds = Array.from(new Set(reservations.map((r: any) => r.user_id))) as string[]
            const profilesResponse = await fetch(
                `${url}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,first_name,last_name,email,phone_number`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            )
            const profiles = profilesResponse.ok ? await profilesResponse.json() : []
            const profilesMap = new Map(profiles.map((p: any) => [p.id, p]))

            // Fetch equipment
            const equipmentIds = Array.from(new Set(reservations.map((r: any) => r.equipment_id))) as string[]
            const equipmentResponse = await fetch(
                `${url}/rest/v1/equipment?id=in.(${equipmentIds.join(',')})&select=id,name,equipment_number,images,equipment_types(name,icon)`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            )
            const equipmentList = equipmentResponse.ok ? await equipmentResponse.json() : []
            const equipmentMap = new Map(equipmentList.map((e: any) => [e.id, e]))

            // Merge data
            return reservations.map((r: any) => ({
                ...r,
                profiles: profilesMap.get(r.user_id) || null,
                equipment: equipmentMap.get(r.equipment_id) || null
            }))
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
                `${url}/rest/v1/reservations?equipment_id=eq.${equipmentId}&status=in.(pending,approved,ready)&select=id,start_date,end_date,pickup_time,return_time,status`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken || key}`
                    }
                }
            )

            // Fetch loans
            const loanResponse = await fetch(
                `${url}/rest/v1/loanRequests?equipment_id=eq.${equipmentId}&status=in.(pending,approved)&select=id,start_date,end_date,return_time,status`,
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
    limit?: number
}) {
    return useQuery({
        queryKey: ['staff-activity-log', filters],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const accessToken = await getAccessToken()
            if (!accessToken) return []

            const limit = filters?.limit ?? 500

            // 1. Try single-query from staff_activity_log_view for maximum performance
            let viewUrl = `${url}/rest/v1/staff_activity_log_view?select=*&order=created_at.desc&limit=${limit}`
            if (filters?.staffId) {
                viewUrl += `&staff_id=eq.${filters.staffId}`
            }
            if (filters?.actionType) {
                viewUrl += `&action_type=eq.${filters.actionType}`
            }
            if (filters?.startDate) {
                viewUrl += `&created_at=gte.${filters.startDate}`
            }
            if (filters?.endDate) {
                viewUrl += `&created_at=lte.${filters.endDate}`
            }

            try {
                const viewResponse = await fetch(viewUrl, {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${accessToken}`
                    }
                })

                if (viewResponse.ok) {
                    const viewData = await viewResponse.json()
                    return viewData.map((row: any) => ({
                        id: row.id,
                        staff_id: row.staff_id,
                        staff_role: row.staff_role,
                        action_type: row.action_type,
                        target_type: row.target_type,
                        target_id: row.target_id,
                        target_user_id: row.target_user_id,
                        is_self_action: row.is_self_action,
                        details: row.details || {},
                        created_at: row.created_at,
                        profiles: row.staff_first_name ? {
                            first_name: row.staff_first_name,
                            last_name: row.staff_last_name,
                            email: row.staff_email
                        } : null,
                        target_profile: row.target_first_name ? {
                            first_name: row.target_first_name,
                            last_name: row.target_last_name,
                            email: row.target_email,
                            user_id: row.target_user_student_id
                        } : null,
                        equipment: row.equipment_name ? {
                            name: row.equipment_name,
                            equipment_number: row.equipment_number || '-'
                        } : null
                    }))
                }
            } catch (err) {
                console.warn('[useStaffActivityLog] View fetch failed, falling back to multi-fetch:', err)
            }

            // 2. Fallback: Multi-fetch with parallel execution
            let queryUrl = `${url}/rest/v1/staff_activity_log?select=*&order=created_at.desc&limit=${limit}`

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
            const logs = await response.json()

            // Fetch profiles for staff members and target users
            const staffIds = Array.from(new Set(logs.map((log: any) => log.staff_id).filter(Boolean))) as string[]
            const targetUserIds = Array.from(new Set(logs.map((log: any) => log.target_user_id).filter(Boolean))) as string[]
            const allUserIds = Array.from(new Set([...staffIds, ...targetUserIds])) as string[]

            const loanIds = logs.filter((l: any) => l.target_type === 'loan' && l.target_id).map((l: any) => l.target_id)
            const reservationIds = logs.filter((l: any) => l.target_type === 'reservation' && l.target_id).map((l: any) => l.target_id)

            // Run hydration queries in parallel
            const [profilesRes, loanRes, resRes] = await Promise.all([
                allUserIds.length > 0
                    ? fetch(`${url}/rest/v1/profiles?id=in.(${allUserIds.join(',')})&select=id,first_name,last_name,email,user_id`, {
                        headers: { 'apikey': key, 'Authorization': `Bearer ${accessToken}` }
                    })
                    : Promise.resolve(null),
                loanIds.length > 0
                    ? fetch(`${url}/rest/v1/loanRequests?id=in.(${loanIds.join(',')})&select=id,equipment(name,equipment_number)`, {
                        headers: { 'apikey': key, 'Authorization': `Bearer ${accessToken}` }
                    })
                    : Promise.resolve(null),
                reservationIds.length > 0
                    ? fetch(`${url}/rest/v1/reservations?id=in.(${reservationIds.join(',')})&select=id,equipment(name,equipment_number)`, {
                        headers: { 'apikey': key, 'Authorization': `Bearer ${accessToken}` }
                    })
                    : Promise.resolve(null)
            ])

            let profilesMap = new Map()
            if (profilesRes && profilesRes.ok) {
                const profiles = await profilesRes.json()
                profilesMap = new Map(profiles.map((p: any) => [p.id, p]))
            }

            const loanDetailsMap = new Map()
            if (loanRes && loanRes.ok) {
                const loansData = await loanRes.json()
                loansData.forEach((ld: any) => loanDetailsMap.set(ld.id, ld))
            }

            const resDetailsMap = new Map()
            if (resRes && resRes.ok) {
                const resData = await resRes.json()
                resData.forEach((rd: any) => resDetailsMap.set(rd.id, rd))
            }

            // Merge profiles and equipment into logs
            return logs.map((log: any) => {
                const targetObj = log.target_type === 'loan'
                    ? loanDetailsMap.get(log.target_id)
                    : log.target_type === 'reservation'
                        ? resDetailsMap.get(log.target_id)
                        : null

                const targetProfile = profilesMap.get(log.target_user_id) || null

                // Extract equipment info: targetObj relation -> details (equipment/equipment_name) -> special_loan
                let equipment = targetObj?.equipment || null
                if (!equipment) {
                    const equipName = log.details?.equipment_name || log.details?.name
                    if (equipName) {
                        equipment = {
                            name: equipName,
                            equipment_number: log.details?.equipment_number || '-'
                        }
                    } else if (log.target_type === 'special_loan' && log.details?.equipment_type) {
                        equipment = {
                            name: `${log.details.equipment_type} (${log.details.quantity || 1} ชิ้น)`,
                            equipment_number: '-'
                        }
                    }
                }

                return {
                    ...log,
                    profiles: profilesMap.get(log.staff_id) || null,
                    target_profile: targetProfile,
                    equipment: equipment
                }
            })
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
