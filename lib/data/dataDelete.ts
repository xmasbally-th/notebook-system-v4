/**
 * Data Delete Functions
 */

import { getSupabaseCredentials } from '../supabase-helpers'
import { DataType, DateRange, PreviewData, RATE_LIMITS, getAccessToken, getTableName } from './dataHelpers'
import { fetchExportData, ExportOptions } from './dataExport'

export interface DeleteResult {
    deleted: number
    backedUp: number
    errors: string[]
}

export interface NotificationDeleteResult {
    deleted: number
    errors: string[]
}

export async function fetchDeletePreview(
    dataType: DataType,
    dateRange: DateRange,
    statusFilter?: string[]
): Promise<PreviewData> {
    return fetchExportData({
        dataType,
        format: 'json',
        dateRange,
        statusFilter,
        includeRelated: true
    })
}

export async function softDeleteData(
    ids: string[],
    dataType: DataType
): Promise<DeleteResult> {
    const { url, key } = getSupabaseCredentials()
    const token = await getAccessToken()

    if (!url || !key || !token) {
        throw new Error('Missing credentials')
    }

    // Check rate limit
    if (ids.length > RATE_LIMITS.delete.maxRecords) {
        throw new Error(`จำนวนข้อมูลเกิน ${RATE_LIMITS.delete.maxRecords} รายการต่อครั้ง`)
    }

    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    const tableName = getTableName(dataType)
    const result: DeleteResult = { deleted: 0, backedUp: 0, errors: [] }

    // First, fetch all records to backup
    for (const id of ids) {
        try {
            // Fetch original data
            const fetchRes = await fetch(
                `${url}/rest/v1/${tableName}?id=eq.${id}`,
                { headers }
            )

            if (!fetchRes.ok) {
                result.errors.push(`ไม่สามารถดึงข้อมูล ID: ${id}`)
                continue
            }

            const [originalData] = await fetchRes.json()
            if (!originalData) {
                result.errors.push(`ไม่พบข้อมูล ID: ${id}`)
                continue
            }

            // Create backup
            const backupRes = await fetch(`${url}/rest/v1/data_backups`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                    table_name: tableName,
                    original_id: id,
                    data: originalData
                })
            })

            if (!backupRes.ok) {
                result.errors.push(`ไม่สามารถสร้าง backup สำหรับ ID: ${id}`)
                continue
            }

            result.backedUp++

            // Delete original record
            const deleteRes = await fetch(
                `${url}/rest/v1/${tableName}?id=eq.${id}`,
                { method: 'DELETE', headers }
            )

            if (deleteRes.ok) {
                result.deleted++
            } else {
                result.errors.push(`ไม่สามารถลบข้อมูล ID: ${id}`)
            }
        } catch (error) {
            result.errors.push(`Error processing ID ${id}: ${error}`)
        }
    }

    return result
}

export async function fetchNotificationsPreview(
    dateRange: DateRange,
    readStatusFilter?: string[],
    typeFilter?: string[]
): Promise<PreviewData> {
    const { url, key } = getSupabaseCredentials()
    const token = await getAccessToken()

    if (!url || !key || !token) {
        throw new Error('Missing credentials')
    }

    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    const fromDate = dateRange.from.toISOString()
    const toDate = dateRange.to.toISOString()

    let endpoint = `${url}/rest/v1/notifications?select=id,user_id,type,title,message,is_read,created_at`
    endpoint += `&created_at=gte.${fromDate}&created_at=lte.${toDate}`

    // Filter by read status
    if (readStatusFilter && readStatusFilter.length > 0) {
        if (readStatusFilter.includes('read') && !readStatusFilter.includes('unread')) {
            endpoint += '&is_read=eq.true'
        } else if (readStatusFilter.includes('unread') && !readStatusFilter.includes('read')) {
            endpoint += '&is_read=eq.false'
        }
    }

    // Filter by notification type
    if (typeFilter && typeFilter.length > 0) {
        const typeList = typeFilter.join(',')
        endpoint += `&type=in.(${typeList})`
    }

    endpoint += '&order=created_at.desc&limit=50'

    const response = await fetch(endpoint, { headers })
    if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`)
    }

    const data = await response.json()
    const records = Array.isArray(data) ? data : []

    return {
        total: records.length,
        sample: records.slice(0, 10),
        columns: records.length > 0 ? Object.keys(records[0]) : []
    }
}

export async function hardDeleteNotifications(
    ids: string[]
): Promise<NotificationDeleteResult> {
    const { url, key } = getSupabaseCredentials()
    const token = await getAccessToken()

    if (!url || !key || !token) {
        throw new Error('Missing credentials')
    }

    // Check rate limit
    if (ids.length > RATE_LIMITS.delete.maxRecords) {
        throw new Error(`จำนวนข้อมูลเกิน ${RATE_LIMITS.delete.maxRecords} รายการต่อครั้ง`)
    }

    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }

    const result: NotificationDeleteResult = { deleted: 0, errors: [] }

    // Delete each notification (no backup needed)
    for (const id of ids) {
        try {
            const deleteRes = await fetch(
                `${url}/rest/v1/notifications?id=eq.${id}`,
                { method: 'DELETE', headers }
            )

            if (deleteRes.ok) {
                result.deleted++
            } else {
                const errorText = await deleteRes.text()
                result.errors.push(`ไม่สามารถลบ ID: ${id} - ${errorText}`)
            }
        } catch (error) {
            result.errors.push(`Error deleting ID ${id}: ${error}`)
        }
    }

    return result
}
