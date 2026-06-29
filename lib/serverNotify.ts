/**
 * lib/serverNotify.ts
 * Centralized server-side notification + activity logging utility.
 *
 * - Reads notification_settings from system_config to respect admin toggles & templates
 * - Fires Discord, WeLPRU, and Activity Log in PARALLEL via Promise.allSettled()
 * - Never throws — all failures are logged gracefully
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendDiscordNotification, sendWeLPRUNotification, type NotificationType } from './notifications'
import type { ActionType } from './staffActivityLog'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationEventKey =
    | 'loan_approved'
    | 'loan_rejected'
    | 'loan_returned'
    | 'reservation_approved'
    | 'reservation_rejected'
    | 'reservation_ready'
    | 'reservation_converted'
    | 'new_registration'
    | 'new_loan_request'
    | 'new_reservation_request'
    | 'special_loan_created'
    | 'special_loan_completed'
    | 'special_loan_cancelled'

interface EventConfig {
    discord?: boolean
    welpru?: boolean
    welpru_title?: string
    welpru_body?: string
    admin_welpru?: boolean          // send WeLPRU push to admin recipients
    admin_welpru_title?: string     // title for admin push (falls back to default)
    admin_welpru_body?: string      // body for admin push (falls back to default)
}

type NotificationSettings = Record<NotificationEventKey, EventConfig>

interface ActivityEntry {
    staffId: string
    staffRole: 'staff' | 'admin'
    actionType: ActionType
    targetType: 'loan' | 'reservation' | 'notification' | 'special_loan' | 'evaluation' | 'equipment'
    targetId: string
    targetUserId?: string | null
    isSelfAction?: boolean
    details?: Record<string, any>
}

interface NotifyAndLogParams {
    /** Event key to look up settings from notification_settings */
    eventKey?: NotificationEventKey
    /** Discord message string */
    discordMessage?: string
    /** Discord channel type */
    discordType?: NotificationType
    /** WeLPRU recipient user IDs */
    welpruUserIds?: string[]
    /** Variables to substitute in the template, e.g. { equipment: 'MacBook Pro', borrower: 'สมชาย' } */
    welpruVariables?: Record<string, string>
    /** Override template title (ignores system_config template) */
    welpruTitle?: string
    /** Override template body (ignores system_config template) */
    welpruBody?: string
    /** Deep-link URL sent with the WeLPRU push notification (opens in-app or browser) */
    welpruLink?: string
    /** Staff activity log entry */
    activity?: ActivityEntry
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Replaces {variable} placeholders in a template string.
 */
function applyTemplate(template: string, vars?: Record<string, string>): string {
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

/**
 * Fetches notification_settings from system_config using Service Role.
 * Returns empty object if unavailable — callers should treat missing keys as enabled.
 */
async function getNotificationSettings(): Promise<Partial<NotificationSettings>> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {}
    }
    try {
        const admin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const { data } = await admin
            .from('system_config')
            .select('notification_settings')
            .eq('id', 1)
            .single()
        return (data?.notification_settings as Partial<NotificationSettings>) ?? {}
    } catch {
        return {}
    }
}

/** Default admin notification messages per event */
const ADMIN_EVENT_DEFAULTS: Partial<Record<NotificationEventKey, { title: string; body: string; link: string }>> = {
    new_registration:       { title: '🔔 มีผู้สมัครสมาชิกใหม่',  body: '{name} ({user_id}) จาก{department} รออนุมัติบัญชีอยู่', link: '/admin/users' },
    new_loan_request:       { title: '📦 มีคำขอยืมอุปกรณ์ใหม่',  body: '{borrower} ขอยืม {equipment} ตั้งแต่ {start_date} ถึง {end_date}', link: '/admin/loans' },
    new_reservation_request:{ title: '📅 มีคำขอจองอุปกรณ์ใหม่',  body: '{reserver} ขอจอง {equipment} ตั้งแต่ {start_date} ถึง {end_date}', link: '/admin/reservations' },
    loan_approved:          { title: '✅ อนุมัติการยืมแล้ว',       body: '{equipment} ของ {borrower} ได้รับการอนุมัติแล้ว', link: '/admin/loans' },
    loan_rejected:          { title: '❌ ปฏิเสธคำขอยืมแล้ว',      body: 'คำขอยืม {equipment} ของ {borrower} ถูกปฏิเสธ', link: '/admin/loans' },
    loan_returned:          { title: '🔄 คืนอุปกรณ์แล้ว',          body: '{borrower} คืน {equipment} เรียบร้อยแล้ว', link: '/admin/loans' },
    reservation_approved:   { title: '✅ อนุมัติการจองแล้ว',       body: '{equipment} ของ {reserver} ได้รับการอนุมัติแล้ว', link: '/admin/reservations' },
    reservation_rejected:   { title: '❌ ปฏิเสธคำขอจองแล้ว',      body: 'คำขอจอง {equipment} ของ {reserver} ถูกปฏิเสธ', link: '/admin/reservations' },
    reservation_ready:      { title: '🟢 อุปกรณ์พร้อมให้รับแล้ว', body: '{equipment} ของ {reserver} พร้อมให้มารับที่จุดรับ', link: '/admin/reservations' },
    reservation_converted:  { title: '🔄 แปลงการจองเป็นการยืม',   body: '{reserver} รับ {equipment} เรียบร้อย (จากการจอง)', link: '/admin/loans' },
    special_loan_created:   { title: '⭐ สร้างการยืมพิเศษใหม่',   body: '{borrower} ยืม {equipment} (พิเศษ) ถึง {end_date}', link: '/admin/loans' },
    special_loan_completed: { title: '⭐ คืนการยืมพิเศษแล้ว',     body: '{borrower} คืน {equipment} (พิเศษ) เรียบร้อยแล้ว', link: '/admin/loans' },
    special_loan_cancelled: { title: '⭐ ยกเลิกการยืมพิเศษ',      body: '{borrower} ยกเลิกการยืม {equipment} (พิเศษ)', link: '/admin/loans' },
}

/**
 * Fetches admin_welpru_ids from system_config.
 * Returns empty array if unavailable.
 */
async function getAdminWelpruIds(): Promise<string[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return []
    try {
        const admin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const { data } = await admin
            .from('system_config')
            .select('admin_welpru_ids')
            .eq('id', 1)
            .single()
        return (data?.admin_welpru_ids as string[]) ?? []
    } catch {
        return []
    }
}

/**
 * Inserts a staff activity log entry using the Service Role client.
 * Must be called server-side only.
 */
export async function logActivityServer(entry: ActivityEntry): Promise<void> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('[logActivityServer] Missing Supabase credentials')
        return
    }
    try {
        const admin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        const { error } = await admin.from('staff_activity_log').insert({
            staff_id: entry.staffId,
            staff_role: entry.staffRole,
            action_type: entry.actionType,
            target_type: entry.targetType,
            target_id: entry.targetId,
            target_user_id: entry.targetUserId ?? null,
            is_self_action: entry.isSelfAction ?? false,
            details: entry.details ?? {},
        })
        if (error) {
            console.error('[logActivityServer] DB error:', error.message)
        }
    } catch (err) {
        console.error('[logActivityServer] Exception:', err)
    }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Fires Discord notification, WeLPRU push, and Activity Log in PARALLEL.
 *
 * - Respects admin toggles from notification_settings (eventKey)
 * - Uses admin-defined message templates with {variable} substitution
 * - Falls back to explicit title/body if no template found
 * - Never throws — all failures are swallowed gracefully
 *
 * @example
 * await notifyAndLog({
 *   eventKey: 'loan_approved',
 *   discordMessage: `✅ อนุมัติการยืม ${equipmentName}`,
 *   discordType: 'loan',
 *   welpruUserIds: [studentId],
 *   welpruVariables: { equipment: equipmentName },
 *   activity: { staffId, staffRole, actionType: 'approve_loan', ... }
 * })
 */
export async function notifyAndLog(params: NotifyAndLogParams): Promise<void> {
    const settings = params.eventKey ? await getNotificationSettings() : {}
    const eventCfg: EventConfig = params.eventKey ? (settings[params.eventKey] ?? { discord: true, welpru: true }) : { discord: true, welpru: true }

    const tasks: Promise<any>[] = []

    // 1. Discord
    if (params.discordMessage) {
        // If eventKey specified, respect the discord toggle; otherwise always send
        const shouldSendDiscord = params.eventKey ? (eventCfg.discord ?? true) : true
        if (shouldSendDiscord) {
            tasks.push(sendDiscordNotification(params.discordMessage, params.discordType ?? 'general'))
        }
    }

    // 2. WeLPRU
    if (params.welpruUserIds && params.welpruUserIds.length > 0) {
        const shouldSendWelpru = params.eventKey ? (eventCfg.welpru ?? true) : true
        if (shouldSendWelpru) {
            // Priority: explicit title/body > template from settings
            const title = params.welpruTitle
                ?? (eventCfg.welpru_title ? applyTemplate(eventCfg.welpru_title, params.welpruVariables) : undefined)
            const body = params.welpruBody
                ?? (eventCfg.welpru_body ? applyTemplate(eventCfg.welpru_body, params.welpruVariables) : undefined)

            if (title && body) {
                tasks.push(sendWeLPRUNotification({
                    userIds: params.welpruUserIds,
                    title,
                    body,
                    ...(params.welpruLink && { link: params.welpruLink }),
                }))
            }
        }
    }

    // 3. Admin WeLPRU — send to admin recipients if event has admin_welpru enabled
    if (params.eventKey) {
        const shouldSendAdminWelpru = eventCfg.admin_welpru ?? false
        if (shouldSendAdminWelpru) {
            const adminIds = await getAdminWelpruIds()
            if (adminIds.length > 0) {
                const defaults = params.eventKey ? ADMIN_EVENT_DEFAULTS[params.eventKey] : undefined
                const adminTitle = eventCfg.admin_welpru_title
                    ?? (defaults?.title ? applyTemplate(defaults.title, params.welpruVariables) : undefined)
                const adminBody = eventCfg.admin_welpru_body
                    ?? (defaults?.body ? applyTemplate(defaults.body, params.welpruVariables) : undefined)

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
                const adminLink = defaults?.link ? `${appUrl}${defaults.link}` : undefined

                if (adminTitle && adminBody) {
                    tasks.push(sendWeLPRUNotification({
                        userIds: adminIds,
                        title: adminTitle,
                        body: adminBody,
                        ...(adminLink && { link: adminLink }),
                    }))
                }
            }
        }
    }

    // 4. Activity Log
    if (params.activity) {
        tasks.push(logActivityServer(params.activity))
    }


    // Fire all in parallel, swallow individual failures
    const results = await Promise.allSettled(tasks)
    results.forEach((r, i) => {
        if (r.status === 'rejected') {
            console.error(`[notifyAndLog] Task ${i} failed:`, r.reason)
        }
    })
}
