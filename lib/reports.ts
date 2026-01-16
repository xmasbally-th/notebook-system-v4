/**
 * Report Utility Functions
 * ฟังก์ชันสำหรับสร้างและ export รายงาน
 */

import { formatThaiDate, formatThaiDateTime } from './formatThaiDate'

export interface CSVExportOptions {
    filename: string
    headers: string[]
    rows: (string | number)[][]
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV({ filename, headers, rows }: CSVExportOptions): void {
    // Add BOM for UTF-8 support in Excel
    const BOM = '\uFEFF'

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma or newline
                const cellStr = String(cell)
                if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
                    return `"${cellStr.replace(/"/g, '""')}"`
                }
                return cellStr
            }).join(',')
        )
    ].join('\n')

    // Create blob and download
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${formatThaiDate(new Date()).replace(/\//g, '-')}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Export loan report to CSV
 */
export function exportLoanReportCSV(loans: any[]): void {
    exportToCSV({
        filename: 'รายงานการยืม',
        headers: ['ลำดับ', 'ผู้ยืม', 'อุปกรณ์', 'รหัสอุปกรณ์', 'วันที่ยืม', 'วันที่คืน', 'สถานะ'],
        rows: loans.map((loan, index) => [
            index + 1,
            loan.user_name || '-',
            loan.equipment_name || '-',
            loan.equipment_number || '-',
            loan.start_date ? formatThaiDate(loan.start_date) : '-',
            loan.end_date ? formatThaiDate(loan.end_date) : '-',
            getStatusLabel(loan.status)
        ])
    })
}

/**
 * Export overdue report to CSV
 */
export function exportOverdueReportCSV(overdueItems: any[]): void {
    exportToCSV({
        filename: 'รายงานเกินกำหนด',
        headers: ['ลำดับ', 'ผู้ยืม', 'อีเมล', 'อุปกรณ์', 'รหัสอุปกรณ์', 'วันครบกำหนด', 'เกินกำหนด (วัน)'],
        rows: overdueItems.map((item, index) => [
            index + 1,
            item.user_name,
            item.user_email,
            item.equipment_name,
            item.equipment_number,
            formatThaiDate(item.end_date),
            item.days_overdue
        ])
    })
}

/**
 * Export popular equipment report to CSV
 */
export function exportPopularEquipmentCSV(equipment: any[]): void {
    exportToCSV({
        filename: 'รายงานอุปกรณ์ยอดนิยม',
        headers: ['อันดับ', 'ชื่ออุปกรณ์', 'รหัสอุปกรณ์', 'จำนวนครั้งที่ยืม', 'จำนวนครั้งที่จอง', 'รวม'],
        rows: equipment.map((item, index) => [
            index + 1,
            item.name,
            item.equipment_number,
            item.loan_count,
            item.reservation_count,
            item.total_usage
        ])
    })
}

/**
 * Get Thai label for status
 */
export function getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
        pending: 'รอดำเนินการ',
        approved: 'อนุมัติแล้ว',
        rejected: 'ปฏิเสธ',
        returned: 'คืนแล้ว',
        ready: 'พร้อมรับ',
        completed: 'เสร็จสิ้น',
        cancelled: 'ยกเลิก',
        expired: 'หมดอายุ'
    }
    return statusMap[status] || status
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        rejected: 'bg-red-100 text-red-800',
        returned: 'bg-green-100 text-green-800',
        ready: 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-gray-100 text-gray-800',
        expired: 'bg-orange-100 text-orange-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): string {
    if (total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
}

/**
 * Get date range presets
 */
export function getDateRangePresets(): { label: string; from: Date; to: Date }[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 6)

    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 29)

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)

    return [
        { label: 'วันนี้', from: today, to: endOfToday },
        { label: '7 วันล่าสุด', from: last7Days, to: endOfToday },
        { label: '30 วันล่าสุด', from: last30Days, to: endOfToday },
        { label: 'เดือนนี้', from: thisMonthStart, to: endOfToday },
        { label: 'เดือนที่แล้ว', from: lastMonthStart, to: lastMonthEnd }
    ]
}
