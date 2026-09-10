'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, requireStaff } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import {
    approveReservationSchema,
    rejectReservationSchema,
    markReadyReservationSchema,
    adminUpdateReservationSchema,
    adminForceCancelReservationSchema,
    adminDeleteReservationSchema,
    getReservationsQuerySchema
} from '@/lib/schemas/reservationSchema'
import { notifyAndLog, logActivityServer } from '@/lib/serverNotify'
import { formatThaiDate, formatThaiTime } from '@/lib/formatThaiDate'
import { getBookingConflictDetails } from '@/lib/domain'
import { convertReservationToLoanAction } from '@/app/reservations/actions'

export { convertReservationToLoanAction }

export interface ReservationStats {
    total: number
    pending: number
    approved: number
    ready: number
    completed: number
    rejected: number
    cancelled: number
    expired: number
}

export interface ReservationItemData {
    id: string
    user_id: string
    equipment_id: string
    start_date: string
    end_date: string
    pickup_time: string | null
    return_time: string | null
    status: 'pending' | 'approved' | 'ready' | 'completed' | 'rejected' | 'cancelled' | 'expired'
    rejection_reason: string | null
    loan_id: string | null
    created_at: string
    approved_at: string | null
    approved_by: string | null
    ready_at: string | null
    ready_by: string | null
    completed_at: string | null
    completed_by: string | null
    profiles: {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
        phone_number: string | null
        departments?: { name: string } | { name: string }[] | null
    } | null
    equipment: {
        id: string
        name: string
        equipment_number: string
        images: string[]
        equipment_types?: { name: string; icon: string } | null
    } | null
}

export interface GetReservationsResult {
    success: boolean
    items: ReservationItemData[]
    total: number
    totalPages: number
    page: number
    pageSize: number
    stats: ReservationStats
    error?: string
}

/**
 * ดึงรายการการจองแบบ Paginated พร้อมสถิติภาพรวม (Global Stats) ในรอบเดียว
 */
export async function getReservationsAction(params: {
    status?: string
    search?: string
    page?: number
    pageSize?: number
}): Promise<GetReservationsResult> {
    const parseResult = getReservationsQuerySchema.safeParse(params)
    if (!parseResult.success) {
        return {
            success: false,
            items: [],
            total: 0,
            totalPages: 1,
            page: 1,
            pageSize: 10,
            stats: { total: 0, pending: 0, approved: 0, ready: 0, completed: 0, rejected: 0, cancelled: 0, expired: 0 },
            error: parseResult.error.issues[0]?.message || 'พารามิเตอร์ไม่ถูกต้อง'
        }
    }

    const { status, search, page, pageSize } = parseResult.data
    const adminClient = createAdminClient()

    try {
        // 1. ดึงสถิติภาพรวมทั้งหมด (Global Counts ไม่ผูกกับ Filter ตาราง)
        const statsPromise = adminClient
            .from('reservations')
            .select('status')

        // 2. ดึงข้อมูลการจองหลักพร้อม equipment
        let query = adminClient
            .from('reservations')
            .select('*, equipment(id, name, equipment_number, images, equipment_types(name, icon))', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        // ค้นหาข้อความ
        if (search) {
            // ค้นหาทั้งอุปกรณ์และโปรไฟล์
            const [profilesMatch, equipMatch] = await Promise.all([
                adminClient
                    .from('profiles')
                    .select('id')
                    .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`),
                adminClient
                    .from('equipment')
                    .select('id')
                    .or(`name.ilike.%${search}%,equipment_number.ilike.%${search}%`)
            ])

            const matchingUserIds = (profilesMatch.data || []).map(p => p.id)
            const matchingEquipIds = (equipMatch.data || []).map(e => e.id)

            if (matchingUserIds.length > 0 && matchingEquipIds.length > 0) {
                query = query.or(`user_id.in.(${matchingUserIds.join(',')}),equipment_id.in.(${matchingEquipIds.join(',')})`)
            } else if (matchingUserIds.length > 0) {
                query = query.in('user_id', matchingUserIds)
            } else if (matchingEquipIds.length > 0) {
                query = query.in('equipment_id', matchingEquipIds)
            } else {
                // ไม่มีผลลัพธ์ที่ตรงกับคำค้นหา
                return {
                    success: true,
                    items: [],
                    total: 0,
                    totalPages: 1,
                    page,
                    pageSize,
                    stats: { total: 0, pending: 0, approved: 0, ready: 0, completed: 0, rejected: 0, cancelled: 0, expired: 0 }
                }
            }
        }

        // กำหนด Pagination
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        query = query.range(from, to)

        const [resList, statsList] = await Promise.all([query, statsPromise])

        if (resList.error) {
            console.error('[getReservationsAction] Query error:', resList.error)
            throw new Error('ไม่สามารถดึงข้อมูลการจองได้')
        }

        const rawItems = resList.data || []
        const totalCount = resList.count || 0

        // 3. Hydrate Profiles สำหรับรายการที่ดึงมา
        const userIds = Array.from(new Set(rawItems.map(r => r.user_id).filter(Boolean)))
        let profilesMap = new Map<string, any>()

        if (userIds.length > 0) {
            const { data: profiles } = await adminClient
                .from('profiles')
                .select('id, first_name, last_name, email, phone_number, departments(name)')
                .in('id', userIds)

            if (profiles) {
                profilesMap = new Map(profiles.map(p => [p.id, p]))
            }
        }

        const items: ReservationItemData[] = rawItems.map((r: any) => ({
            ...r,
            profiles: profilesMap.get(r.user_id) || null
        }))

        // 4. สรุปสถิติ Global Counts
        const allStatuses = statsList.data || []
        const stats: ReservationStats = {
            total: allStatuses.length,
            pending: allStatuses.filter((r: any) => r.status === 'pending').length,
            approved: allStatuses.filter((r: any) => r.status === 'approved').length,
            ready: allStatuses.filter((r: any) => r.status === 'ready').length,
            completed: allStatuses.filter((r: any) => r.status === 'completed').length,
            rejected: allStatuses.filter((r: any) => r.status === 'rejected').length,
            cancelled: allStatuses.filter((r: any) => r.status === 'cancelled').length,
            expired: allStatuses.filter((r: any) => r.status === 'expired').length,
        }

        return {
            success: true,
            items,
            total: totalCount,
            totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
            page,
            pageSize,
            stats
        }
    } catch (err: any) {
        console.error('[getReservationsAction] Error:', err)
        return {
            success: false,
            items: [],
            total: 0,
            totalPages: 1,
            page: 1,
            pageSize: 10,
            stats: { total: 0, pending: 0, approved: 0, ready: 0, completed: 0, rejected: 0, cancelled: 0, expired: 0 },
            error: err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลการจอง'
        }
    }
}

/**
 * อนุมัติการจอง (Staff/Admin)
 */
export async function approveReservationAction(reservationId: string): Promise<{ success: boolean; error?: string; conflictInfo?: any }> {
    const parse = approveReservationSchema.safeParse({ reservationId })
    if (!parse.success) return { success: false, error: parse.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }

    const { user, profile, error: authError } = await requireStaff()
    if (authError || !user) return { success: false, error: authError || 'ไม่มีสิทธิ์ดำเนินการ' }

    const adminClient = createAdminClient()

    try {
        // 1. ดึงข้อมูลการจองเพื่อตรวจสอบ
        const { data: reservation, error: fetchErr } = await adminClient
            .from('reservations')
            .select('*, equipment(name, equipment_number), profiles:user_id(id, first_name, last_name, email, user_id, departments(name))')
            .eq('id', reservationId)
            .single()

        if (fetchErr || !reservation) {
            return { success: false, error: 'ไม่พบข้อมูลการจอง' }
        }

        if (reservation.status !== 'pending') {
            return { success: false, error: `การจองนี้ไม่อยู่ในสถานะรออนุมัติ (สถานะปัจจุบัน: ${reservation.status})` }
        }

        const startDate = new Date(reservation.start_date)
        const endDate = new Date(reservation.end_date)
        if (endDate.getTime() < startDate.getTime()) {
            return { success: false, error: 'วันที่คืนต้องไม่ก่อนวันที่รับ' }
        }

        // 2. Conflict Guard: ตรวจสอบว่าระหว่างที่รออนุมัติ มีใครนำอุปกรณ์ไปยืม/จองซ้อนทับหรือไม่
        const currentRole = profile?.role || 'staff'
        const conflict = await getBookingConflictDetails({
            userId: reservation.user_id,
            equipmentId: reservation.equipment_id,
            startDate,
            endDate,
            bookingType: 'reservation',
            excludeReservationId: reservationId,
            userRole: currentRole
        })

        if (conflict.hasConflict) {
            return {
                success: false,
                error: conflict.formattedMessage || 'ไม่สามารถอนุมัติได้: อุปกรณ์นี้ติดคิวจองหรือยืมของผู้อื่นในช่วงเวลาดังกล่าว',
                conflictInfo: conflict
            }
        }

        // 3. อัปเดตสถานะเป็น approved
        const now = new Date().toISOString()
        const { error: updateErr } = await adminClient
            .from('reservations')
            .update({
                status: 'approved',
                approved_at: now,
                approved_by: user.id,
                updated_at: now
            })
            .eq('id', reservationId)

        if (updateErr) {
            console.error('[approveReservationAction] Update error:', updateErr)
            return { success: false, error: updateErr.message }
        }

        // 4. ดึงข้อมูล Staff
        const { data: staffProfile } = await adminClient
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', user.id)
            .single()

        const staffName = `${staffProfile?.first_name || ''} ${staffProfile?.last_name || ''}`.trim() || 'เจ้าหน้าที่'
        const staffRole = (staffProfile?.role as 'staff' | 'admin') || 'staff'
        const borrowerProfile = reservation.profiles as any
        const borrowerName = `${borrowerProfile?.first_name || ''} ${borrowerProfile?.last_name || ''}`.trim()
        const equipmentName = reservation.equipment?.name || 'อุปกรณ์'
        const equipmentNumber = reservation.equipment?.equipment_number || '-'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        // 5. ส่งการแจ้งเตือน Discord + WeLPRU + Activity Log
        await notifyAndLog({
            eventKey: 'reservation_approved',
            discordMessage:
                `✅ **อนุมัติการจองอุปกรณ์**\n\n` +
                `📦 **อุปกรณ์:** ${equipmentName} (#${equipmentNumber})\n` +
                `👤 **ผู้จอง:** ${borrowerName}\n` +
                `📅 **วันที่รับ:** ${formatThaiDate(reservation.start_date)}\n` +
                `📅 **วันที่คืน:** ${formatThaiDate(reservation.end_date)}\n` +
                `👨‍💼 **อนุมัติโดย:** ${staffName} (${staffRole})\n` +
                `🔗 [ดูรายการจอง](${appUrl}/admin/reservations)`,
            discordType: 'reservation',
            welpruUserIds: borrowerProfile?.user_id ? [borrowerProfile.user_id] : [],
            welpruVariables: {
                equipment: equipmentName,
                reserver: borrowerName
            },
            welpruLink: `${appUrl}/my-reservations`,
            activity: {
                staffId: user.id,
                staffRole,
                actionType: 'approve_reservation',
                targetType: 'reservation',
                targetId: reservationId,
                targetUserId: reservation.user_id,
                isSelfAction: reservation.user_id === user.id
            }
        })

        revalidatePath('/admin/reservations')
        revalidatePath('/staff/reservations')
        revalidatePath('/my-reservations')

        return { success: true }
    } catch (err: any) {
        console.error('[approveReservationAction] Error:', err)
        return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการอนุมัติ' }
    }
}

/**
 * ปฏิเสธการจอง (Staff/Admin)
 */
export async function rejectReservationAction(reservationId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const parse = rejectReservationSchema.safeParse({ reservationId, reason })
    if (!parse.success) return { success: false, error: parse.error.issues[0]?.message || 'กรุณาระบุเหตุผลในการปฏิเสธ' }

    const { user, error: authError } = await requireStaff()
    if (authError || !user) return { success: false, error: authError || 'ไม่มีสิทธิ์ดำเนินการ' }

    const adminClient = createAdminClient()

    try {
        const { data: reservation, error: fetchErr } = await adminClient
            .from('reservations')
            .select('*, equipment(name, equipment_number), profiles:user_id(id, first_name, last_name, user_id)')
            .eq('id', reservationId)
            .single()

        if (fetchErr || !reservation) return { success: false, error: 'ไม่พบข้อมูลการจอง' }

        const now = new Date().toISOString()
        const { error: updateErr } = await adminClient
            .from('reservations')
            .update({
                status: 'rejected',
                rejection_reason: reason.trim(),
                updated_at: now
            })
            .eq('id', reservationId)

        if (updateErr) return { success: false, error: updateErr.message }

        const { data: staffProfile } = await adminClient
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', user.id)
            .single()

        const staffName = `${staffProfile?.first_name || ''} ${staffProfile?.last_name || ''}`.trim() || 'เจ้าหน้าที่'
        const staffRole = (staffProfile?.role as 'staff' | 'admin') || 'staff'
        const borrowerProfile = reservation.profiles as any
        const borrowerName = `${borrowerProfile?.first_name || ''} ${borrowerProfile?.last_name || ''}`.trim()
        const equipmentName = reservation.equipment?.name || 'อุปกรณ์'
        const equipmentNumber = reservation.equipment?.equipment_number || '-'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        await notifyAndLog({
            eventKey: 'reservation_rejected',
            discordMessage:
                `❌ **ปฏิเสธการจองอุปกรณ์**\n\n` +
                `📦 **อุปกรณ์:** ${equipmentName} (#${equipmentNumber})\n` +
                `👤 **ผู้จอง:** ${borrowerName}\n` +
                `💬 **เหตุผล:** ${reason.trim()}\n` +
                `👨‍💼 **ดำเนินการโดย:** ${staffName} (${staffRole})\n` +
                `🔗 [ดูรายการจอง](${appUrl}/admin/reservations)`,
            discordType: 'reservation',
            welpruUserIds: borrowerProfile?.user_id ? [borrowerProfile.user_id] : [],
            welpruVariables: {
                equipment: equipmentName,
                reserver: borrowerName
            },
            welpruLink: `${appUrl}/my-reservations`,
            activity: {
                staffId: user.id,
                staffRole,
                actionType: 'reject_reservation',
                targetType: 'reservation',
                targetId: reservationId,
                targetUserId: reservation.user_id,
                details: { reason: reason.trim() }
            }
        })

        revalidatePath('/admin/reservations')
        revalidatePath('/staff/reservations')
        revalidatePath('/my-reservations')

        return { success: true }
    } catch (err: any) {
        console.error('[rejectReservationAction] Error:', err)
        return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการปฏิเสธ' }
    }
}

/**
 * เปลี่ยนสถานะเป็นพร้อมรับ (Staff/Admin)
 */
export async function markReadyReservationAction(reservationId: string): Promise<{ success: boolean; error?: string }> {
    const parse = markReadyReservationSchema.safeParse({ reservationId })
    if (!parse.success) return { success: false, error: parse.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }

    const { user, error: authError } = await requireStaff()
    if (authError || !user) return { success: false, error: authError || 'ไม่มีสิทธิ์ดำเนินการ' }

    const adminClient = createAdminClient()

    try {
        const { data: reservation, error: fetchErr } = await adminClient
            .from('reservations')
            .select('*, equipment(name, equipment_number), profiles:user_id(id, first_name, last_name, user_id)')
            .eq('id', reservationId)
            .single()

        if (fetchErr || !reservation) return { success: false, error: 'ไม่พบข้อมูลการจอง' }

        const now = new Date().toISOString()
        const { error: updateErr } = await adminClient
            .from('reservations')
            .update({
                status: 'ready',
                ready_at: now,
                ready_by: user.id,
                updated_at: now
            })
            .eq('id', reservationId)

        if (updateErr) return { success: false, error: updateErr.message }

        const { data: staffProfile } = await adminClient
            .from('profiles')
            .select('first_name, last_name, role')
            .eq('id', user.id)
            .single()

        const staffName = `${staffProfile?.first_name || ''} ${staffProfile?.last_name || ''}`.trim() || 'เจ้าหน้าที่'
        const staffRole = (staffProfile?.role as 'staff' | 'admin') || 'staff'
        const borrowerProfile = reservation.profiles as any
        const borrowerName = `${borrowerProfile?.first_name || ''} ${borrowerProfile?.last_name || ''}`.trim()
        const equipmentName = reservation.equipment?.name || 'อุปกรณ์'
        const equipmentNumber = reservation.equipment?.equipment_number || '-'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        await notifyAndLog({
            eventKey: 'reservation_ready',
            discordMessage:
                `🔔 **อุปกรณ์พร้อมให้รับแล้ว**\n\n` +
                `📦 **อุปกรณ์:** ${equipmentName} (#${equipmentNumber})\n` +
                `👤 **ผู้จอง:** ${borrowerName}\n` +
                `📅 **วันที่รับ:** ${formatThaiDate(reservation.start_date)}\n` +
                `👨‍💼 **แจ้งโดย:** ${staffName} (${staffRole})\n` +
                `🔗 [ดูรายการจอง](${appUrl}/admin/reservations)`,
            discordType: 'reservation',
            welpruUserIds: borrowerProfile?.user_id ? [borrowerProfile.user_id] : [],
            welpruVariables: {
                equipment: equipmentName,
                reserver: borrowerName
            },
            welpruLink: `${appUrl}/my-reservations`,
            activity: {
                staffId: user.id,
                staffRole,
                actionType: 'mark_ready',
                targetType: 'reservation',
                targetId: reservationId,
                targetUserId: reservation.user_id
            }
        })

        revalidatePath('/admin/reservations')
        revalidatePath('/staff/reservations')
        revalidatePath('/my-reservations')

        return { success: true }
    } catch (err: any) {
        console.error('[markReadyReservationAction] Error:', err)
        return { success: false, error: err.message || 'เกิดข้อผิดพลาด' }
    }
}

/**
 * ผู้ดูแลระบบแก้ไขข้อมูลการจอง (Admin Only)
 */
export async function adminUpdateReservationAction(data: {
    reservationId: string
    startDate?: string
    endDate?: string
    pickupTime?: string | null
    returnTime?: string | null
    status?: 'pending' | 'approved' | 'ready' | 'completed' | 'rejected' | 'cancelled' | 'expired'
    rejectionReason?: string | null
}): Promise<{ success: boolean; error?: string }> {
    const parse = adminUpdateReservationSchema.safeParse(data)
    if (!parse.success) return { success: false, error: parse.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }

    const { user, error: authError } = await requireAdmin()
    if (authError || !user) return { success: false, error: authError || 'เฉพาะผู้ดูแลระบบเท่านั้นที่มีสิทธิ์แก้ไข' }

    const adminClient = createAdminClient()

    try {
        const { data: current, error: fetchErr } = await adminClient
            .from('reservations')
            .select('*')
            .eq('id', data.reservationId)
            .single()

        if (fetchErr || !current) return { success: false, error: 'ไม่พบข้อมูลการจอง' }

        const newStart = data.startDate ? new Date(data.startDate) : new Date(current.start_date)
        const newEnd = data.endDate ? new Date(data.endDate) : new Date(current.end_date)

        // ตรวจสอบ Conflict หากมีการเปลี่ยนวันที่หรือสถานะ
        if (data.startDate || data.endDate) {
            const conflict = await getBookingConflictDetails({
                userId: current.user_id,
                equipmentId: current.equipment_id,
                startDate: newStart,
                endDate: newEnd,
                bookingType: 'reservation',
                excludeReservationId: data.reservationId,
                userRole: 'admin'
            })

            if (conflict.hasConflict) {
                return {
                    success: false,
                    error: conflict.formattedMessage || 'ช่วงเวลาใหม่ที่เลือกทับซ้อนกับการจองหรือการยืมอื่น'
                }
            }
        }

        const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString()
        }
        if (data.startDate !== undefined) updatePayload.start_date = data.startDate
        if (data.endDate !== undefined) updatePayload.end_date = data.endDate
        if (data.pickupTime !== undefined) updatePayload.pickup_time = data.pickupTime || null
        if (data.returnTime !== undefined) updatePayload.return_time = data.returnTime || null
        if (data.status !== undefined) updatePayload.status = data.status
        if (data.rejectionReason !== undefined) updatePayload.rejection_reason = data.rejectionReason || null

        const { error: updateErr } = await adminClient
            .from('reservations')
            .update(updatePayload)
            .eq('id', data.reservationId)

        if (updateErr) return { success: false, error: updateErr.message }

        await logActivityServer({
            staffId: user.id,
            staffRole: 'admin',
            actionType: 'edit_reservation',
            targetType: 'reservation',
            targetId: data.reservationId,
            targetUserId: current.user_id,
            details: { updated_fields: Object.keys(data) }
        })

        revalidatePath('/admin/reservations')
        revalidatePath('/staff/reservations')
        revalidatePath('/my-reservations')

        return { success: true }
    } catch (err: any) {
        console.error('[adminUpdateReservationAction] Error:', err)
        return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึก' }
    }
}

/**
 * ผู้ดูแลระบบบังคับยกเลิกการจอง (Admin Only)
 */
export async function adminForceCancelReservationAction(reservationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const parse = adminForceCancelReservationSchema.safeParse({ reservationId, reason })
    if (!parse.success) return { success: false, error: parse.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }

    const { user, error: authError } = await requireAdmin()
    if (authError || !user) return { success: false, error: authError || 'เฉพาะผู้ดูแลระบบเท่านั้น' }

    const adminClient = createAdminClient()

    try {
        const { data: reservation, error: fetchErr } = await adminClient
            .from('reservations')
            .select('*, equipment(id, status)')
            .eq('id', reservationId)
            .single()

        if (fetchErr || !reservation) return { success: false, error: 'ไม่พบข้อมูลการจอง' }

        const now = new Date().toISOString()
        const { error: updateErr } = await adminClient
            .from('reservations')
            .update({
                status: 'cancelled',
                updated_at: now
            })
            .eq('id', reservationId)

        if (updateErr) return { success: false, error: updateErr.message }

        // คืนสถานะอุปกรณ์เป็น ready หากก่อนหน้าเป็น reserved
        if (reservation.equipment?.status === 'reserved') {
            await adminClient
                .from('equipment')
                .update({ status: 'ready', updated_at: now })
                .eq('id', reservation.equipment_id)
        }

        await logActivityServer({
            staffId: user.id,
            staffRole: 'admin',
            actionType: 'cancel_reservation',
            targetType: 'reservation',
            targetId: reservationId,
            targetUserId: reservation.user_id,
            details: { reason: reason || 'ยกเลิกโดย Admin' }
        })

        revalidatePath('/admin/reservations')
        revalidatePath('/staff/reservations')
        revalidatePath('/my-reservations')

        return { success: true }
    } catch (err: any) {
        console.error('[adminForceCancelReservationAction] Error:', err)
        return { success: false, error: err.message || 'เกิดข้อผิดพลาด' }
    }
}

/**
 * ผู้ดูแลระบบลบการจองออกจากฐานข้อมูลถาวร (Admin Only)
 */
export async function adminDeleteReservationAction(reservationId: string): Promise<{ success: boolean; error?: string }> {
    const parse = adminDeleteReservationSchema.safeParse({ reservationId })
    if (!parse.success) return { success: false, error: parse.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }

    const { user, error: authError } = await requireAdmin()
    if (authError || !user) return { success: false, error: authError || 'เฉพาะผู้ดูแลระบบเท่านั้น' }

    const adminClient = createAdminClient()

    try {
        // ตรวจสอบว่าผูกกับสัญญายืมที่กำลังใช้งานอยู่หรือไม่
        const { data: reservation, error: fetchErr } = await adminClient
            .from('reservations')
            .select('id, user_id, loan_id, status, equipment_id, equipment(status)')
            .eq('id', reservationId)
            .single()

        if (fetchErr || !reservation) return { success: false, error: 'ไม่พบข้อมูลการจอง' }

        if (reservation.loan_id) {
            const { data: loan } = await adminClient
                .from('loanRequests')
                .select('status')
                .eq('id', reservation.loan_id)
                .single()

            if (loan && (loan.status === 'approved' || loan.status === 'pending')) {
                return {
                    success: false,
                    error: 'ไม่สามารถลบการจองนี้ได้ เนื่องจากผูกกับสัญญาการยืมที่ยังดำเนินอยู่ (ต้องคืนอุปกรณ์ก่อน)'
                }
            }
        }

        // หากอุปกรณ์ค้างสถานะ reserved ให้คืนเป็น ready
        const eqStatus = (reservation.equipment as any)?.status
        if (eqStatus === 'reserved') {
            await adminClient
                .from('equipment')
                .update({ status: 'ready', updated_at: new Date().toISOString() })
                .eq('id', reservation.equipment_id)
        }

        // ลบแถวข้อมูล
        const { error: deleteErr } = await adminClient
            .from('reservations')
            .delete()
            .eq('id', reservationId)

        if (deleteErr) return { success: false, error: deleteErr.message }

        // บันทึก Audit Log
        await logActivityServer({
            staffId: user.id,
            staffRole: 'admin',
            actionType: 'soft_delete_data',
            targetType: 'reservation',
            targetId: reservationId,
            targetUserId: reservation.user_id,
            details: { action: 'hard_delete_reservation', deleted_id: reservationId }
        })

        revalidatePath('/admin/reservations')
        revalidatePath('/staff/reservations')

        return { success: true }
    } catch (err: any) {
        console.error('[adminDeleteReservationAction] Error:', err)
        return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบ' }
    }
}
