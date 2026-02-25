import { z } from 'zod'
import { uuidSchema } from './commonSchema'

/**
 * Special Loan Request Schema
 * ใช้ validate ข้อมูลก่อนสร้าง/แก้ไข special_loan_requests
 */

// ─── Create Special Loan ─────────────────────────────────────────────────────

export const createSpecialLoanSchema = z.object({
    // ผู้ยืม (internal หรือ external อย่างน้อยหนึ่งต้องมี)
    borrowerId: uuidSchema.nullable().optional(),
    borrowerName: z.string().trim().min(2, 'ชื่อผู้ยืมต้องมีอย่างน้อย 2 ตัวอักษร').max(200, 'ชื่อยาวเกินไป'),
    borrowerPhone: z.string().trim().max(20).nullable().optional(),

    // ผู้ยืมภายนอก (optional)
    externalBorrowerName: z.string().trim().max(200).nullable().optional(),
    externalBorrowerOrg: z.string().trim().max(200).nullable().optional(),

    // อุปกรณ์
    equipmentTypeId: uuidSchema.nullable().optional(),
    equipmentTypeName: z.string().trim().min(1, 'กรุณาระบุประเภทอุปกรณ์').max(200),
    quantity: z.number().int().min(1, 'จำนวนต้องมากกว่า 0').max(9999, 'จำนวนสูงสุด 9,999 ชิ้น'),
    equipmentIds: z.array(uuidSchema).nullable().optional(),
    equipmentNumbers: z.array(z.string().trim().max(50)).nullable().optional(),

    // วันที่
    loanDate: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'วันที่ยืมไม่ถูกต้อง' }),
    returnDate: z.string().refine((v) => !isNaN(Date.parse(v)), { message: 'วันที่คืนไม่ถูกต้อง' }),

    // รายละเอียด
    purpose: z.string().trim().min(1, 'กรุณาระบุวัตถุประสงค์').max(1000, 'วัตถุประสงค์ยาวเกินไป (สูงสุด 1,000 ตัวอักษร)'),
    notes: z.string().trim().max(2000, 'หมายเหตุยาวเกินไป (สูงสุด 2,000 ตัวอักษร)').nullable().optional(),
}).refine(
    (data) => {
        const loan = new Date(data.loanDate)
        const ret = new Date(data.returnDate)
        loan.setHours(0, 0, 0, 0)
        ret.setHours(0, 0, 0, 0)
        return ret >= loan
    },
    { message: 'วันที่คืนต้องไม่ก่อนวันที่ยืม', path: ['returnDate'] }
)

export type CreateSpecialLoanInput = z.infer<typeof createSpecialLoanSchema>

// ─── Return Special Loan ──────────────────────────────────────────────────────

export const returnSpecialLoanSchema = z.object({
    loanId: uuidSchema,
    returnNotes: z.string().trim().max(2000).nullable().optional(),
})

export type ReturnSpecialLoanInput = z.infer<typeof returnSpecialLoanSchema>
