/**
 * Booking Validator — Domain Logic Layer
 * 
 * ฟังก์ชันรวมศูนย์สำหรับตรวจสอบความถูกต้องของการจอง/ยืมอุปกรณ์
 * ใช้จากทั้ง Server Actions และ Client-side API
 * 
 * จุดประสงค์: ลด Logic ซ้ำซ้อนที่กระจายอยู่ในหลายไฟล์
 */

import { checkTimeConflict, checkTypeConflict } from '@/lib/reservations'

// ===== Types =====

export type BookingType = 'loan' | 'reservation'

export interface BookingValidationInput {
    userId: string
    equipmentId: string
    startDate: Date
    endDate: Date
    bookingType: BookingType
    /** ระบุเมื่อต้องการ exclude การจองตัวเองจากการตรวจสอบ */
    excludeReservationId?: string
}

export interface BookingValidationResult {
    valid: boolean
    error?: string
    errorCode?: 'DATE_PAST' | 'DATE_RANGE' | 'TYPE_CONFLICT' | 'TIME_CONFLICT' | 'DURATION_EXCEEDED' | 'MAX_ITEMS_EXCEEDED'
}

export interface LoanLimitConfig {
    max_days: number
    max_items: number
    type_limits?: Record<string, number>
}

// ===== Core Validation Functions =====

/**
 * ตรวจสอบวันที่ว่าอยู่ในอดีตหรือไม่
 */
export function validateDateNotInPast(date: Date): BookingValidationResult {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    if (checkDate < today) {
        return { valid: false, error: 'วันที่ต้องไม่เป็นวันที่ผ่านมาแล้ว', errorCode: 'DATE_PAST' }
    }
    return { valid: true }
}

/**
 * ตรวจสอบช่วงวันที่ว่าถูกต้องหรือไม่ (end >= start)
 */
export function validateDateRange(startDate: Date, endDate: Date): BookingValidationResult {
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    if (end < start) {
        return { valid: false, error: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น', errorCode: 'DATE_RANGE' }
    }
    return { valid: true }
}

/**
 * ตรวจสอบจำนวนวันยืมว่าเกินกำหนดหรือไม่
 */
export function validateDuration(startDate: Date, endDate: Date, maxDays: number): BookingValidationResult {
    const durationMs = endDate.getTime() - startDate.getTime()
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1

    if (durationDays > maxDays) {
        return {
            valid: false,
            error: `ระยะเวลายืมเกินกำหนดสูงสุด (สูงสุด ${maxDays} วัน)`,
            errorCode: 'DURATION_EXCEEDED'
        }
    }
    return { valid: true }
}

/**
 * คำนวณจำนวนวันยืม
 */
export function calculateDurationDays(startDate: Date, endDate: Date): number {
    const durationMs = endDate.getTime() - startDate.getTime()
    return Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1
}

// ===== Composite Validation =====

/**
 * ตรวจสอบการจอง/ยืมแบบครบวงจร
 * 
 * รวมการเช็คทั้งหมดไว้ในฟังก์ชันเดียว:
 * 1. วันที่ไม่อยู่ในอดีต
 * 2. ช่วงวันที่ถูกต้อง
 * 3. ไม่ซ้ำประเภทอุปกรณ์ (Type Conflict)
 * 4. ไม่ซ้อนเวลากับการจอง/ยืมอื่น (Time Conflict)
 */
export async function validateBooking(input: BookingValidationInput): Promise<BookingValidationResult> {
    const { userId, equipmentId, startDate, endDate, excludeReservationId } = input

    // 1. Date not in past
    const pastCheck = validateDateNotInPast(startDate)
    if (!pastCheck.valid) return pastCheck

    // 2. Date range valid
    const rangeCheck = validateDateRange(startDate, endDate)
    if (!rangeCheck.valid) return rangeCheck

    // 3. Type conflict (same equipment type already borrowed/reserved)
    try {
        const typeConflict = await checkTypeConflict(userId, equipmentId)
        if (typeConflict.hasConflict) {
            return {
                valid: false,
                error: 'คุณมีการจองหรือยืมอุปกรณ์ประเภทนี้อยู่แล้ว',
                errorCode: 'TYPE_CONFLICT'
            }
        }
    } catch (e) {
        console.warn('[validateBooking] Type conflict check skipped')
    }

    // 4. Time conflict (overlapping dates with other bookings)
    const timeConflict = await checkTimeConflict(equipmentId, startDate, endDate, excludeReservationId)
    if (timeConflict) {
        return {
            valid: false,
            error: 'ช่วงเวลาที่เลือกมีการจองหรือยืมอยู่แล้ว',
            errorCode: 'TIME_CONFLICT'
        }
    }

    return { valid: true }
}

/**
 * ตรวจสอบสถานะว่ามีสิทธิ์ดำเนินการหรือไม่ (ใช้สำหรับ Staff/Admin actions)
 */
export function isStaffOrAdmin(role: string): boolean {
    return role === 'staff' || role === 'admin'
}

/**
 * กำหนดสถานะเริ่มต้นของการจอง/ยืม (Auto-approve สำหรับ Staff/Admin)
 */
export function getInitialStatus(role: string): 'pending' | 'approved' {
    return isStaffOrAdmin(role) ? 'approved' : 'pending'
}
