import { z } from 'zod'
import { uuidSchema } from './commonSchema'

/**
 * Notification Schemas
 * ใช้สำหรับ Validate ข้อมูลที่จะส่งแจ้งเตือนผ่าน Discord/System
 */

// Schema สำหรับการแจ้งเตือนการจอง (ใช้แค่ reservationId)
export const notifyReservationSchema = z.object({
    reservationId: uuidSchema,
})

// Schema สำหรับการเพิ่มสถานะ (ใช้ reservationId และสถานะ)
export const notifyReservationStatusSchema = z.object({
    reservationId: uuidSchema,
    status: z.string(),
    byUserId: uuidSchema.optional(),
})

// Schema สำหรับการแจ้งคืนอุปกรณ์
export const notifyReturnSchema = z.object({
    loanId: uuidSchema,
    condition: z.enum(['good', 'damaged', 'lost'], {
        message: 'กรุณาระบุสภาพอุปกรณ์ให้ถูกต้อง',
    }),
    notes: z.string().trim().optional(),
})
