'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { formatThaiDate, formatThaiDateTime } from '@/lib/formatThaiDate'
import type { ReportData } from '@/hooks/useReportData'

interface ReportPDFExportProps {
    data: ReportData | undefined
    dateRange: { from: Date; to: Date }
    isLoading?: boolean
    activeTab?: string
    buttonText?: string
    buttonClassName?: string
}

// Report header text
const REPORT_HEADER = 'รายงานสถิติการใช้งานระบบยืม-คืนวัสดุและครุภัณฑ์'
const ORGANIZATION = 'คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง'

export default function ReportPDFExport({
    data,
    dateRange,
    isLoading,
    activeTab = 'overview',
    buttonText = 'ส่งออก PDF',
    buttonClassName
}: ReportPDFExportProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleExportPDF = () => {
        if (!data) return
        setIsGenerating(true)

        const printContent = generatePrintableHTML(data, dateRange, activeTab)
        const printWindow = window.open('', '_blank')

        if (printWindow) {
            printWindow.document.write(printContent)
            printWindow.document.close()

            // Wait for fonts to load before printing
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print()
                    setIsGenerating(false)
                }, 500)
            }

            // Fallback timeout
            setTimeout(() => setIsGenerating(false), 5000)
        } else {
            setIsGenerating(false)
            alert('กรุณาอนุญาตให้เปิด popup เพื่อส่งออก PDF (เลือก "Save as PDF" ในหน้าต่างพิมพ์)')
        }
    }

    const defaultButtonClass = "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

    return (
        <button
            onClick={handleExportPDF}
            disabled={isGenerating || isLoading || !data}
            className={buttonClassName || defaultButtonClass}
        >
            {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FileDown className="w-4 h-4" />
            )}
            {buttonText}
        </button>
    )
}

// Build category breakdown from data (used only when on equipment tab)
function buildCategoryBreakdown(data: ReportData) {
    if (!data.allEquipment || !data.equipmentTypes) return []

    return data.equipmentTypes.map(type => {
        const items = data.allEquipment.filter(eq => eq.equipment_type_id === type.id)
        const total = items.length
        const ready = items.filter(e => e.status === 'ready' || e.status === 'active').length
        const borrowed = items.filter(e => e.status === 'borrowed').length
        const maintenance = items.filter(e => e.status === 'maintenance').length
        const usageRate = total > 0 ? Math.round((borrowed / total) * 100) : 0

        return { name: type.name, icon: type.icon, total, ready, borrowed, maintenance, usageRate }
    }).sort((a, b) => b.total - a.total)
}

// Generate printable HTML with full report data
function generatePrintableHTML(
    data: ReportData,
    dateRange: { from: Date; to: Date },
    activeTab: string = 'overview'
): string {
    const isMonthlyTab = activeTab === 'monthly'
    const isEquipmentTab = activeTab === 'equipment'

    const reportTitle = isMonthlyTab
        ? 'รายงานสรุปการใช้งานรายเดือน'
        : (isEquipmentTab ? 'รายงานสถิติคลังอุปกรณ์และครุภัณฑ์' : REPORT_HEADER)

    // Accurate calculation of totals according to the specified date range
    const totalLoans = data.loanStats.total ?? 0
    const totalReservations = data.reservationStats.total ?? 0
    const totalReturned = data.loanStats.returned ?? 0
    const totalMonthlyLoans = data.monthlyStats ? data.monthlyStats.reduce((sum, s) => sum + s.loans, 0) : totalLoans
    const totalMonthlyReservations = data.monthlyStats ? data.monthlyStats.reduce((sum, s) => sum + s.reservations, 0) : totalReservations
    const totalMonthlyReturned = data.monthlyStats ? data.monthlyStats.reduce((sum, s) => sum + s.returned, 0) : totalReturned
    const totalMonthlyOverdue = data.monthlyStats ? data.monthlyStats.reduce((sum, s) => sum + s.overdue, 0) : (data.loanStats.overdue ?? 0)
    const totalMonthlyUsage = totalMonthlyLoans + totalMonthlyReservations

    const categoryBreakdown = isEquipmentTab ? buildCategoryBreakdown(data) : []

    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>${reportTitle}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1f2937;
            padding: 15mm 20mm;
            background: #fff;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #1e40af;
        }
        
        .title {
            font-size: 17pt;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 3px;
        }
        
        .subtitle {
            font-size: 13pt;
            color: #4b5563;
            margin-bottom: 5px;
        }
        
        .date-range {
            font-size: 10pt;
            color: #6b7280;
            margin-top: 5px;
            font-weight: 600;
        }
        
        .section {
            margin-bottom: 22px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: 700;
            color: #1e3a5f;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 12px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .stat-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            background: #f9fafb;
        }
        
        .stat-value {
            font-size: 20pt;
            font-weight: 700;
            color: #2563eb;
            line-height: 1.2;
        }
        
        .stat-label {
            font-size: 9pt;
            color: #6b7280;
            margin-top: 3px;
        }
        
        .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 10pt;
        }
        
        th, td {
            padding: 7px 10px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
            font-size: 9pt;
        }
        
        tfoot td {
            background: #f8fafc;
            font-weight: 700;
            border-top: 2px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-bold { font-weight: 600; }
        .text-red { color: #dc2626; }
        .text-green { color: #16a34a; }
        .text-blue { color: #2563eb; }
        .text-orange { color: #ea580c; }
        .text-purple { color: #7c3aed; }
        .text-gray { color: #6b7280; }
        
        .rank-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #f3f4f6;
            font-size: 8.5pt;
            font-weight: 700;
            color: #374151;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9pt;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
        
        @media print {
            body { padding: 10mm 15mm; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${reportTitle}</div>
        <div class="subtitle">${ORGANIZATION}</div>
        <div class="date-range">ช่วงเวลา: ${formatThaiDate(dateRange.from)} - ${formatThaiDate(dateRange.to)}</div>
    </div>
    
    <!-- Overview Stats for Date Range -->
    <div class="section">
        <div class="section-title">📊 สรุปภาพรวมตามช่วงเวลาที่กำหนด</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value text-blue">${totalLoans.toLocaleString()}</div>
                <div class="stat-label">การยืมทั้งหมด (ครั้ง)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-purple">${totalReservations.toLocaleString()}</div>
                <div class="stat-label">การจองทั้งหมด (ครั้ง)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-green">${totalReturned.toLocaleString()}</div>
                <div class="stat-label">คืนแล้ว (ครั้ง)</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-red">${totalMonthlyOverdue.toLocaleString()}</div>
                <div class="stat-label">เกินกำหนด/คืนสาย (ครั้ง)</div>
            </div>
        </div>
    </div>
    
    <!-- Loan & Reservation Stats (side by side) -->
    <div class="section two-col">
        <div>
            <div class="section-title">📋 สถิติการยืม-คืน</div>
            <table>
                <tr><td>รวมทั้งหมด</td><td class="text-right text-bold">${data.loanStats.total ?? 0} รายการ</td></tr>
                <tr><td>รอดำเนินการ</td><td class="text-right text-bold">${data.loanStats.pending ?? 0} รายการ</td></tr>
                <tr><td>อนุมัติแล้ว (กำลังยืม)</td><td class="text-right text-bold text-blue">${data.loanStats.approved ?? 0} รายการ</td></tr>
                <tr><td>คืนแล้ว</td><td class="text-right text-bold text-green">${data.loanStats.returned ?? 0} รายการ</td></tr>
                <tr><td>ปฏิเสธ</td><td class="text-right text-bold text-gray">${data.loanStats.rejected ?? 0} รายการ</td></tr>
                <tr><td>เกินกำหนด (ยังไม่คืน)</td><td class="text-right text-bold text-red">${data.loanStats.overdue ?? 0} รายการ</td></tr>
            </table>
        </div>
        <div>
            <div class="section-title">📅 สถิติการจอง</div>
            <table>
                <tr><td>รวมทั้งหมด</td><td class="text-right text-bold">${data.reservationStats.total ?? 0} รายการ</td></tr>
                <tr><td>รอดำเนินการ</td><td class="text-right text-bold">${data.reservationStats.pending ?? 0} รายการ</td></tr>
                <tr><td>อนุมัติแล้ว</td><td class="text-right text-bold text-blue">${data.reservationStats.approved ?? 0} รายการ</td></tr>
                <tr><td>เสร็จสิ้น</td><td class="text-right text-bold text-green">${data.reservationStats.completed ?? 0} รายการ</td></tr>
                <tr><td>ยกเลิก</td><td class="text-right text-bold text-gray">${data.reservationStats.cancelled ?? 0} รายการ</td></tr>
                <tr><td>ปฏิเสธ</td><td class="text-right text-bold text-red">${data.reservationStats.rejected ?? 0} รายการ</td></tr>
            </table>
        </div>
    </div>
    
    <!-- Monthly Stats Summary with Total Footer -->
    <div class="section">
        <div class="section-title">📅 สรุปการใช้งานรายเดือน</div>
        <table>
            <thead>
                <tr>
                    <th>เดือน</th>
                    <th class="text-center">การยืม (ครั้ง)</th>
                    <th class="text-center">การจอง (ครั้ง)</th>
                    <th class="text-center">คืนแล้ว (ครั้ง)</th>
                    <th class="text-center">เกินกำหนด/คืนสาย (ครั้ง)</th>
                    <th class="text-center">รวมการใช้งาน (ครั้ง)</th>
                </tr>
            </thead>
            <tbody>
                ${!data.monthlyStats || data.monthlyStats.length === 0 ? `
                    <tr>
                        <td colspan="6" class="text-center text-gray" style="padding: 16px;">ไม่มีข้อมูลการใช้งานในช่วงเวลานี้</td>
                    </tr>
                ` : data.monthlyStats.map(stat => `
                    <tr>
                        <td class="text-bold">${stat.month}</td>
                        <td class="text-center text-blue">${stat.loans.toLocaleString()}</td>
                        <td class="text-center text-purple">${stat.reservations.toLocaleString()}</td>
                        <td class="text-center text-green">${stat.returned.toLocaleString()}</td>
                        <td class="text-center text-red">${stat.overdue.toLocaleString()}</td>
                        <td class="text-center text-bold">${(stat.loans + stat.reservations).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
            ${data.monthlyStats && data.monthlyStats.length > 0 ? `
            <tfoot>
                <tr>
                    <td>รวมทั้งหมด</td>
                    <td class="text-center text-blue">${totalMonthlyLoans.toLocaleString()}</td>
                    <td class="text-center text-purple">${totalMonthlyReservations.toLocaleString()}</td>
                    <td class="text-center text-green">${totalMonthlyReturned.toLocaleString()}</td>
                    <td class="text-center text-red">${totalMonthlyOverdue.toLocaleString()}</td>
                    <td class="text-center text-bold">${totalMonthlyUsage.toLocaleString()}</td>
                </tr>
            </tfoot>
            ` : ''}
        </table>
    </div>

    <!-- Popular Equipment (Top 5) -->
    ${data.popularEquipment && data.popularEquipment.length > 0 ? `
    <div class="section">
        <div class="section-title">🏆 5 อันดับอุปกรณ์ยอดนิยมที่มีการใช้งานสูงสุด</div>
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width: 50px;">อันดับ</th>
                    <th>ชื่ออุปกรณ์</th>
                    <th>รหัสอุปกรณ์</th>
                    <th class="text-center">การยืม (ครั้ง)</th>
                    <th class="text-center">การจอง (ครั้ง)</th>
                    <th class="text-center">รวมใช้งาน (ครั้ง)</th>
                </tr>
            </thead>
            <tbody>
                ${data.popularEquipment.slice(0, 5).map((item, index) => `
                    <tr>
                        <td class="text-center"><span class="rank-badge">${index + 1}</span></td>
                        <td class="text-bold">${item.name}</td>
                        <td class="text-gray">${item.equipment_number}</td>
                        <td class="text-center text-blue">${item.loan_count.toLocaleString()}</td>
                        <td class="text-center text-purple">${item.reservation_count.toLocaleString()}</td>
                        <td class="text-center text-bold">${item.total_usage.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <!-- Usage by Department with Total Footer -->
    ${data.departmentStats && data.departmentStats.filter(d => d.total > 0).length > 0 ? `
    <div class="section">
        <div class="section-title">👥 สรุปการใช้งานแยกตามสาขาวิชา/หน่วยงาน</div>
        <table>
            <thead>
                <tr>
                    <th class="text-center" style="width: 50px;">อันดับ</th>
                    <th>หน่วยงาน/สาขาวิชา</th>
                    <th class="text-center">การยืม (ครั้ง)</th>
                    <th class="text-center">การจอง (ครั้ง)</th>
                    <th class="text-center">รวมทั้งหมด (ครั้ง)</th>
                </tr>
            </thead>
            <tbody>
                ${data.departmentStats.filter(d => d.total > 0).map((item, index) => `
                    <tr>
                        <td class="text-center"><span class="rank-badge">${index + 1}</span></td>
                        <td class="text-bold">${item.department}</td>
                        <td class="text-center text-blue">${item.loans.toLocaleString()}</td>
                        <td class="text-center text-purple">${item.reservations.toLocaleString()}</td>
                        <td class="text-center text-bold">${item.total.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2" class="text-center">รวมทั้งหมด</td>
                    <td class="text-center text-blue">${data.departmentStats.reduce((s, d) => s + d.loans, 0).toLocaleString()}</td>
                    <td class="text-center text-purple">${data.departmentStats.reduce((s, d) => s + d.reservations, 0).toLocaleString()}</td>
                    <td class="text-center text-bold">${data.departmentStats.reduce((s, d) => s + d.total, 0).toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>
    </div>
    ` : ''}
    
    <!-- Overdue Items (Filtered within Date Range) -->
    ${data.overdueItems && data.overdueItems.length > 0 ? `
    <div class="section">
        <div class="section-title">⚠️ รายการเกินกำหนดคืน (${data.overdueItems.length} รายการ)</div>
        <table>
            <thead>
                <tr>
                    <th>ผู้ยืม</th>
                    <th>อุปกรณ์</th>
                    <th>รหัสอุปกรณ์</th>
                    <th class="text-center">กำหนดคืน</th>
                    <th class="text-center">เกินกำหนด</th>
                </tr>
            </thead>
            <tbody>
                ${data.overdueItems.slice(0, 15).map(item => `
                    <tr>
                        <td class="text-bold">${item.user_name}</td>
                        <td>${item.equipment_name}</td>
                        <td class="text-gray">${item.equipment_number}</td>
                        <td class="text-center">${formatThaiDate(new Date(item.end_date))}</td>
                        <td class="text-center text-red text-bold">${item.days_overdue} วัน</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${!isMonthlyTab && isEquipmentTab && categoryBreakdown.length > 0 ? `
    <!-- Equipment Category Breakdown (Only on Equipment Tab) -->
    <div class="section">
        <div class="section-title">📂 สรุปอุปกรณ์ตามประเภท</div>
        <table>
            <thead>
                <tr>
                    <th>ประเภท</th>
                    <th class="text-center">ทั้งหมด</th>
                    <th class="text-center">พร้อมใช้</th>
                    <th class="text-center">ถูกยืม</th>
                    <th class="text-center">ซ่อมบำรุง</th>
                    <th class="text-center">อัตราใช้งาน</th>
                </tr>
            </thead>
            <tbody>
                ${categoryBreakdown.map(cat => `
                    <tr>
                        <td>${cat.icon} ${cat.name}</td>
                        <td class="text-center text-bold">${cat.total}</td>
                        <td class="text-center text-green">${cat.ready}</td>
                        <td class="text-center text-blue">${cat.borrowed}</td>
                        <td class="text-center text-orange">${cat.maintenance}</td>
                        <td class="text-center text-bold">${cat.usageRate}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        พิมพ์เมื่อ: ${formatThaiDateTime(new Date())} | ${ORGANIZATION}<br>
        <span style="font-size: 8pt; color: #d1d5db;">* เลือก "Save as PDF" หรือ "บันทึกเป็น PDF" ในหน้าต่างพิมพ์ เพื่อบันทึกเป็นไฟล์ PDF</span>
    </div>
</body>
</html>
    `
}
