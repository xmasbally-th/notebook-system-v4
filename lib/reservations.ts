// Reservations API Library
import { getSupabaseCredentials } from './supabase-helpers'
import { logStaffActivity, ActionType } from './staffActivityLog'

export type ReservationStatus = 'pending' | 'approved' | 'ready' | 'completed' | 'rejected' | 'cancelled' | 'expired'

export interface Reservation {
    id: string
    user_id: string
    equipment_id: string
    start_date: string
    end_date: string
    status: ReservationStatus
    rejection_reason: string | null
    loan_id: string | null
    created_at: string
    ready_at: string | null
    // Joined data
    profiles?: {
        first_name: string | null
        last_name: string | null
        email: string | null
    }
    equipment?: {
        name: string
        equipment_number: string
        images: string[]
        equipment_type?: {
            name: string
            icon: string
        }
    }
}

// Get user's access token
async function getAccessToken(): Promise<string | null> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null

    const { createBrowserClient } = await import('@supabase/ssr')
    const client = createBrowserClient(url, key)
    const { data: { session } } = await client.auth.getSession()
    return session?.access_token || null
}

// Get current user info
async function getCurrentUser(): Promise<{ id: string, role: 'admin' | 'staff' | 'user' } | null> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null

    const { createBrowserClient } = await import('@supabase/ssr')
    const client = createBrowserClient(url, key)
    const { data: { session } } = await client.auth.getSession()

    if (!session?.user?.id) return null

    // Get user role from profiles
    const accessToken = session.access_token
    const response = await fetch(
        `${url}/rest/v1/profiles?id=eq.${session.user.id}&select=role`,
        {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`
            }
        }
    )

    if (!response.ok) return null
    const profiles = await response.json()
    if (!profiles[0]) return null

    return { id: session.user.id, role: profiles[0].role }
}

/**
 * Check if user has type conflict (already has reservation/loan of same equipment type)
 */
export async function checkTypeConflict(
    userId: string,
    equipmentId: string
): Promise<{ hasConflict: boolean; typeName?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { hasConflict: false }

    const accessToken = await getAccessToken()
    if (!accessToken) return { hasConflict: false }

    try {
        const response = await fetch(`${url}/rest/v1/rpc/check_user_type_conflict`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                check_user_id: userId,
                check_equipment_id: equipmentId
            })
        })

        if (!response.ok) {
            console.error('[checkTypeConflict] HTTP Error:', response.status)
            return { hasConflict: false }
        }

        const hasConflict = await response.json()
        return { hasConflict }
    } catch (error) {
        console.error('[checkTypeConflict] Error:', error)
        return { hasConflict: false }
    }
}

/**
 * Check if time slot conflicts with existing reservations/loans
 */
export async function checkTimeConflict(
    equipmentId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string
): Promise<boolean> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return true // Fail safe

    const accessToken = await getAccessToken()

    try {
        const response = await fetch(`${url}/rest/v1/rpc/check_combined_reservation_conflict`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken || key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target_equipment_id: equipmentId,
                new_start_date: startDate.toISOString(),
                new_end_date: endDate.toISOString(),
                exclude_reservation_id: excludeReservationId || null
            })
        })

        if (!response.ok) return true
        return await response.json()
    } catch (error) {
        console.error('[checkTimeConflict] Error:', error)
        return true
    }
}

/**
 * Create a new reservation
 */
export async function createReservation(
    equipmentId: string,
    startDate: string,
    endDate: string
): Promise<{ success: boolean; error?: string; reservationId?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const user = await getCurrentUser()
    if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    // Check type conflict
    const typeConflict = await checkTypeConflict(user.id, equipmentId)
    if (typeConflict.hasConflict) {
        return { success: false, error: 'คุณมีการจองหรือยืมอุปกรณ์ประเภทนี้อยู่แล้ว' }
    }

    // Check time conflict
    const timeConflict = await checkTimeConflict(equipmentId, new Date(startDate), new Date(endDate))
    if (timeConflict) {
        return { success: false, error: 'ช่วงเวลาที่เลือกมีการจองหรือยืมอยู่แล้ว' }
    }

    // Determine if self-approve (Staff/Admin)
    const isSelfAction = user.role === 'staff' || user.role === 'admin'
    const status = isSelfAction ? 'approved' : 'pending'

    try {
        const response = await fetch(`${url}/rest/v1/reservations`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: user.id,
                equipment_id: equipmentId,
                start_date: startDate,
                end_date: endDate,
                status,
                approved_at: isSelfAction ? new Date().toISOString() : null,
                approved_by: isSelfAction ? user.id : null
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[createReservation] Error:', errorText)
            return { success: false, error: 'ไม่สามารถสร้างการจองได้' }
        }

        const data = await response.json()
        const reservationId = data[0]?.id

        // Log activity if self-action
        if (isSelfAction && reservationId) {
            await logStaffActivity({
                staffId: user.id,
                staffRole: user.role as 'staff' | 'admin',
                actionType: 'self_reserve',
                targetType: 'reservation',
                targetId: reservationId,
                targetUserId: user.id,
                isSelfAction: true,
                details: { note: 'จองด้วยตัวเอง (auto-approved)' }
            })
        }

        return { success: true, reservationId }
    } catch (error) {
        console.error('[createReservation] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Cancel a reservation (user action)
 */
export async function cancelReservation(
    reservationId: string
): Promise<{ success: boolean; error?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        const response = await fetch(`${url}/rest/v1/reservations?id=eq.${reservationId}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
        })

        if (!response.ok) {
            return { success: false, error: 'ไม่สามารถยกเลิกการจองได้' }
        }

        return { success: true }
    } catch (error) {
        console.error('[cancelReservation] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Staff: Approve a reservation
 */
export async function approveReservation(
    reservationId: string,
    targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const user = await getCurrentUser()
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        const response = await fetch(`${url}/rest/v1/reservations?id=eq.${reservationId}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: user.id,
                updated_at: new Date().toISOString()
            })
        })

        if (!response.ok) {
            return { success: false, error: 'ไม่สามารถอนุมัติได้' }
        }

        // Log activity
        await logStaffActivity({
            staffId: user.id,
            staffRole: user.role as 'staff' | 'admin',
            actionType: 'approve_reservation',
            targetType: 'reservation',
            targetId: reservationId,
            targetUserId,
            isSelfAction: targetUserId === user.id
        })

        return { success: true }
    } catch (error) {
        console.error('[approveReservation] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Staff: Reject a reservation
 */
export async function rejectReservation(
    reservationId: string,
    reason: string,
    targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const user = await getCurrentUser()
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        const response = await fetch(`${url}/rest/v1/reservations?id=eq.${reservationId}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'rejected',
                rejection_reason: reason,
                updated_at: new Date().toISOString()
            })
        })

        if (!response.ok) {
            return { success: false, error: 'ไม่สามารถปฏิเสธได้' }
        }

        // Log activity
        await logStaffActivity({
            staffId: user.id,
            staffRole: user.role as 'staff' | 'admin',
            actionType: 'reject_reservation',
            targetType: 'reservation',
            targetId: reservationId,
            targetUserId,
            details: { reason }
        })

        return { success: true }
    } catch (error) {
        console.error('[rejectReservation] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Staff: Mark reservation as ready (starts 5-min countdown)
 */
export async function markReservationReady(
    reservationId: string,
    targetUserId?: string
): Promise<{ success: boolean; error?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const user = await getCurrentUser()
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        const response = await fetch(`${url}/rest/v1/reservations?id=eq.${reservationId}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'ready',
                ready_at: new Date().toISOString(),
                ready_by: user.id,
                updated_at: new Date().toISOString()
            })
        })

        if (!response.ok) {
            return { success: false, error: 'ไม่สามารถเปลี่ยนสถานะได้' }
        }

        // Log activity
        await logStaffActivity({
            staffId: user.id,
            staffRole: user.role as 'staff' | 'admin',
            actionType: 'mark_ready',
            targetType: 'reservation',
            targetId: reservationId,
            targetUserId
        })

        return { success: true }
    } catch (error) {
        console.error('[markReservationReady] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}

/**
 * Staff: Convert reservation to loan (complete the reservation)
 */
export async function convertReservationToLoan(
    reservationId: string,
    reservation: Reservation
): Promise<{ success: boolean; error?: string; loanId?: string }> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { success: false, error: 'Missing credentials' }

    const user = await getCurrentUser()
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
        return { success: false, error: 'ไม่มีสิทธิ์ดำเนินการ' }
    }

    const accessToken = await getAccessToken()
    if (!accessToken) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

    try {
        // 1. Create loan request (auto-approved)
        const loanResponse = await fetch(`${url}/rest/v1/loanRequests`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_id: reservation.user_id,
                equipment_id: reservation.equipment_id,
                start_date: reservation.start_date,
                end_date: reservation.end_date,
                status: 'approved'
            })
        })

        if (!loanResponse.ok) {
            return { success: false, error: 'ไม่สามารถสร้างคำขอยืมได้' }
        }

        const loanData = await loanResponse.json()
        const loanId = loanData[0]?.id

        // 2. Update reservation status to completed
        await fetch(`${url}/rest/v1/reservations?id=eq.${reservationId}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed',
                loan_id: loanId,
                completed_at: new Date().toISOString(),
                completed_by: user.id,
                updated_at: new Date().toISOString()
            })
        })

        // 3. Update equipment status to borrowed
        await fetch(`${url}/rest/v1/equipment?id=eq.${reservation.equipment_id}`, {
            method: 'PATCH',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'borrowed'
            })
        })

        // Log activity
        await logStaffActivity({
            staffId: user.id,
            staffRole: user.role as 'staff' | 'admin',
            actionType: 'convert_to_loan',
            targetType: 'reservation',
            targetId: reservationId,
            targetUserId: reservation.user_id,
            isSelfAction: reservation.user_id === user.id,
            details: { loan_id: loanId }
        })

        return { success: true, loanId }
    } catch (error) {
        console.error('[convertReservationToLoan] Error:', error)
        return { success: false, error: 'เกิดข้อผิดพลาด' }
    }
}
