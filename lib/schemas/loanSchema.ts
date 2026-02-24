import { z } from 'zod'
import { uuidSchema, isoDateStringSchema, timeStringSchema } from './commonSchema'

/**
 * Loan Schemas
 * ใช้สำหรับ Validate ข้อมูลคำขอยืมอุปกรณ์
 */

// Schema สำหรับสร้างคำขอยืมใหม่
export const submitLoanSchema = z.object({
    equipmentId: uuidSchema,
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    returnTime: timeStringSchema.nullable().optional(),
}).refine(
    (data) => {
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return end >= start
    },
    { message: 'วันที่คืนต้องไม่ก่อนวันที่ยืม', path: ['endDate'] }
).refine(
    (data) => {
        const start = new Date(data.startDate)
        const today = new Date()
        start.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        return start >= today
    },
    { message: 'วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว', path: ['startDate'] }
)

// Schema สำหรับ approve/reject loan (ใช้ loanId เท่านั้น)
export const loanActionSchema = z.object({
    loanId: uuidSchema,
})

// Schema สำหรับ reject loan (ต้องมีเหตุผล)
export const rejectLoanSchema = z.object({
    loanId: uuidSchema,
    reason: z.string()
        .trim()
        .min(1, 'กรุณาระบุเหตุผลในการปฏิเสธ')
        .max(500, 'เหตุผลยาวเกินไป (สูงสุด 500 ตัวอักษร)'),
})

// Schema สำหรับ bulk actions
export const bulkLoanActionSchema = z.object({
    loanIds: z.array(uuidSchema).min(1, 'กรุณาเลือกอย่างน้อย 1 รายการ'),
})

export const bulkRejectLoanSchema = z.object({
    loanIds: z.array(uuidSchema).min(1, 'กรุณาเลือกอย่างน้อย 1 รายการ'),
    reason: z.string()
        .trim()
        .min(1, 'กรุณาระบุเหตุผลในการปฏิเสธ')
        .max(500, 'เหตุผลยาวเกินไป (สูงสุด 500 ตัวอักษร)'),
})

// Helper: ดึงข้อมูลจาก FormData แล้ว Parse ผ่าน submitLoanSchema
export function parseLoanFormData(formData: FormData) {
    const raw = {
        equipmentId: formData.get('equipmentId') as string,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        returnTime: formData.get('returnTime') as string | null,
    }
    return submitLoanSchema.safeParse(raw)
}
