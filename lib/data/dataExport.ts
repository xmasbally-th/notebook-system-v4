/**
 * Data Export Functions
 */

import { getSupabaseCredentials } from '../supabase-helpers'
import { formatThaiDate } from '../formatThaiDate'
import {
    DataType,
    ExportFormat,
    DateRange,
    PreviewData,
    RATE_LIMITS,
    getAccessToken,
    getTableName,
    getDataTypeLabel
} from './dataHelpers'

export interface ExportOptions {
    dataType: DataType
    format: ExportFormat
    dateRange: DateRange
    includeRelated?: boolean
    statusFilter?: string[]
}

export async function fetchExportData(options: ExportOptions): Promise<PreviewData> {
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

    const tableName = getTableName(options.dataType)
    const fromDate = options.dateRange.from.toISOString()
    const toDate = options.dateRange.to.toISOString()

    let endpoint = `${url}/rest/v1/${tableName}?select=*`

    // Add date filter
    if (options.dataType !== 'equipment') {
        endpoint += `&created_at=gte.${fromDate}&created_at=lte.${toDate}`
    }

    // Add status filter if provided
    if (options.statusFilter && options.statusFilter.length > 0) {
        const statusList = options.statusFilter.join(',')
        endpoint += `&status=in.(${statusList})`
    }

    const response = await fetch(endpoint, { headers })
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
    }

    let records = await response.json()
    if (!Array.isArray(records)) records = []

    // Manually fetch related data if requested (to avoid foreign key issues)
    if (options.includeRelated && records.length > 0) {
        if (options.dataType === 'loans' || options.dataType === 'reservations') {
            // Fetch Profiles
            const userIds = Array.from(new Set(records.map((r: any) => r.user_id).filter(Boolean))) as string[]
            let profilesMap = new Map()

            if (userIds.length > 0) {
                const profilesRes = await fetch(
                    `${url}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,first_name,last_name,email`,
                    { headers }
                )
                if (profilesRes.ok) {
                    const profiles = await profilesRes.json()
                    profiles.forEach((p: any) => profilesMap.set(p.id, p))
                }
            }

            // Fetch Equipment
            const equipmentIds = Array.from(new Set(records.map((r: any) => r.equipment_id).filter(Boolean))) as string[]
            let equipmentMap = new Map()

            if (equipmentIds.length > 0) {
                const equipmentRes = await fetch(
                    `${url}/rest/v1/equipment?id=in.(${equipmentIds.join(',')})&select=id,name,equipment_number`,
                    { headers }
                )
                if (equipmentRes.ok) {
                    const equipment = await equipmentRes.json()
                    equipment.forEach((e: any) => equipmentMap.set(e.id, e))
                }
            }

            // Merge Data
            records = records.map((r: any) => ({
                ...r,
                profiles: profilesMap.get(r.user_id) || null,
                equipment: equipmentMap.get(r.equipment_id) || null
            }))
        }
    }

    // Get column names from first record
    const columns = records.length > 0 ? Object.keys(records[0]) : []

    return {
        total: records.length,
        sample: records.slice(0, 10),
        columns
    }
}

export async function exportData(options: ExportOptions): Promise<Blob> {
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

    const tableName = getTableName(options.dataType)
    const fromDate = options.dateRange.from.toISOString()
    const toDate = options.dateRange.to.toISOString()

    let endpoint = `${url}/rest/v1/${tableName}?select=*`

    // Add date filter
    if (options.dataType !== 'equipment') {
        endpoint += `&created_at=gte.${fromDate}&created_at=lte.${toDate}`
    }

    // Add status filter
    if (options.statusFilter && options.statusFilter.length > 0) {
        const statusList = options.statusFilter.join(',')
        endpoint += `&status=in.(${statusList})`
    }

    const response = await fetch(endpoint, { headers })
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
    }

    let records = await response.json()
    if (!Array.isArray(records)) records = []

    // Check rate limit
    if (records.length > RATE_LIMITS.export.maxRecords) {
        throw new Error(`จำนวนข้อมูลเกิน ${RATE_LIMITS.export.maxRecords} รายการ กรุณาเลือกช่วงวันที่น้อยลง`)
    }

    // Manually fetch related data if requested
    if (options.includeRelated && records.length > 0) {
        if (options.dataType === 'loans' || options.dataType === 'reservations') {
            // Fetch Profiles
            const userIds = Array.from(new Set(records.map((r: any) => r.user_id).filter(Boolean))) as string[]
            let profilesMap = new Map()

            if (userIds.length > 0) {
                const profilesRes = await fetch(
                    `${url}/rest/v1/profiles?id=in.(${userIds.join(',')})&select=id,first_name,last_name,email`,
                    { headers }
                )
                if (profilesRes.ok) {
                    const profiles = await profilesRes.json()
                    profiles.forEach((p: any) => profilesMap.set(p.id, p))
                }
            }

            // Fetch Equipment
            const equipmentIds = Array.from(new Set(records.map((r: any) => r.equipment_id).filter(Boolean))) as string[]
            let equipmentMap = new Map()

            if (equipmentIds.length > 0) {
                const equipmentRes = await fetch(
                    `${url}/rest/v1/equipment?id=in.(${equipmentIds.join(',')})&select=id,name,equipment_number`,
                    { headers }
                )
                if (equipmentRes.ok) {
                    const equipment = await equipmentRes.json()
                    equipment.forEach((e: any) => equipmentMap.set(e.id, e))
                }
            }

            // Merge Data
            records = records.map((r: any) => ({
                ...r,
                profiles: profilesMap.get(r.user_id) || null,
                equipment: equipmentMap.get(r.equipment_id) || null
            }))
        }
    }

    if (options.format === 'json') {
        return new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' })
    }

    // CSV format
    return createCSVBlob(records, options.dataType)
}

function createCSVBlob(records: any[], dataType: DataType): Blob {
    if (records.length === 0) {
        return new Blob(['ไม่มีข้อมูล'], { type: 'text/csv;charset=utf-8;' })
    }

    const BOM = '\uFEFF'

    // Flatten nested objects for CSV
    const flattenRecord = (record: any): Record<string, string> => {
        const flat: Record<string, string> = {}
        for (const [key, value] of Object.entries(record)) {
            if (value === null || value === undefined) {
                flat[key] = ''
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                // Flatten nested object (e.g., profiles, equipment)
                for (const [nestedKey, nestedValue] of Object.entries(value as object)) {
                    flat[`${key}_${nestedKey}`] = String(nestedValue ?? '')
                }
            } else if (Array.isArray(value)) {
                flat[key] = JSON.stringify(value)
            } else {
                flat[key] = String(value)
            }
        }
        return flat
    }

    const flatRecords = records.map(flattenRecord)
    const headers = Object.keys(flatRecords[0])

    const csvContent = [
        headers.join(','),
        ...flatRecords.map(row =>
            headers.map(header => {
                const cell = row[header] || ''
                if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
                    return `"${cell.replace(/"/g, '""')}"`
                }
                return cell
            }).join(',')
        )
    ].join('\n')

    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function generateExportFilename(dataType: DataType, format: ExportFormat): string {
    const label = getDataTypeLabel(dataType)
    const date = formatThaiDate(new Date()).replace(/\//g, '-')
    return `${label}_${date}.${format}`
}
