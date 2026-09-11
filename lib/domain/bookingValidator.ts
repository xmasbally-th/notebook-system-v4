/**
 * Booking Validator — Domain Logic Layer
 * 
 * ฟังก์ชันรวมศูนย์สำหรับตรวจสอบความถูกต้องของการจอง/ยืมอุปกรณ์
 * ใช้จากทั้ง Server Actions และ Client-side API
 * 
 * จุดประสงค์: ลด Logic ซ้ำซ้อนที่กระจายอยู่ในหลายไฟล์
 */

import { checkTimeConflict, checkTypeConflict } from '@/lib/reservations'
import { formatThaiDate, formatThaiTime } from '@/lib/formatThaiDate'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'

// ===== Types =====

export type BookingType = 'loan' | 'reservation'
export type ConflictRole = 'user' | 'staff' | 'admin'

export interface RoleConflictMessages {
    user: string
    staff: string
    admin: string
}

export interface BookingValidationInput {
    userId: string
    equipmentId: string
    startDate: Date
    endDate: Date
    bookingType: BookingType
    /** ระบุเมื่อต้องการ exclude การจองตัวเองจากการตรวจสอบ */
    excludeReservationId?: string
    /** ระบุเมื่อต้องการ exclude การยืมตัวเองจากการตรวจสอบ */
    excludeLoanId?: string
    /** สถานะ/บทบาทของผู้ตรวจสอบ (user, staff, admin) เพื่อปรับระดับข้อมูลและข้อความแจ้งเตือน */
    userRole?: ConflictRole
}

export interface BookingConflictInfo {
    hasConflict: boolean
    conflictType?: 'reservation' | 'loan' | 'special_loan'
    conflictId?: string
    status?: string
    statusLabel?: string
    holder?: {
        id: string
        name: string
        department: string
        phone: string
        email: string
    }
    equipment?: {
        id: string
        name: string
        equipmentNumber: string
    }
    timeSlot?: {
        startDate: string
        endDate: string
        pickupTime?: string | null
        returnTime?: string | null
    }
    formattedMessage?: string
    messagesByRole?: RoleConflictMessages
}

export interface BookingValidationResult {
    valid: boolean
    error?: string
    errorCode?: 'DATE_PAST' | 'DATE_RANGE' | 'TYPE_CONFLICT' | 'TIME_CONFLICT' | 'DURATION_EXCEEDED' | 'MAX_ITEMS_EXCEEDED'
    conflictInfo?: BookingConflictInfo
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
    if (endDate.getTime() < startDate.getTime()) {
        return { valid: false, error: 'วันที่และเวลาสิ้นสุดต้องไม่ก่อนวันที่และเวลาเริ่มต้น', errorCode: 'DATE_RANGE' }
    }
    return { valid: true }
}

/**
 * ตรวจสอบจำนวนวันยืมว่าเกินกำหนดหรือไม่
 */
export function validateDuration(startDate: Date, endDate: Date, maxDays: number): BookingValidationResult {
    const durationDays = calculateDurationDays(startDate, endDate)

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
 * คำนวณจำนวนวันยืม (ปัดเศษตามวันปฏิทิน)
 */
export function calculateDurationDays(startDate: Date, endDate: Date): number {
    const sDate = new Date(startDate)
    const eDate = new Date(endDate)
    sDate.setHours(0, 0, 0, 0)
    eDate.setHours(0, 0, 0, 0)
    const durationMs = eDate.getTime() - sDate.getTime()
    return Math.round(durationMs / (1000 * 60 * 60 * 24)) + 1
}

// ===== Composite Validation =====

// Helper formatters for User/Staff/Admin conflict messages
function buildReservationConflictMessages({
    equipName,
    equipNumber,
    equipmentId,
    fullName,
    deptName,
    phone,
    email,
    dateRangeText,
    statusLabel,
    userId,
    reservationId
}: {
    equipName: string
    equipNumber: string
    equipmentId: string
    fullName: string
    deptName: string
    phone: string
    email: string
    dateRangeText: string
    statusLabel: string
    userId: string
    reservationId: string
}): RoleConflictMessages {
    return {
        user: `⚠️ ไม่สามารถดำเนินการได้: อุปกรณ์นี้มีคิวจองล่วงหน้าอยู่แล้ว\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber})\n` +
            `• ช่วงเวลาที่ติดคิวจอง: ${dateRangeText}\n` +
            `• สถานะคิว: ${statusLabel}\n\n` +
            `💡 คำแนะนำ: กรุณาเลือกอุปกรณ์เครื่องอื่นที่ยังว่าง หรือปรับเปลี่ยนช่วงวันและเวลาการใช้งาน`,

        staff: `⚠️ [สำหรับเจ้าหน้าที่] ตรวจพบคิวการจองล่วงหน้าทับซ้อน\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber})\n` +
            `• ผู้จองไว้เดิม: คุณ${fullName} (${deptName})\n` +
            `• ข้อมูลติดต่อ: โทร ${phone} | อีเมล: ${email}\n` +
            `• ช่วงเวลาที่จอง: ${dateRangeText}\n` +
            `• สถานะคิว: ${statusLabel}\n\n` +
            `💡 คำแนะนำ: กรุณาโทรติดต่อประสานงานกับผู้จองตามเบอร์ด้านบน หรือแนะนำอุปกรณ์อื่นที่พร้อมใช้งาน (Ready) ให้ผู้ใช้บริการหน้าเคาน์เตอร์`,

        admin: `⚠️ [Admin Alert] ตรวจพบ Conflict รายการจองอุปกรณ์ในระบบ\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber}) [ID: ${equipmentId}]\n` +
            `• ผู้ถือสิทธิ์คิวเดิม: คุณ${fullName} (User ID: ${userId}, ${deptName})\n` +
            `• ข้อมูลติดต่อ: โทร ${phone} | อีเมล: ${email}\n` +
            `• รหัสการจอง: ${reservationId} (สถานะ: ${statusLabel})\n` +
            `• ช่วงเวลาที่จอง: ${dateRangeText}\n\n` +
            `💡 การจัดการ: ผู้ดูแลระบบสามารถตรวจสอบ แก้ไขวันเวลา สลับเครื่อง หรือบังคับยกเลิกคิว (Force Cancel) ได้ที่หน้ารายการจอง`
    }
}

function buildLoanConflictMessages({
    equipName,
    equipNumber,
    equipmentId,
    fullName,
    deptName,
    phone,
    email,
    dateRangeText,
    statusLabel,
    userId,
    loanId
}: {
    equipName: string
    equipNumber: string
    equipmentId: string
    fullName: string
    deptName: string
    phone: string
    email: string
    dateRangeText: string
    statusLabel: string
    userId: string
    loanId: string
}): RoleConflictMessages {
    return {
        user: `⚠️ ไม่สามารถดำเนินการได้: อุปกรณ์นี้อยู่ระหว่างการยืมใช้งาน\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber})\n` +
            `• กำหนดการส่งคืน: จนถึง ${dateRangeText}\n` +
            `• สถานะ: อยู่ระหว่างการยืมใช้งาน\n\n` +
            `💡 คำแนะนำ: กรุณาเลือกอุปกรณ์เครื่องอื่นที่ยังว่าง หรือรอให้อุปกรณ์ถูกส่งคืนเข้าระบบก่อนทำรายการ`,

        staff: `⚠️ [สำหรับเจ้าหน้าที่] อุปกรณ์นี้กำลังถูกยืมใช้งานอยู่ (Active Loan)\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber})\n` +
            `• ผู้ยืมขณะนี้: คุณ${fullName} (${deptName})\n` +
            `• ข้อมูลติดต่อ: โทร ${phone} | อีเมล: ${email}\n` +
            `• กำหนดส่งคืน: ${dateRangeText}\n` +
            `• สถานะสัญญา: ${statusLabel}\n\n` +
            `💡 คำแนะนำ: ไม่สามารถเปิดยืมหรืออนุมัติซ้ำซ้อนได้จนกว่าจะมีการทำรายการรับคืนอุปกรณ์ (Mark Returned) กรุณาเสนอเครื่องอื่นที่ว่างให้ผู้ใช้`,

        admin: `⚠️ [Admin Alert] ตรวจพบ Conflict สัญญาการยืมกำลังใช้งาน (Active Loan)\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber}) [ID: ${equipmentId}]\n` +
            `• ผู้ยืมปัจจุบัน: คุณ${fullName} (User ID: ${userId}, ${deptName})\n` +
            `• ข้อมูลติดต่อ: โทร ${phone} | อีเมล: ${email}\n` +
            `• รหัสสัญญาการยืม: ${loanId} (สถานะ: ${statusLabel})\n` +
            `• กำหนดการยืม-คืน: ${dateRangeText}\n\n` +
            `💡 การจัดการ: ผู้ดูแลระบบสามารถตรวจสอบสัญญา หรือประสานงานติดตามการส่งคืนอุปกรณ์ได้ที่หน้าจัดการการยืม`
    }
}

function buildSpecialLoanConflictMessages({
    equipName,
    equipNumber,
    equipmentId,
    projectName,
    borrowerName,
    loanDate,
    returnDate,
    specialLoanId
}: {
    equipName: string
    equipNumber: string
    equipmentId: string
    projectName: string
    borrowerName: string
    loanDate: string
    returnDate: string
    specialLoanId: string
}): RoleConflictMessages {
    const rangeText = `${formatThaiDate(loanDate)} - ${formatThaiDate(returnDate)}`
    return {
        user: `⚠️ ไม่สามารถดำเนินการได้: อุปกรณ์นี้ติดกำหนดการใช้งานในโครงการ/กิจกรรมองค์กร\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber})\n` +
            `• โครงการ: ${projectName}\n` +
            `• ช่วงเวลา: ${rangeText}\n\n` +
            `💡 คำแนะนำ: กรุณาเลือกอุปกรณ์เครื่องอื่นที่ยังว่าง`,

        staff: `⚠️ [สำหรับเจ้าหน้าที่] อุปกรณ์นี้ผูกกับสัญญายืมพิเศษสำหรับโครงการ\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber})\n` +
            `• โครงการ: ${projectName}\n` +
            `• ผู้ประสานงาน: ${borrowerName}\n` +
            `• ช่วงเวลา: ${rangeText}\n\n` +
            `💡 คำแนะนำ: ตรวจสอบรายละเอียดสัญญายืมพิเศษกับผู้ดูแลระบบก่อนดำเนินการ`,

        admin: `⚠️ [Admin Alert] ตรวจพบ Conflict กับสัญญายืมพิเศษ (Special Loan ID: ${specialLoanId})\n` +
            `• อุปกรณ์: ${equipName} (${equipNumber}) [ID: ${equipmentId}]\n` +
            `• โครงการ: ${projectName}\n` +
            `• ผู้รับผิดชอบ/ประสานงาน: ${borrowerName}\n` +
            `• ช่วงเวลา: ${rangeText}\n\n` +
            `💡 การจัดการ: ผู้ดูแลระบบสามารถตรวจสอบหรือแก้ไขรายการยืมพิเศษได้ที่หน้าจัดการสัญญายืมพิเศษ`
    }
}

/**
 * ดึงรายละเอียดเชิงลึกของการจอง/การยืมที่เกิดการทับซ้อนเวลา (Conflict Resolution)
 * เพื่อใช้แจ้งเตือนผู้ใช้และเจ้าหน้าที่อย่างละเอียดว่าใครจองไว้ ช่วงเวลาใด
 */
export async function getBookingConflictDetails(
    input: BookingValidationInput
): Promise<BookingConflictInfo> {
    const { equipmentId, startDate, endDate, excludeReservationId, excludeLoanId, userRole = 'user' } = input
    const { url, key } = getSupabaseCredentials()
    if (!url || !key) return { hasConflict: false }

    const authHeader = {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }

    try {
        const startTarget = startDate.getTime()
        const endTarget = endDate.getTime()

        // 1. ตรวจสอบตารางการจอง (reservations)
        let resUrl = `${url}/rest/v1/reservations?equipment_id=eq.${equipmentId}&status=in.(pending,approved,ready)&select=id,user_id,start_date,end_date,pickup_time,return_time,status`
        if (excludeReservationId) {
            resUrl += `&id=neq.${excludeReservationId}`
        }
        const resResponse = await fetch(resUrl, { headers: authHeader })
        if (resResponse.ok) {
            const reservations = await resResponse.json()
            for (const r of reservations) {
                const rStartDay = r.start_date.split('T')[0]
                const rEndDay = r.end_date.split('T')[0]
                const rPickup = r.pickup_time ? r.pickup_time.slice(0, 5) : '08:00'
                const rReturn = r.return_time ? r.return_time.slice(0, 5) : '17:00'
                const rStart = new Date(`${rStartDay}T${rPickup}:00+07:00`).getTime()
                const rEnd = new Date(`${rEndDay}T${rReturn}:00+07:00`).getTime()

                if (startTarget < rEnd && endTarget > rStart) {
                    // พบการจองที่ทับซ้อน -> ดึงข้อมูลผู้จองและอุปกรณ์
                    const [profileRes, equipRes] = await Promise.all([
                        fetch(`${url}/rest/v1/profiles?id=eq.${r.user_id}&select=id,first_name,last_name,phone_number,email,departments(name)`, { headers: authHeader }),
                        fetch(`${url}/rest/v1/equipment?id=eq.${equipmentId}&select=id,name,equipment_number`, { headers: authHeader })
                    ])
                    const profileData = profileRes.ok ? await profileRes.json() : []
                    const equipData = equipRes.ok ? await equipRes.json() : []

                    const profile = profileData[0]
                    const equip = equipData[0]
                    const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'ผู้ใช้งานในระบบ'
                    const deptName = Array.isArray(profile?.departments) ? profile.departments[0]?.name : profile?.departments?.name || '-'
                    const phone = profile?.phone_number || '-'
                    const email = profile?.email || '-'
                    const equipName = equip?.name || 'อุปกรณ์'
                    const equipNumber = equip?.equipment_number ? `#${equip.equipment_number}` : ''

                    const statusLabels: Record<string, string> = {
                        pending: 'รออนุมัติ',
                        approved: 'อนุมัติแล้ว (รอรับอุปกรณ์)',
                        ready: 'พร้อมรับอุปกรณ์'
                    }
                    const statusLabel = statusLabels[r.status] || r.status

                    const timePickup = r.pickup_time ? ` เวลา ${r.pickup_time.slice(0, 5)} น.` : ''
                    const timeReturn = r.return_time ? ` เวลา ${r.return_time.slice(0, 5)} น.` : ''
                    const dateRangeText = `${formatThaiDate(r.start_date)}${timePickup} - ${formatThaiDate(r.end_date)}${timeReturn}`

                    const messagesByRole = buildReservationConflictMessages({
                        equipName,
                        equipNumber,
                        equipmentId,
                        fullName,
                        deptName,
                        phone,
                        email,
                        dateRangeText,
                        statusLabel,
                        userId: r.user_id,
                        reservationId: r.id
                    })

                    return {
                        hasConflict: true,
                        conflictType: 'reservation',
                        conflictId: r.id,
                        status: r.status,
                        statusLabel,
                        holder: {
                            id: r.user_id,
                            name: fullName,
                            department: deptName,
                            phone,
                            email
                        },
                        equipment: {
                            id: equipmentId,
                            name: equipName,
                            equipmentNumber: equip?.equipment_number || '-'
                        },
                        timeSlot: {
                            startDate: r.start_date,
                            endDate: r.end_date,
                            pickupTime: r.pickup_time,
                            returnTime: r.return_time
                        },
                        messagesByRole,
                        formattedMessage: messagesByRole[userRole]
                    }
                }
            }
        }

        // 2. ตรวจสอบตารางการยืม (loanRequests)
        let loanUrl = `${url}/rest/v1/loanRequests?equipment_id=eq.${equipmentId}&status=in.(pending,approved)&select=id,user_id,start_date,end_date,return_time,status`
        if (excludeLoanId) {
            loanUrl += `&id=neq.${excludeLoanId}`
        }
        const loanResponse = await fetch(loanUrl, { headers: authHeader })
        if (loanResponse.ok) {
            const loans = await loanResponse.json()
            for (const l of loans) {
                const lStart = new Date(l.start_date).getTime()
                const lEndDay = l.end_date.split('T')[0]
                const lReturn = l.return_time ? l.return_time.slice(0, 5) : '17:00'
                const lEnd = new Date(`${lEndDay}T${lReturn}:00+07:00`).getTime()

                if (startTarget < lEnd && endTarget > lStart) {
                    const [profileRes, equipRes] = await Promise.all([
                        fetch(`${url}/rest/v1/profiles?id=eq.${l.user_id}&select=id,first_name,last_name,phone_number,email,departments(name)`, { headers: authHeader }),
                        fetch(`${url}/rest/v1/equipment?id=eq.${equipmentId}&select=id,name,equipment_number`, { headers: authHeader })
                    ])
                    const profileData = profileRes.ok ? await profileRes.json() : []
                    const equipData = equipRes.ok ? await equipRes.json() : []

                    const profile = profileData[0]
                    const equip = equipData[0]
                    const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'ผู้ใช้งานในระบบ'
                    const deptName = Array.isArray(profile?.departments) ? profile.departments[0]?.name : profile?.departments?.name || '-'
                    const phone = profile?.phone_number || '-'
                    const email = profile?.email || '-'
                    const equipName = equip?.name || 'อุปกรณ์'
                    const equipNumber = equip?.equipment_number ? `#${equip.equipment_number}` : ''

                    const statusLabel = l.status === 'approved' ? 'กำลังยืมใช้งาน' : 'รออนุมัติการยืม'
                    const timeReturn = l.return_time ? ` เวลา ${l.return_time.slice(0, 5)} น.` : ''
                    const dateRangeText = `${formatThaiDate(l.start_date)} - ${formatThaiDate(l.end_date)}${timeReturn}`

                    const messagesByRole = buildLoanConflictMessages({
                        equipName,
                        equipNumber,
                        equipmentId,
                        fullName,
                        deptName,
                        phone,
                        email,
                        dateRangeText,
                        statusLabel,
                        userId: l.user_id,
                        loanId: l.id
                    })

                    return {
                        hasConflict: true,
                        conflictType: 'loan',
                        conflictId: l.id,
                        status: l.status,
                        statusLabel,
                        holder: {
                            id: l.user_id,
                            name: fullName,
                            department: deptName,
                            phone,
                            email
                        },
                        equipment: {
                            id: equipmentId,
                            name: equipName,
                            equipmentNumber: equip?.equipment_number || '-'
                        },
                        timeSlot: {
                            startDate: l.start_date,
                            endDate: l.end_date,
                            returnTime: l.return_time
                        },
                        messagesByRole,
                        formattedMessage: messagesByRole[userRole]
                    }
                }
            }
        }

        // 3. ตรวจสอบตารางยืมพิเศษ (special_loan_requests)
        const startDateStr = startDate.toISOString().split('T')[0]
        const endDateStr = endDate.toISOString().split('T')[0]
        const slUrl = `${url}/rest/v1/special_loan_requests?status=eq.active&loan_date=lte.${endDateStr}&return_date=gte.${startDateStr}&select=id,equipment_ids,borrower_name,purpose,loan_date,return_date`
        const slResponse = await fetch(slUrl, { headers: authHeader })
        if (slResponse.ok) {
            const sls = await slResponse.json()
            for (const sl of sls) {
                if (sl.equipment_ids?.includes(equipmentId)) {
                    const messagesByRole = buildSpecialLoanConflictMessages({
                        equipName: 'อุปกรณ์ในโครงการ',
                        equipNumber: '-',
                        equipmentId,
                        projectName: sl.purpose || 'กิจกรรมองค์กร',
                        borrowerName: sl.borrower_name || '-',
                        loanDate: sl.loan_date,
                        returnDate: sl.return_date,
                        specialLoanId: sl.id
                    })

                    return {
                        hasConflict: true,
                        conflictType: 'special_loan',
                        conflictId: sl.id,
                        status: 'active',
                        statusLabel: 'ยืมพิเศษ (กิจกรรมองค์กร)',
                        messagesByRole,
                        formattedMessage: messagesByRole[userRole]
                    }
                }
            }
        }

        return { hasConflict: false }
    } catch (err) {
        console.error('[getBookingConflictDetails] Error checking conflict:', err)
        return { hasConflict: false }
    }
}

/**
 * ตรวจสอบการจอง/ยืมแบบครบวงจร
 * 
 * รวมการเช็คทั้งหมดไว้ในฟังก์ชันเดียว:
 * 1. วันที่ไม่อยู่ในอดีต
 * 2. ช่วงวันที่ถูกต้อง
 * 3. ไม่ซ้ำประเภทอุปกรณ์ (Type Conflict)
 * 4. ไม่ซ้อนเวลากับการจอง/ยืมอื่น (Time Conflict พร้อมดึงรายละเอียดคิวที่ชน)
 */
export async function validateBooking(input: BookingValidationInput): Promise<BookingValidationResult> {
    const { userId, equipmentId, startDate, endDate } = input

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

    // 4. Time conflict (detailed conflict check with holder info)
    const conflictInfo = await getBookingConflictDetails(input)
    if (conflictInfo.hasConflict) {
        return {
            valid: false,
            error: conflictInfo.formattedMessage || 'อุปกรณ์ชิ้นนี้ถูกผู้ใช้อื่นจอง/ยืมไว้แล้วในช่วงเวลาดังกล่าว กรุณาเปลี่ยนไปเลือกอุปกรณ์ชิ้นอื่น หรือเปลี่ยนวันที่และเวลาไม่ให้ตรงกัน',
            errorCode: 'TIME_CONFLICT',
            conflictInfo
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

/**
 * ดึงข้อความแจ้งเตือนข้อขัดแย้งที่เจาะจงตามบทบาท (User, Staff, Admin)
 */
export function getConflictMessageForRole(
    conflict: BookingConflictInfo,
    role: ConflictRole = 'user'
): string {
    if (!conflict.hasConflict) return ''
    if (conflict.messagesByRole?.[role]) return conflict.messagesByRole[role]
    return conflict.formattedMessage || 'อุปกรณ์ไม่ว่างในช่วงเวลาดังกล่าว'
}
