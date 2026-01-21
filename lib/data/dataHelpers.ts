/**
 * Shared Data Management Types and Helpers
 */

import { getSupabaseCredentials } from '../supabase-helpers'

// ============================================
// Types
// ============================================

export type DataType = 'loans' | 'reservations' | 'equipment' | 'notifications'
export type ExportFormat = 'csv' | 'json'

export interface DateRange {
    from: Date
    to: Date
}

export interface PreviewData {
    total: number
    sample: any[]
    columns: string[]
}

// Rate limits
export const RATE_LIMITS = {
    export: { maxRecords: 10000 },
    import: { maxRecords: 100, cooldownMs: 5000 },
    delete: { maxRecords: 50, cooldownMs: 10000 }
}

// ============================================
// Helper Functions
// ============================================

export async function getAccessToken(): Promise<string | null> {
    try {
        const { url, key } = getSupabaseCredentials()
        if (!url || !key) return null

        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(url, key)
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
    } catch {
        return null
    }
}

export function getTableName(dataType: DataType): string {
    switch (dataType) {
        case 'loans': return 'loanRequests'
        case 'reservations': return 'reservations'
        case 'equipment': return 'equipment'
        case 'notifications': return 'notifications'
    }
}

export function getDataTypeLabel(dataType: DataType): string {
    switch (dataType) {
        case 'loans': return 'รายการยืม-คืน'
        case 'reservations': return 'รายการจอง'
        case 'equipment': return 'ข้อมูลอุปกรณ์'
        case 'notifications': return 'การแจ้งเตือน'
    }
}

export function getStatusOptions(dataType: DataType): { value: string; label: string }[] {
    switch (dataType) {
        case 'loans':
            return [
                { value: 'pending', label: 'รอดำเนินการ' },
                { value: 'approved', label: 'อนุมัติแล้ว' },
                { value: 'rejected', label: 'ปฏิเสธ' },
                { value: 'returned', label: 'คืนแล้ว' }
            ]
        case 'reservations':
            return [
                { value: 'pending', label: 'รอดำเนินการ' },
                { value: 'approved', label: 'อนุมัติแล้ว' },
                { value: 'ready', label: 'พร้อมรับ' },
                { value: 'completed', label: 'เสร็จสิ้น' },
                { value: 'cancelled', label: 'ยกเลิก' },
                { value: 'rejected', label: 'ปฏิเสธ' },
                { value: 'expired', label: 'หมดอายุ' }
            ]
        case 'equipment':
            return [
                { value: 'ready', label: 'พร้อมใช้งาน' },
                { value: 'active', label: 'ใช้งานได้' },
                { value: 'borrowed', label: 'ถูกยืม' },
                { value: 'maintenance', label: 'ซ่อมบำรุง' },
                { value: 'retired', label: 'ปลดระวาง' }
            ]
        case 'notifications':
            return [
                { value: 'read', label: 'อ่านแล้ว' },
                { value: 'unread', label: 'ยังไม่อ่าน' }
            ]
    }
}

export function getNotificationTypeOptions(): { value: string; label: string }[] {
    return [
        { value: 'loan_approved', label: 'อนุมัติคำขอยืม' },
        { value: 'loan_rejected', label: 'ปฏิเสธคำขอยืม' },
        { value: 'equipment_due_soon', label: 'ใกล้ถึงกำหนดคืน' },
        { value: 'equipment_overdue', label: 'เลยกำหนดคืน' },
        { value: 'reservation_confirmed', label: 'ยืนยันการจอง' },
        { value: 'reservation_ready', label: 'พร้อมรับอุปกรณ์' },
        { value: 'reservation_approved', label: 'อนุมัติการจอง' },
        { value: 'reservation_rejected', label: 'ปฏิเสธการจอง' }
    ]
}
