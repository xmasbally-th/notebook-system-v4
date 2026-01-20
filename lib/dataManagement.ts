/**
 * Data Management Library
 * ฟังก์ชันสำหรับ Export, Import, และ Soft Delete ข้อมูล
 */

import { getSupabaseCredentials } from './supabase-helpers'
import { formatThaiDate } from './formatThaiDate'

// ============================================
// Types
// ============================================

export type DataType = 'loans' | 'reservations' | 'equipment'
export type ExportFormat = 'csv' | 'json'

export interface DateRange {
    from: Date
    to: Date
}

export interface ExportOptions {
    dataType: DataType
    format: ExportFormat
    dateRange: DateRange
    includeRelated?: boolean
    statusFilter?: string[]
}

export interface ImportResult {
    success: number
    failed: number
    errors: { row: number; field?: string; message: string }[]
}

export interface DeleteResult {
    deleted: number
    backedUp: number
    errors: string[]
}

export interface PreviewData {
    total: number
    sample: any[]
    columns: string[]
}

// Rate limits
export const RATE_LIMITS = {
    export: { maxRecords: 10000 },
    import: { maxRecords: 100, cooldownMs: 5000 },
    delete: { maxRecords: 50, cooldownMs: 10000 }
}

// ============================================
// Helper Functions
// ============================================

async function getAccessToken(): Promise<string | null> {
    try {
        const { url, key } = getSupabaseCredentials()
        if (!url || !key) return null

        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(url, key)
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
    } catch {
        return null
    }
}

function getTableName(dataType: DataType): string {
    switch (dataType) {
        case 'loans': return 'loanRequests'
        case 'reservations': return 'reservations'
        case 'equipment': return 'equipment'
    }
}

function getDataTypeLabel(dataType: DataType): string {
    switch (dataType) {
        case 'loans': return 'รายการยืม-คืน'
        case 'reservations': return 'รายการจอง'
        case 'equipment': return 'ข้อมูลอุปกรณ์'
    }
}

// ============================================
// Export Functions
// ============================================

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

    let selectQuery = '*'
    let endpoint = `${url}/rest/v1/${tableName}?`

    // Add date filter
    if (options.dataType !== 'equipment') {
        endpoint += `created_at=gte.${fromDate}&created_at=lte.${toDate}`
    }

    // Add status filter if provided
    if (options.statusFilter && options.statusFilter.length > 0) {
        const statusList = options.statusFilter.map(s => `"${s}"`).join(',')
        endpoint += `&status=in.(${statusList})`
    }

    // Include related data
    if (options.includeRelated) {
        if (options.dataType === 'loans') {
            selectQuery = '*,profiles:user_id(first_name,last_name,email),equipment:equipment_id(name,equipment_number)'
        } else if (options.dataType === 'reservations') {
            selectQuery = '*,profiles:user_id(first_name,last_name,email),equipment:equipment_id(name,equipment_number)'
        }
    }

    endpoint = endpoint.replace('*', selectQuery)

    const response = await fetch(endpoint, { headers })
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
    }

    const data = await response.json()
    const records = Array.isArray(data) ? data : []

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

    let selectQuery = '*'
    let endpoint = `${url}/rest/v1/${tableName}?`

    // Add date filter
    if (options.dataType !== 'equipment') {
        endpoint += `created_at=gte.${fromDate}&created_at=lte.${toDate}`
    }

    // Add status filter
    if (options.statusFilter && options.statusFilter.length > 0) {
        const statusList = options.statusFilter.join(',')
        endpoint += `&status=in.(${statusList})`
    }

    // Include related data
    if (options.includeRelated) {
        if (options.dataType === 'loans' || options.dataType === 'reservations') {
            selectQuery = '*,profiles:user_id(first_name,last_name,email),equipment:equipment_id(name,equipment_number)'
        }
    }

    endpoint = endpoint.replace('select=*', `select=${selectQuery}`)

    const response = await fetch(endpoint, { headers })
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
    }

    const data = await response.json()
    const records = Array.isArray(data) ? data : []

    // Check rate limit
    if (records.length > RATE_LIMITS.export.maxRecords) {
        throw new Error(`จำนวนข้อมูลเกิน ${RATE_LIMITS.export.maxRecords} รายการ กรุณาเลือกช่วงวันที่น้อยลง`)
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

// ============================================
// Import Functions
// ============================================

export async function parseImportFile(file: File): Promise<{ data: any[]; errors: string[] }> {
    const text = await file.text()
    const errors: string[] = []

    if (file.name.endsWith('.json')) {
        try {
            const data = JSON.parse(text)
            if (!Array.isArray(data)) {
                return { data: [data], errors: [] }
            }
            return { data, errors: [] }
        } catch (e) {
            return { data: [], errors: ['ไม่สามารถอ่านไฟล์ JSON ได้'] }
        }
    }

    // CSV parsing
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
        return { data: [], errors: ['ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว'] }
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const data: any[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length !== headers.length) {
            errors.push(`แถวที่ ${i + 1}: จำนวนคอลัมน์ไม่ตรงกับหัวตาราง`)
            continue
        }

        const record: Record<string, string> = {}
        headers.forEach((header, index) => {
            record[header] = values[index]
        })
        data.push(record)
    }

    return { data, errors }
}

function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    result.push(current.trim())

    return result
}

export async function validateImportData(
    data: any[],
    dataType: DataType
): Promise<{ valid: any[]; errors: { row: number; message: string }[] }> {
    const valid: any[] = []
    const errors: { row: number; message: string }[] = []

    // Check rate limit
    if (data.length > RATE_LIMITS.import.maxRecords) {
        return {
            valid: [],
            errors: [{ row: 0, message: `จำนวนข้อมูลเกิน ${RATE_LIMITS.import.maxRecords} รายการ` }]
        }
    }

    const requiredFields: Record<DataType, string[]> = {
        loans: ['user_id', 'equipment_id', 'start_date', 'end_date'],
        reservations: ['user_id', 'equipment_id', 'start_date', 'end_date'],
        equipment: ['equipment_number', 'name']
    }

    const required = requiredFields[dataType]

    data.forEach((record, index) => {
        const rowNum = index + 1
        const missingFields = required.filter(field => !record[field])

        if (missingFields.length > 0) {
            errors.push({
                row: rowNum,
                message: `ขาดฟิลด์: ${missingFields.join(', ')}`
            })
        } else {
            valid.push(record)
        }
    })

    return { valid, errors }
}

export async function importData(
    data: any[],
    dataType: DataType
): Promise<ImportResult> {
    const { url, key } = getSupabaseCredentials()
    const token = await getAccessToken()

    if (!url || !key || !token) {
        throw new Error('Missing credentials')
    }

    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    const tableName = getTableName(dataType)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    // Process in batches of 10
    const batchSize = 10
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)

        try {
            const response = await fetch(`${url}/rest/v1/${tableName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(batch)
            })

            if (response.ok) {
                result.success += batch.length
            } else {
                const errorText = await response.text()
                result.failed += batch.length
                result.errors.push({
                    row: i + 1,
                    message: `Batch failed: ${errorText}`
                })
            }
        } catch (error) {
            result.failed += batch.length
            result.errors.push({
                row: i + 1,
                message: `Network error: ${error}`
            })
        }
    }

    return result
}

// ============================================
// Soft Delete Functions
// ============================================

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

// ============================================
// Status Options
// ============================================

export function getStatusOptions(dataType: DataType): { value: string; label: string }[] {
    switch (dataType) {
        case 'loans':
            return [
                { value: 'pending', label: 'รอดำเนินการ' },
                { value: 'approved', label: 'อนุมัติแล้ว' },
                { value: 'rejected', label: 'ปฏิเสธ' },
                { value: 'returned', label: 'คืนแล้ว' }
            ]
        case 'reservations':
            return [
                { value: 'pending', label: 'รอดำเนินการ' },
                { value: 'approved', label: 'อนุมัติแล้ว' },
                { value: 'ready', label: 'พร้อมรับ' },
                { value: 'completed', label: 'เสร็จสิ้น' },
                { value: 'cancelled', label: 'ยกเลิก' },
                { value: 'rejected', label: 'ปฏิเสธ' },
                { value: 'expired', label: 'หมดอายุ' }
            ]
        case 'equipment':
            return [
                { value: 'ready', label: 'พร้อมใช้งาน' },
                { value: 'active', label: 'ใช้งานได้' },
                { value: 'borrowed', label: 'ถูกยืม' },
                { value: 'maintenance', label: 'ซ่อมบำรุง' },
                { value: 'retired', label: 'ปลดระวาง' }
            ]
    }
}
