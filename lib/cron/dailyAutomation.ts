/**
 * lib/cron/dailyAutomation.ts
 * Core Daily Automation & Smart Cron Engine
 *
 * Scheduled to run daily at 08:30 น. (UTC+7 / 01:30 UTC)
 * Can also be triggered manually by Admin from Settings.
 *
 * Responsibilities:
 * 1. Overdue Loan Alerts: Notify borrowers & staff for loans where deadline has passed
 * 2. Due Soon Reminders: Notify borrowers & staff for loans due today or tomorrow
 * 3. Expired Reservation Cleanup: Cancel & mark 'expired' for reservations past scheduled pickup day
 */

import { createAdminClient } from '@/lib/supabase/server'
import { sendDiscordNotification, sendWeLPRUNotification, type DiscordEmbed } from '@/lib/notifications'
import { formatThaiDate } from '@/lib/formatThaiDate'

export interface AutomationTaskResult {
    totalEvaluated: number
    actionTaken: number
    errors: string[]
}

export interface DailyAutomationResult {
    success: boolean
    timestamp: string
    overdue: AutomationTaskResult
    dueSoon: AutomationTaskResult
    expiredReservations: AutomationTaskResult
    summaryMessage: string
}

const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000

/**
 * Returns YYYY-MM-DD in Asia/Bangkok timezone
 */
function getBangkokDateStr(date: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date)
}

/**
 * Computes exact deadline in Asia/Bangkok timezone (+07:00)
 */
function computeBangkokDeadline(dateInput: string | Date, timeInput?: string | null): Date {
    const d = new Date(dateInput)
    const dateStr = getBangkokDateStr(d)
    const cleanTime = timeInput
        ? (timeInput.length === 5 ? `${timeInput}:00` : timeInput)
        : '17:00:00'
    return new Date(`${dateStr}T${cleanTime}+07:00`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Process Overdue Loans
// ─────────────────────────────────────────────────────────────────────────────

async function processOverdueLoans(admin: any, now: Date): Promise<AutomationTaskResult> {
    const result: AutomationTaskResult = { totalEvaluated: 0, actionTaken: 0, errors: [] }

    try {
        const { data: loans, error } = await admin
            .from('loanRequests')
            .select(`
                id,
                user_id,
                equipment_id,
                start_date,
                end_date,
                return_time,
                status,
                last_reminder_at,
                profiles!fk_loanrequests_profiles(id, first_name, last_name, email, phone_number, user_id, departments(name)),
                equipment(id, name, equipment_number)
            `)
            .eq('status', 'approved')

        if (error) {
            result.errors.push(`Fetch loans failed: ${error.message}`)
            return result
        }

        if (!loans || loans.length === 0) return result

        result.totalEvaluated = loans.length
        const overdueItems: Array<{
            loanId: string
            borrowerName: string
            dept: string
            phone: string
            equipmentName: string
            equipmentNumber: string
            daysOverdue: number
            dueDateFormatted: string
            dueTimeStr: string
        }> = []

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        for (const loan of loans) {
            try {
                const deadline = computeBangkokDeadline(loan.end_date, loan.return_time)
                if (now.getTime() <= deadline.getTime()) {
                    continue // Not overdue
                }

                // Check 20-hour idempotency
                if (loan.last_reminder_at) {
                    const lastReminded = new Date(loan.last_reminder_at)
                    if (now.getTime() - lastReminded.getTime() < TWENTY_HOURS_MS) {
                        continue // Already reminded today
                    }
                }

                const diffMs = now.getTime() - deadline.getTime()
                const daysOverdue = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)))

                const profile = loan.profiles as any
                const equipment = loan.equipment as any
                const borrowerName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'ไม่ทราบชื่อ'
                const dept = profile?.departments?.name || '-'
                const phone = profile?.phone_number || '-'
                const equipmentName = equipment?.name || 'อุปกรณ์'
                const equipmentNumber = equipment?.equipment_number || '-'
                const timeStr = loan.return_time ? loan.return_time.slice(0, 5) : '17:00'

                // 1. Insert in-app DB notification
                if (loan.user_id) {
                    await admin.from('notifications').insert({
                        user_id: loan.user_id,
                        type: 'loan_overdue',
                        title: 'แจ้งเตือน: เลยกำหนดคืนอุปกรณ์ ⚠️',
                        message: `อุปกรณ์ ${equipmentName} (#${equipmentNumber}) เลยกำหนดส่งคืนมาแล้ว ${daysOverdue} วัน กรุณานำส่งคืนที่เคาน์เตอร์บริการโดยด่วนที่สุด`,
                        related_entity_id: loan.id
                    })
                }

                // 2. WeLPRU Push Notification if user_id (Student/Staff code) exists
                const studentWelpruId = profile?.user_id
                if (studentWelpruId) {
                    await sendWeLPRUNotification({
                        userIds: [studentWelpruId],
                        title: 'แจ้งเตือนเลยกำหนดส่งคืนอุปกรณ์ ⚠️',
                        body: `คอมพิวเตอร์/อุปกรณ์ ${equipmentName} เลยกำหนดส่งคืนมาแล้ว ${daysOverdue} วัน กรุณานำมาคืนโดยด่วน`,
                        link: `${appUrl}/my-loans`
                    })
                }

                // 3. Update last_reminder_at
                await admin
                    .from('loanRequests')
                    .update({ last_reminder_at: now.toISOString() })
                    .eq('id', loan.id)

                overdueItems.push({
                    loanId: loan.id,
                    borrowerName,
                    dept,
                    phone,
                    equipmentName,
                    equipmentNumber,
                    daysOverdue,
                    dueDateFormatted: formatThaiDate(loan.end_date),
                    dueTimeStr: timeStr
                })

                result.actionTaken++
            } catch (itemErr: any) {
                result.errors.push(`Loan ${loan.id}: ${itemErr.message}`)
            }
        }

        // 4. Send Combined Discord Embed to Staff channel if any overdue items reminded
        if (overdueItems.length > 0) {
            const fields = overdueItems.slice(0, 15).map(item => ({
                name: `📦 ${item.equipmentName} (#${item.equipmentNumber})`,
                value: `👤 **ผู้ยืม:** ${item.borrowerName} (${item.dept})\n📞 **โทร:** ${item.phone}\n📅 **กำหนดเดิม:** ${item.dueDateFormatted} (${item.dueTimeStr} น.)\n⚠️ **เลยกำหนด:** \`${item.daysOverdue} วัน\``,
                inline: false
            }))

            if (overdueItems.length > 15) {
                fields.push({
                    name: `...และอีก ${overdueItems.length - 15} รายการ`,
                    value: `[คลิกเพื่อตรวจสอบรายการทั้งหมดที่หน้าค้างส่ง](${appUrl}/staff/overdue)`,
                    inline: false
                })
            }

            const embed: DiscordEmbed = {
                title: `🚨 แจ้งเตือน: พบอุปกรณ์ค้างส่ง (${overdueItems.length} รายการ)`,
                description: `ระบบได้ทำการตรวจพบอุปกรณ์ที่เกินกำหนดส่งคืนประจำวัน และส่งข้อความเตือนไปยังผู้ยืมแล้ว`,
                color: 0xEF4444, // Red
                fields,
                timestamp: now.toISOString(),
                footer: { text: 'ระบบงานอัตโนมัติประจำวัน • ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์' }
            }

            await sendDiscordNotification({ embeds: [embed] }, 'loan')
        }
    } catch (err: any) {
        result.errors.push(`processOverdueLoans fatal: ${err.message}`)
    }

    return result
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Process Loans Due Soon (Today or Tomorrow)
// ─────────────────────────────────────────────────────────────────────────────

async function processDueSoonLoans(admin: any, now: Date): Promise<AutomationTaskResult> {
    const result: AutomationTaskResult = { totalEvaluated: 0, actionTaken: 0, errors: [] }

    try {
        const { data: loans, error } = await admin
            .from('loanRequests')
            .select(`
                id,
                user_id,
                equipment_id,
                start_date,
                end_date,
                return_time,
                status,
                last_reminder_at,
                profiles!fk_loanrequests_profiles(id, first_name, last_name, email, phone_number, user_id, departments(name)),
                equipment(id, name, equipment_number)
            `)
            .eq('status', 'approved')

        if (error) {
            result.errors.push(`Fetch loans failed: ${error.message}`)
            return result
        }

        if (!loans || loans.length === 0) return result

        result.totalEvaluated = loans.length
        const todayStr = getBangkokDateStr(now)
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        const tomorrowStr = getBangkokDateStr(tomorrow)

        const dueSoonItems: Array<{
            loanId: string
            borrowerName: string
            dept: string
            equipmentName: string
            equipmentNumber: string
            targetDayText: string
            dueDateFormatted: string
            dueTimeStr: string
        }> = []

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        for (const loan of loans) {
            try {
                const deadline = computeBangkokDeadline(loan.end_date, loan.return_time)
                // If already passed deadline, skip (handled in overdue)
                if (deadline.getTime() <= now.getTime()) {
                    continue
                }

                const loanDueDateStr = getBangkokDateStr(new Date(loan.end_date))
                const isDueToday = loanDueDateStr === todayStr
                const isDueTomorrow = loanDueDateStr === tomorrowStr

                if (!isDueToday && !isDueTomorrow) {
                    continue
                }

                // Check 20-hour idempotency
                if (loan.last_reminder_at) {
                    const lastReminded = new Date(loan.last_reminder_at)
                    if (now.getTime() - lastReminded.getTime() < TWENTY_HOURS_MS) {
                        continue
                    }
                }

                const profile = loan.profiles as any
                const equipment = loan.equipment as any
                const borrowerName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'ไม่ทราบชื่อ'
                const dept = profile?.departments?.name || '-'
                const equipmentName = equipment?.name || 'อุปกรณ์'
                const equipmentNumber = equipment?.equipment_number || '-'
                const timeStr = loan.return_time ? loan.return_time.slice(0, 5) : '17:00'
                const dayText = isDueToday ? 'วันนี้' : 'วันพรุ่งนี้'

                // 1. Insert in-app DB notification
                if (loan.user_id) {
                    await admin.from('notifications').insert({
                        user_id: loan.user_id,
                        type: 'loan_due_soon',
                        title: `เตือนล่วงหน้า: ครบกำหนดคืนอุปกรณ์${dayText} ⏰`,
                        message: `อุปกรณ์ ${equipmentName} (#${equipmentNumber}) มีกำหนดส่งคืน${dayText} (${formatThaiDate(loan.end_date)} เวลา ${timeStr} น.) กรุณาเตรียมนำส่งคืนที่เคาน์เตอร์`,
                        related_entity_id: loan.id
                    })
                }

                // 2. WeLPRU Push Notification if user_id exists
                const studentWelpruId = profile?.user_id
                if (studentWelpruId) {
                    await sendWeLPRUNotification({
                        userIds: [studentWelpruId],
                        title: `เตือนใกล้ครบกำหนดคืนอุปกรณ์ ⏰`,
                        body: `อุปกรณ์ ${equipmentName} มีกำหนดส่งคืน${dayText} เวลา ${timeStr} น. กรุณาเตรียมนำส่งคืน`,
                        link: `${appUrl}/my-loans`
                    })
                }

                // 3. Update last_reminder_at
                await admin
                    .from('loanRequests')
                    .update({ last_reminder_at: now.toISOString() })
                    .eq('id', loan.id)

                dueSoonItems.push({
                    loanId: loan.id,
                    borrowerName,
                    dept,
                    equipmentName,
                    equipmentNumber,
                    targetDayText: dayText,
                    dueDateFormatted: formatThaiDate(loan.end_date),
                    dueTimeStr: timeStr
                })

                result.actionTaken++
            } catch (itemErr: any) {
                result.errors.push(`DueSoon Loan ${loan.id}: ${itemErr.message}`)
            }
        }

        // 4. Send Combined Discord Embed to Staff channel
        if (dueSoonItems.length > 0) {
            const fields = dueSoonItems.slice(0, 15).map(item => ({
                name: `📦 ${item.equipmentName} (#${item.equipmentNumber})`,
                value: `👤 **ผู้ยืม:** ${item.borrowerName} (${item.dept})\n📅 **กำหนดส่งคืน:** ${item.targetDayText} (${item.dueDateFormatted} เวลา ${item.dueTimeStr} น.)`,
                inline: false
            }))

            const embed: DiscordEmbed = {
                title: `⏰ แจ้งเตือน: อุปกรณ์ใกล้ครบกำหนดส่งคืน (${dueSoonItems.length} รายการ)`,
                description: `รายการอุปกรณ์ที่จะครบกำหนดส่งคืนในวันนี้/พรุ่งนี้ ระบบได้ทำการแจ้งเตือนผู้ยืมเรียบร้อยแล้ว`,
                color: 0xF59E0B, // Amber
                fields,
                timestamp: now.toISOString(),
                footer: { text: 'ระบบงานอัตโนมัติประจำวัน • ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์' }
            }

            await sendDiscordNotification({ embeds: [embed] }, 'loan')
        }
    } catch (err: any) {
        result.errors.push(`processDueSoonLoans fatal: ${err.message}`)
    }

    return result
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Process Expired Reservations Cleanup
// ─────────────────────────────────────────────────────────────────────────────

async function processExpiredReservations(admin: any, now: Date): Promise<AutomationTaskResult> {
    const result: AutomationTaskResult = { totalEvaluated: 0, actionTaken: 0, errors: [] }

    try {
        const { data: reservations, error } = await admin
            .from('reservations')
            .select(`
                id,
                user_id,
                equipment_id,
                start_date,
                end_date,
                pickup_time,
                return_time,
                status,
                profiles(id, first_name, last_name, email, phone_number, user_id, departments(name)),
                equipment(id, name, equipment_number)
            `)
            .in('status', ['pending', 'approved', 'ready'])

        if (error) {
            result.errors.push(`Fetch reservations failed: ${error.message}`)
            return result
        }

        if (!reservations || reservations.length === 0) return result

        result.totalEvaluated = reservations.length
        const todayStr = getBangkokDateStr(now)
        const expiredItems: Array<{
            id: string
            reserverName: string
            dept: string
            equipmentName: string
            equipmentNumber: string
            reservedDateFormatted: string
        }> = []

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

        for (const res of reservations) {
            try {
                // A reservation is expired if its scheduled start_date is before today in Bangkok,
                // OR if its end_date has passed.
                const resStartDateStr = getBangkokDateStr(new Date(res.start_date))
                const resEndDeadline = computeBangkokDeadline(res.end_date, res.return_time)

                const isPastPickupDay = resStartDateStr < todayStr
                const isPastEndWindow = resEndDeadline.getTime() < now.getTime()

                if (!isPastPickupDay && !isPastEndWindow) {
                    continue // Still valid for today or future
                }

                const profile = res.profiles as any
                const equipment = res.equipment as any
                const reserverName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'ไม่ทราบชื่อ'
                const dept = profile?.departments?.name || '-'
                const equipmentName = equipment?.name || 'อุปกรณ์'
                const equipmentNumber = equipment?.equipment_number || '-'

                // 1. Update reservation status to expired
                const { error: updateErr } = await admin
                    .from('reservations')
                    .update({
                        status: 'expired',
                        rejection_reason: 'ยกเลิกอัตโนมัติเนื่องจากเลยกำหนดวันรับอุปกรณ์ข้ามวัน',
                        updated_at: now.toISOString()
                    })
                    .eq('id', res.id)

                if (updateErr) {
                    result.errors.push(`Update reservation ${res.id} failed: ${updateErr.message}`)
                    continue
                }

                // 2. Insert in-app DB notification
                if (res.user_id) {
                    await admin.from('notifications').insert({
                        user_id: res.user_id,
                        type: 'reservation_expired',
                        title: 'การจองถูกยกเลิกเนื่องจากเลยกำหนดรับ ⌛',
                        message: `การจองอุปกรณ์ ${equipmentName} (#${equipmentNumber}) ถูกยกเลิกอัตโนมัติเนื่องจากท่านไม่ได้มารับอุปกรณ์ตามวันเวลาที่กำหนด`,
                        related_entity_id: res.id
                    })
                }

                // 3. WeLPRU push notification
                const studentWelpruId = profile?.user_id
                if (studentWelpruId) {
                    await sendWeLPRUNotification({
                        userIds: [studentWelpruId],
                        title: 'การจองอุปกรณ์หมดอายุ ⌛',
                        body: `การจอง ${equipmentName} ถูกยกเลิกอัตโนมัติเนื่องจากเลยกำหนดเวลารับอุปกรณ์`,
                        link: `${appUrl}/my-reservations`
                    })
                }

                expiredItems.push({
                    id: res.id,
                    reserverName,
                    dept,
                    equipmentName,
                    equipmentNumber,
                    reservedDateFormatted: formatThaiDate(res.start_date)
                })

                result.actionTaken++
            } catch (itemErr: any) {
                result.errors.push(`Reservation ${res.id}: ${itemErr.message}`)
            }
        }

        // 4. Send Combined Discord Embed to Reservation channel
        if (expiredItems.length > 0) {
            const fields = expiredItems.slice(0, 15).map(item => ({
                name: `📦 ${item.equipmentName} (#${item.equipmentNumber})`,
                value: `👤 **ผู้จอง:** ${item.reserverName} (${item.dept})\n📅 **วันที่จองไว้:** ${item.reservedDateFormatted}\n🚫 **สถานะใหม่:** ยกเลิกเนื่องจากเลยกำหนดรับ (Expired)`,
                inline: false
            }))

            const embed: DiscordEmbed = {
                title: `⌛ เคลียร์คิวจองหมดเวลา (${expiredItems.length} รายการ)`,
                description: `ระบบได้ทำการยกเลิกรายการจองที่เลยกำหนดรับของข้ามวัน เพื่อให้อุปกรณ์กลับมาพร้อมใช้งานสำหรับผู้ใช้อื่น`,
                color: 0x6B7280, // Gray
                fields,
                timestamp: now.toISOString(),
                footer: { text: 'ระบบงานอัตโนมัติประจำวัน • ระบบยืม-คืนพัสดุและครุภัณฑ์ออนไลน์' }
            }

            await sendDiscordNotification({ embeds: [embed] }, 'reservation')
        }
    } catch (err: any) {
        result.errors.push(`processExpiredReservations fatal: ${err.message}`)
    }

    return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

export async function runDailyAutomation(): Promise<DailyAutomationResult> {
    const now = new Date()
    const admin = createAdminClient()

    console.log(`[DailyAutomation] Started at ${now.toISOString()}`)

    const [overdue, dueSoon, expiredReservations] = await Promise.all([
        processOverdueLoans(admin, now),
        processDueSoonLoans(admin, now),
        processExpiredReservations(admin, now)
    ])

    const totalActions = overdue.actionTaken + dueSoon.actionTaken + expiredReservations.actionTaken
    const allErrors = [...overdue.errors, ...dueSoon.errors, ...expiredReservations.errors]
    const success = allErrors.length === 0

    const summaryMessage = `รันงานอัตโนมัติสำเร็จ: เตือนค้างส่ง ${overdue.actionTaken} รายการ, เตือนใกล้ครบกำหนด ${dueSoon.actionTaken} รายการ, เคลียร์คิวจองหมดอายุ ${expiredReservations.actionTaken} รายการ`

    console.log(`[DailyAutomation] Finished. Actions taken: ${totalActions}, Errors: ${allErrors.length}`)

    return {
        success,
        timestamp: now.toISOString(),
        overdue,
        dueSoon,
        expiredReservations,
        summaryMessage
    }
}
