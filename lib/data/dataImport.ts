/**
 * Data Import Functions
 */

import { getSupabaseCredentials } from '../supabase-helpers'
import { DataType, RATE_LIMITS, getAccessToken, getTableName } from './dataHelpers'

export interface ImportResult {
    success: number
    failed: number
    errors: { row: number; field?: string; message: string }[]
}

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
        equipment: ['equipment_number', 'name'],
        notifications: ['user_id', 'type', 'title'],
        evaluations: ['loan_id', 'user_id', 'rating']
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
