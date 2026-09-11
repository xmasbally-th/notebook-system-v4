import crypto from 'crypto'

const TOKEN_EXPIRY_MS = 20 * 60 * 1000 // 20 minutes
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'notebook-system-counter-secret-key'

export interface CounterTokenPayload {
    timestamp: number
    type: 'counter' | 'equipment'
    equipmentId?: string
}

/**
 * สร้าง Token สำหรับยืนยันการอยู่หน้าเคาน์เตอร์
 */
export function generateCounterToken(equipmentId?: string): string {
    const timestamp = Date.now()
    const type = equipmentId ? 'equipment' : 'counter'
    const rawData = equipmentId ? `${type}:${equipmentId}:${timestamp}` : `${type}:${timestamp}`
    const hmac = crypto.createHmac('sha256', SECRET).update(rawData).digest('hex').substring(0, 16)
    
    // Format: type_equipmentId_timestamp_hmac or type_timestamp_hmac
    if (equipmentId) {
        return `eq_${equipmentId}_${timestamp}_${hmac}`
    }
    return `cnt_${timestamp}_${hmac}`
}

/**
 * ตรวจสอบความถูกต้องและอายุของ Counter Token
 */
export function verifyCounterToken(token: string): { valid: boolean; error?: string; equipmentId?: string } {
    if (!token || typeof token !== 'string') {
        return { valid: false, error: 'ไม่พบรหัสยืนยันการสแกนเคาน์เตอร์' }
    }

    try {
        const parts = token.split('_')
        if (parts.length < 3) {
            return { valid: false, error: 'รูปแบบรหัสยืนยันไม่ถูกต้อง' }
        }

        const prefix = parts[0]
        if (prefix === 'cnt') {
            // cnt_timestamp_hmac
            const timestamp = parseInt(parts[1], 10)
            const signature = parts[2]

            if (isNaN(timestamp)) {
                return { valid: false, error: 'เวลาในรหัสยืนยันไม่ถูกต้อง' }
            }

            // Check expiration (20 mins)
            if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
                return { valid: false, error: 'รหัสยืนยันหน้าเคาน์เตอร์หมดอายุแล้ว (เกิน 20 นาที) กรุณาสแกนใหม่อีกครั้ง' }
            }

            // Check signature
            const rawData = `counter:${timestamp}`
            const expectedHmac = crypto.createHmac('sha256', SECRET).update(rawData).digest('hex').substring(0, 16)
            if (signature !== expectedHmac) {
                return { valid: false, error: 'รหัสยืนยันไม่ถูกต้อง' }
            }

            return { valid: true }
        } else if (prefix === 'eq') {
            // eq_equipmentId_timestamp_hmac
            const equipmentId = parts[1]
            const timestamp = parseInt(parts[2], 10)
            const signature = parts[3]

            if (isNaN(timestamp)) {
                return { valid: false, error: 'เวลาในรหัสยืนยันไม่ถูกต้อง' }
            }

            if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
                return { valid: false, error: 'รหัสยืนยันสแกนอุปกรณ์หมดอายุแล้ว กรุณาสแกนใหม่' }
            }

            const rawData = `equipment:${equipmentId}:${timestamp}`
            const expectedHmac = crypto.createHmac('sha256', SECRET).update(rawData).digest('hex').substring(0, 16)
            if (signature !== expectedHmac) {
                return { valid: false, error: 'รหัสยืนยันอุปกรณ์ไม่ถูกต้อง' }
            }

            return { valid: true, equipmentId }
        }

        return { valid: false, error: 'ประเภทของรหัสยืนยันไม่ถูกต้อง' }
    } catch (err: any) {
        return { valid: false, error: `เกิดข้อผิดพลาดในการตรวจสอบรหัส: ${err?.message}` }
    }
}
