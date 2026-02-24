import { z } from 'zod'

/**
 * Common Schemas — ใช้ซ้ำได้ทุกที่
 */

// UUID v4 format
export const uuidSchema = z.string().uuid('รหัสไม่ถูกต้อง (UUID)')

// ISO date string (e.g., "2026-02-24T00:00:00.000Z" or "2026-02-24")
export const isoDateStringSchema = z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'รูปแบบวันที่ไม่ถูกต้อง' }
)

// Time string (HH:mm format)
export const timeStringSchema = z.string().regex(
    /^([01]\d|2[0-3]):([0-5]\d)$/,
    'รูปแบบเวลาไม่ถูกต้อง (ต้องเป็น HH:mm)'
)

// Thai/English name (minimum 2 characters, alphabetic only)
export const thaiEnglishNameSchema = z.string()
    .trim()
    .min(2, 'ต้องมีอย่างน้อย 2 ตัวอักษร')
    .regex(/^[ก-๙a-zA-Z\s]+$/, 'ต้องเป็นตัวอักษรภาษาไทยหรืออังกฤษเท่านั้น')

// Thai phone number (10 digits, starts with 0)
export const thaiPhoneSchema = z.string()
    .transform((val) => val.replace(/[\s-]/g, ''))
    .pipe(
        z.string().regex(
            /^0[0-9]{9}$/,
            'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก และเริ่มต้นด้วย 0 (เช่น 0812345678)'
        )
    )

// Date range validator (ensures end >= start)
export const dateRangeSchema = z.object({
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
}).refine(
    (data) => {
        const start = new Date(data.startDate)
        const end = new Date(data.endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return end >= start
    },
    { message: 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น', path: ['endDate'] }
)

// Not-in-the-past date validator
export const futureDateSchema = isoDateStringSchema.refine(
    (val) => {
        const date = new Date(val)
        const today = new Date()
        date.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        return date >= today
    },
    { message: 'วันที่ต้องไม่เป็นวันที่ผ่านมาแล้ว' }
)
