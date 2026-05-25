/**
 * Data Export Functions
 */

import { formatThaiDate } from '../formatThaiDate'
import {
    DataType,
    ExportFormat,
    DateRange,
    PreviewData,
    RATE_LIMITS,
    getTableName,
    getDataTypeLabel
} from './dataHelpers'
import { exportSystemDataServer, ExportOptions } from '../../app/admin/data-management/actions'

export type { ExportOptions }

export async function fetchExportData(options: ExportOptions): Promise<PreviewData> {
    const res = await exportSystemDataServer(options)
    if ('error' in res && res.error) {
        throw new Error(res.error)
    }

    const records = res.records || []
    const columns = records.length > 0 ? Object.keys(records[0]) : []

    return {
        total: res.total || 0,
        sample: records.slice(0, 10),
        columns
    }
}

export async function exportData(options: ExportOptions): Promise<Blob> {
    const res = await exportSystemDataServer(options)
    if ('error' in res && res.error) {
        throw new Error(res.error)
    }

    const records = res.records || []

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
