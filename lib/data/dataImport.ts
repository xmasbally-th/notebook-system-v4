/**
 * Data Import Functions
 */

import { DataType, RATE_LIMITS } from './dataHelpers'
import { safeImportDataServer, ImportResult } from '../../app/admin/data-management/actions'

export type { ImportResult }

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
    return safeImportDataServer(data, dataType)
}
