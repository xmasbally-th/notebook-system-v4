import { z } from 'zod'
import { uuidSchema, isoDateStringSchema, timeStringSchema } from './commonSchema'

/**
 * Reservation Schemas
 * ใช้สำหรับ Validate ข้อมูลการจองอุปกรณ์
 */

// Schema สำหรับสร้างคำขอจองใหม่
export const submitReservationSchema = z.object({
    equipmentId: uuidSchema,
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    pickupTime: timeStringSchema.nullable().optional(),
    returnTime: timeStringSchema.nullable().optional(),
}).refine(
    (data) => {
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return end >= start
    },
    { message: 'วันที่คืนต้องไม่ก่อนวันที่รับ', path: ['endDate'] }
).refine(
    (data) => {
        const start = new Date(data.startDate)
        const today = new Date()
        start.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        return start >= today
    },
    { message: 'วันที่รับต้องไม่เป็นวันที่ผ่านมาแล้ว', path: ['startDate'] }
)

// Schema สำหรับแปลงการจองเป็นการยืม
export const convertReservationSchema = z.object({
    reservationId: uuidSchema,
})

// Schema สำหรับอนุมัติการจอง
export const approveReservationSchema = z.object({
    reservationId: uuidSchema,
})

// Schema สำหรับปฏิเสธการจอง
export const rejectReservationSchema = z.object({
    reservationId: uuidSchema,
    reason: z.string().trim().min(1, 'กรุณาระบุเหตุผลในการปฏิเสธ'),
})

// Schema สำหรับเปลี่ยนสถานะเป็นพร้อมรับ
export const markReadyReservationSchema = z.object({
    reservationId: uuidSchema,
})

// Schema สำหรับผู้ดูแลระบบแก้ไขการจอง
export const adminUpdateReservationSchema = z.object({
    reservationId: uuidSchema,
    startDate: isoDateStringSchema.optional(),
    endDate: isoDateStringSchema.optional(),
    pickupTime: timeStringSchema.nullable().optional(),
    returnTime: timeStringSchema.nullable().optional(),
    status: z.enum(['pending', 'approved', 'ready', 'completed', 'rejected', 'cancelled', 'expired']).optional(),
    rejectionReason: z.string().trim().nullable().optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate)
            const end = new Date(data.endDate)
            start.setHours(0, 0, 0, 0)
            end.setHours(0, 0, 0, 0)
            return end >= start
        }
        return true
    },
    { message: 'วันที่คืนต้องไม่ก่อนวันที่รับ', path: ['endDate'] }
)

// Schema สำหรับผู้ดูแลระบบยกเลิกการจอง
export const adminForceCancelReservationSchema = z.object({
    reservationId: uuidSchema,
    reason: z.string().trim().optional(),
})

// Schema สำหรับผู้ดูแลระบบลบการจองถาวร
export const adminDeleteReservationSchema = z.object({
    reservationId: uuidSchema,
})

// Schema สำหรับ Query รายการจอง
export const getReservationsQuerySchema = z.object({
    status: z.enum(['all', 'pending', 'approved', 'ready', 'completed', 'rejected', 'cancelled', 'expired']).optional().default('all'),
    search: z.string().trim().optional().default(''),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(1).max(100).optional().default(10),
})

// Helper: ดึงข้อมูลจาก FormData แล้ว Parse ผ่าน submitReservationSchema
export function parseReservationFormData(formData: FormData) {
    const raw = {
        equipmentId: formData.get('equipmentId') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        pickupTime: formData.get('pickupTime') as string | null,
        returnTime: formData.get('returnTime') as string | null,
    }
    return submitReservationSchema.safeParse(raw)
}

