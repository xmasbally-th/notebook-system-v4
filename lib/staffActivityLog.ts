// Staff Activity Log - Library functions
import { getSupabaseCredentials } from './supabase-helpers'

export type ActionType =
    | 'approve_loan'
    | 'reject_loan'
    | 'mark_returned'
    | 'approve_reservation'
    | 'reject_reservation'
    | 'mark_ready'
    | 'convert_to_loan'
    | 'cancel_reservation'
    | 'self_borrow'
    | 'self_reserve'

export interface ActivityLogEntry {
    staffId: string
    staffRole: 'staff' | 'admin'
    actionType: ActionType
    targetType: 'loan' | 'reservation'
    targetId: string
    targetUserId?: string
    isSelfAction?: boolean
    details?: Record<string, any>
}

// Get user's access token for authenticated requests
async function getAccessToken(): Promise<string | null> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return null

    const { createBrowserClient } = await import('@supabase/ssr')
    const client = createBrowserClient(url, key)
    const { data: { session } } = await client.auth.getSession()
    return session?.access_token || null
}

/**
 * Log a staff activity
 */
export async function logStaffActivity(entry: ActivityLogEntry): Promise<boolean> {
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) {
        console.error('[logStaffActivity] Missing Supabase credentials')
        return false
    }

    const accessToken = await getAccessToken()
    if (!accessToken) {
        console.error('[logStaffActivity] No access token')
        return false
    }

    try {
        const response = await fetch(`${url}/rest/v1/staff_activity_log`, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                staff_id: entry.staffId,
                staff_role: entry.staffRole,
                action_type: entry.actionType,
                target_type: entry.targetType,
                target_id: entry.targetId,
                target_user_id: entry.targetUserId || null,
                is_self_action: entry.isSelfAction || false,
                details: entry.details || {}
            })
        })

        if (!response.ok) {
            console.error('[logStaffActivity] HTTP Error:', response.status)
            return false
        }

        return true
    } catch (error) {
        console.error('[logStaffActivity] Error:', error)
        return false
    }
}

/**
 * Get action type label for display
 */
export function getActionTypeLabel(actionType: ActionType): string {
    const labels: Record<ActionType, string> = {
        'approve_loan': 'อนุมัติคำขอยืม',
        'reject_loan': 'ปฏิเสธคำขอยืม',
        'mark_returned': 'บันทึกการคืน',
        'approve_reservation': 'อนุมัติการจอง',
        'reject_reservation': 'ปฏิเสธการจอง',
        'mark_ready': 'กดพร้อมรับ',
        'convert_to_loan': 'แปลงเป็นคำขอยืม',
        'cancel_reservation': 'ยกเลิกการจอง',
        'self_borrow': 'ยืมด้วยตัวเอง',
        'self_reserve': 'จองด้วยตัวเอง'
    }
    return labels[actionType] || actionType
}

/**
 * Get action type icon for display
 */
export function getActionTypeIcon(actionType: ActionType): string {
    const icons: Record<ActionType, string> = {
        'approve_loan': '✅',
        'reject_loan': '❌',
        'mark_returned': '📦',
        'approve_reservation': '✅',
        'reject_reservation': '❌',
        'mark_ready': '🔔',
        'convert_to_loan': '🔄',
        'cancel_reservation': '🚫',
        'self_borrow': '👤',
        'self_reserve': '👤'
    }
    return icons[actionType] || '📝'
}
