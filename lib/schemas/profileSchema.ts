import { z } from 'zod'
import { uuidSchema, thaiEnglishNameSchema, thaiPhoneSchema } from './commonSchema'

/**
 * Profile Schemas
 * ใช้สำหรับ Validate ข้อมูลการลงทะเบียนและแก้ไขโปรไฟล์
 */

// Schema สำหรับการลงทะเบียนผู้ใช้ใหม่
export const completeRegistrationSchema = z.object({
    title: z.string().trim().optional(),
    firstName: thaiEnglishNameSchema,
    lastName: thaiEnglishNameSchema,
    phone: thaiPhoneSchema,
    userType: z.string().trim().min(1, 'กรุณาเลือกประเภทผู้ใช้'),
    departmentId: uuidSchema,
})

// Schema สำหรับ Admin แก้ไขโปรไฟล์ผู้ใช้
export const updateUserProfileSchema = z.object({
    userId: uuidSchema,
    firstName: thaiEnglishNameSchema.optional(),
    lastName: thaiEnglishNameSchema.optional(),
    title: z.string().trim().optional(),
    phoneNumber: thaiPhoneSchema.optional(),
    userType: z.string().trim().optional(),
    departmentId: uuidSchema.nullable().optional(),
})

// Schema สำหรับเปลี่ยนสถานะผู้ใช้
export const updateUserStatusSchema = z.object({
    userId: uuidSchema,
    newStatus: z.enum(['approved', 'rejected', 'pending'], {
        message: 'สถานะไม่ถูกต้อง',
    }),
})

// Schema สำหรับเปลี่ยนบทบาทผู้ใช้
export const updateUserRoleSchema = z.object({
    userId: uuidSchema,
    newRole: z.enum(['admin', 'staff', 'user'], {
        message: 'บทบาทไม่ถูกต้อง',
    }),
})

// Schema สำหรับเปลี่ยนสถานะผู้ใช้หลายคน
export const bulkUpdateUserStatusSchema = z.object({
    userIds: z.array(uuidSchema).min(1, 'กรุณาเลือกผู้ใช้อย่างน้อย 1 คน'),
    newStatus: z.enum(['approved', 'rejected', 'pending'], {
        message: 'สถานะไม่ถูกต้อง',
    }),
})

// Helper: ดึงข้อมูลจาก FormData สำหรับ Registration
export function parseRegistrationFormData(formData: FormData) {
    const raw = {
        title: formData.get('title') as string,
        firstName: formData.get('first-name') as string,
        lastName: formData.get('last-name') as string,
        phone: formData.get('phone') as string,
        userType: formData.get('user-type') as string,
        departmentId: formData.get('department') as string,
    }
    return completeRegistrationSchema.safeParse(raw)
}
