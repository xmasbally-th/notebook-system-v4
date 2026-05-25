'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import { DataType, ExportFormat, DateRange, RATE_LIMITS, getTableName, getDataTypeLabel } from '@/lib/data/dataHelpers'
import { formatThaiDate } from '@/lib/formatThaiDate'

export interface ExportOptions {
    dataType: DataType
    format: ExportFormat
    dateRange: DateRange
    includeRelated?: boolean
    statusFilter?: string[]
}

export interface DeleteResult {
    deleted: number
    backedUp: number
    errors: string[]
}

export interface NotificationDeleteResult {
    deleted: number
    errors: string[]
}

export interface ImportResult {
    success: number
    failed: number
    errors: { row: number; field?: string; message: string }[]
}

// Helper to escape/sanitize string values (preventing XSS & CSV injection)
function sanitizeRecord(record: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {}
    for (const [key, value] of Object.entries(record)) {
        if (value === null || value === undefined) {
            clean[key] = null
        } else if (typeof value === 'string') {
            let val = value.trim()
            // 1. Prevent Stored XSS by escaping HTML tags
            val = val.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            // 2. Prevent CSV formula injection if starting with =, +, -, @, or tab/carriage-return
            if (/^[=+\-@\t\r]/.test(val)) {
                val = `'` + val
            }
            clean[key] = val
        } else {
            clean[key] = value
        }
    }
    return clean
}

/**
 * Server Action: Safe export data querying
 */
export async function exportSystemDataServer(options: ExportOptions) {
    const auth = await requireAdmin()
    if (auth.error) {
        return { error: auth.error }
    }

    const adminClient = createAdminClient()
    const tableName = getTableName(options.dataType)
    const fromDate = options.dateRange.from
    const toDate = options.dateRange.to

    let query = adminClient.from(tableName).select('*')

    // Add date filter
    if (options.dataType !== 'equipment') {
        query = query.gte('created_at', fromDate).lte('created_at', toDate)
    }

    // Add status filter (exclude evaluations)
    if (options.dataType !== 'evaluations' && options.statusFilter && options.statusFilter.length > 0) {
        query = query.in('status', options.statusFilter)
    }

    const { data: records, error } = await query
    if (error) {
        return { error: `Failed to query: ${error.message}` }
    }

    if (!records || records.length === 0) {
        return { records: [], total: 0 }
    }

    // Fetch related records if requested
    let enrichedRecords = [...records]
    if (options.includeRelated) {
        if (options.dataType === 'loans' || options.dataType === 'reservations') {
            const userIds = Array.from(new Set(records.map(r => r.user_id).filter(Boolean)))
            const equipIds = Array.from(new Set(records.map(r => r.equipment_id).filter(Boolean)))

            let profilesMap = new Map()
            let equipmentMap = new Map()

            if (userIds.length > 0) {
                const { data: profiles } = await adminClient
                    .from('profiles')
                    .select('id, first_name, last_name, email')
                    .in('id', userIds)
                profiles?.forEach(p => profilesMap.set(p.id, p))
            }

            if (equipIds.length > 0) {
                const { data: equipment } = await adminClient
                    .from('equipment')
                    .select('id, name, equipment_number')
                    .in('id', equipIds)
                equipment?.forEach(e => equipmentMap.set(e.id, e))
            }

            enrichedRecords = records.map(r => ({
                ...r,
                profiles: profilesMap.get(r.user_id) || null,
                equipment: equipmentMap.get(r.equipment_id) || null
            }))
        } else if (options.dataType === 'evaluations') {
            const userIds = Array.from(new Set(records.map(r => r.user_id).filter(Boolean)))
            const loanIds = Array.from(new Set(records.map(r => r.loan_id).filter(Boolean)))

            let profilesMap = new Map()
            let loanMap = new Map()
            let equipmentMap = new Map()

            if (userIds.length > 0) {
                const { data: profiles } = await adminClient
                    .from('profiles')
                    .select('id, first_name, last_name, email')
                    .in('id', userIds)
                profiles?.forEach(p => profilesMap.set(p.id, p))
            }

            if (loanIds.length > 0) {
                const { data: loans } = await adminClient
                    .from('loanRequests')
                    .select('id, start_date, end_date, equipment_id')
                    .in('id', loanIds)

                if (loans) {
                    loans.forEach(l => loanMap.set(l.id, l))
                    const equipIds = Array.from(new Set(loans.map(l => l.equipment_id).filter(Boolean)))
                    if (equipIds.length > 0) {
                        const { data: equipment } = await adminClient
                            .from('equipment')
                            .select('id, name, equipment_number')
                            .in('id', equipIds)
                        equipment?.forEach(e => equipmentMap.set(e.id, e))
                    }
                }
            }

            enrichedRecords = records.map(r => {
                const loan = loanMap.get(r.loan_id)
                return {
                    ...r,
                    profiles: profilesMap.get(r.user_id) || null,
                    loan: loan || null,
                    equipment: loan?.equipment_id ? (equipmentMap.get(loan.equipment_id) || null) : null
                }
            })
        }
    }

    return { records: enrichedRecords, total: enrichedRecords.length }
}

/**
 * Server Action: Safe transaction-based soft delete with backup
 */
export async function safeSoftDeleteDataServer(ids: string[], dataType: DataType): Promise<DeleteResult> {
    const auth = await requireAdmin()
    if (auth.error) {
        throw new Error(auth.error)
    }

    if (ids.length > RATE_LIMITS.delete.maxRecords) {
        throw new Error(`จำนวนข้อมูลเกิน ${RATE_LIMITS.delete.maxRecords} รายการต่อครั้ง`)
    }

    const adminClient = createAdminClient()
    const tableName = getTableName(dataType)
    const result: DeleteResult = { deleted: 0, backedUp: 0, errors: [] }

    // Run atomically on the server side
    for (const id of ids) {
        try {
            // 1. Fetch original record
            const { data: originalData, error: fetchErr } = await adminClient
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single()

            if (fetchErr || !originalData) {
                result.errors.push(`ไม่พบข้อมูล ID: ${id}`)
                continue
            }

            // 2. Insert into data_backups table
            const { error: backupErr } = await adminClient
                .from('data_backups')
                .insert({
                    table_name: tableName,
                    original_id: id,
                    data: originalData,
                    created_by: auth.user!.id // Record which admin executed the delete
                })

            if (backupErr) {
                result.errors.push(`ไม่สามารถสร้าง backup สำหรับ ID: ${id} - ${backupErr.message}`)
                continue
            }

            result.backedUp++

            // 3. Delete from original table
            const { error: deleteErr } = await adminClient
                .from(tableName)
                .delete()
                .eq('id', id)

            if (deleteErr) {
                result.errors.push(`ไม่สามารถลบข้อมูล ID: ${id} - ${deleteErr.message}`)
            } else {
                result.deleted++
            }
        } catch (err: any) {
            result.errors.push(`เกิดข้อผิดพลาดในการจัดการ ID: ${id} - ${err.message || err}`)
        }
    }

    return result
}

/**
 * Server Action: Safe notifications preview fetching
 */
export async function fetchNotificationsPreviewServer(
    dateRange: DateRange,
    readStatusFilter?: string[],
    typeFilter?: string[]
) {
    const auth = await requireAdmin()
    if (auth.error) {
        return { error: auth.error }
    }

    const adminClient = createAdminClient()
    const fromDate = dateRange.from
    const toDate = dateRange.to

    let query = adminClient.from('notifications')
        .select('id, user_id, type, title, message, is_read, created_at')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

    if (readStatusFilter && readStatusFilter.length > 0) {
        if (readStatusFilter.includes('read') && !readStatusFilter.includes('unread')) {
            query = query.eq('is_read', true)
        } else if (readStatusFilter.includes('unread') && !readStatusFilter.includes('read')) {
            query = query.eq('is_read', false)
        }
    }

    if (typeFilter && typeFilter.length > 0) {
        query = query.in('type', typeFilter)
    }

    query = query.order('created_at', { ascending: false }).limit(50)

    const { data, error } = await query
    if (error) {
        return { error: error.message }
    }

    return { records: data || [] }
}

/**
 * Server Action: Safe hard delete of notifications
 */
export async function safeHardDeleteNotificationsServer(ids: string[]): Promise<NotificationDeleteResult> {
    const auth = await requireAdmin()
    if (auth.error) {
        throw new Error(auth.error)
    }

    if (ids.length > RATE_LIMITS.delete.maxRecords) {
        throw new Error(`จำนวนข้อมูลเกิน ${RATE_LIMITS.delete.maxRecords} รายการต่อครั้ง`)
    }

    const adminClient = createAdminClient()
    const result: NotificationDeleteResult = { deleted: 0, errors: [] }

    for (const id of ids) {
        try {
            const { error } = await adminClient
                .from('notifications')
                .delete()
                .eq('id', id)

            if (error) {
                result.errors.push(`ไม่สามารถลบ ID: ${id} - ${error.message}`)
            } else {
                result.deleted++
            }
        } catch (err: any) {
            result.errors.push(`เกิดข้อผิดพลาดใน ID: ${id} - ${err.message || err}`)
        }
    }

    return result
}

/**
 * Server Action: Safe bulk import with sanitization and validation
 */
export async function safeImportDataServer(data: any[], dataType: DataType): Promise<ImportResult> {
    const auth = await requireAdmin()
    if (auth.error) {
        throw new Error(auth.error)
    }

    if (data.length > RATE_LIMITS.import.maxRecords) {
        throw new Error(`จำนวนข้อมูลเกิน ${RATE_LIMITS.import.maxRecords} รายการ`)
    }

    const adminClient = createAdminClient()
    const tableName = getTableName(dataType)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    // Required fields check
    const requiredFields: Record<DataType, string[]> = {
        loans: ['user_id', 'equipment_id', 'start_date', 'end_date'],
        reservations: ['user_id', 'equipment_id', 'start_date', 'end_date'],
        equipment: ['equipment_number', 'name'],
        notifications: ['user_id', 'type', 'title'],
        evaluations: ['loan_id', 'user_id', 'rating']
    }
    const required = requiredFields[dataType]

    // Sanitize and validate batch items
    const sanitizedBatch: any[] = []
    data.forEach((item, index) => {
        const rowNum = index + 1
        const missingFields = required.filter(field => !item[field])

        if (missingFields.length > 0) {
            result.failed++
            result.errors.push({
                row: rowNum,
                message: `แถวที่ ${rowNum}: ขาดฟิลด์บังคับ: ${missingFields.join(', ')}`
            })
            return
        }

        // Apply string validation/sanitization to prevent CSV injection / XSS
        const sanitizedItem = sanitizeRecord(item)
        sanitizedBatch.push(sanitizedItem)
    })

    if (sanitizedBatch.length === 0) {
        return result
    }

    // Process in smaller insert batches of 10
    const subBatchSize = 10
    for (let i = 0; i < sanitizedBatch.length; i += subBatchSize) {
        const subBatch = sanitizedBatch.slice(i, i + subBatchSize)
        try {
            const { error } = await adminClient
                .from(tableName)
                .insert(subBatch)

            if (error) {
                result.failed += subBatch.length
                result.errors.push({
                    row: i + 1,
                    message: `ชุดที่ ${Math.floor(i / subBatchSize) + 1} ล้มเหลว: ${error.message}`
                })
            } else {
                result.success += subBatch.length
            }
        } catch (err: any) {
            result.failed += subBatch.length
            result.errors.push({
                row: i + 1,
                message: `ข้อผิดพลาดเครือข่ายชุดที่ ${Math.floor(i / subBatchSize) + 1}: ${err.message || err}`
            })
        }
    }

    return result
}
