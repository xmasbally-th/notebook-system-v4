import { z } from 'zod'
import { uuidSchema } from './commonSchema'

/**
 * Equipment Schemas
 * ใช้สำหรับ Validate ข้อมูลอุปกรณ์และสถานะ
 */

// สถานะอุปกรณ์ที่ระบบรองรับ
export const equipmentStatusEnum = z.enum([
    'available',
    'borrowed',
    'reserved',
    'maintenance',
    'retired',
], { message: 'สถานะอุปกรณ์ไม่ถูกต้อง' })

// Schema สำหรับอัปเดตสถานะอุปกรณ์
export const updateEquipmentStatusSchema = z.object({
    equipmentId: uuidSchema,
    status: equipmentStatusEnum,
})

// Schema สำหรับค้นหาอุปกรณ์
export const searchEquipmentSchema = z.object({
    query: z.string().trim().max(200, 'คำค้นหายาวเกินไป').optional(),
    categoryId: uuidSchema.optional(),
    typeId: uuidSchema.optional(),
    status: equipmentStatusEnum.optional(),
})
