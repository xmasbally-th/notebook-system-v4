'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { formatThaiDate, formatThaiDateTime } from '@/lib/formatThaiDate'
import type { ReportData } from '@/hooks/useReportData'

interface ReportPDFExportProps {
    data: ReportData | undefined
    dateRange: { from: Date; to: Date }
    isLoading?: boolean
}

// Report header text
const REPORT_HEADER = 'รายงานสถิติการใช้งานระบบยืม-คืนวัสดุและครุภัณฑ์'
const ORGANIZATION = 'คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง'

export default function ReportPDFExport({ data, dateRange, isLoading }: ReportPDFExportProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleExportPDF = () => {
        if (!data) return
        setIsGenerating(true)

        const printContent = generatePrintableHTML(data, dateRange)
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

    return (
        <button
            onClick={handleExportPDF}
            disabled={isGenerating || isLoading || !data}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FileDown className="w-4 h-4" />
            )}
            ส่งออก PDF
        </button>
    )
}

// Build category breakdown from data
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

// Build borrowers by department
function buildBorrowersByDepartment(data: ReportData) {
    if (!data.userStats) return []
    
    const deptMap: Record<string, { borrowerCount: number, totalLoans: number }> = {}
    
    data.userStats.forEach(user => {
        const dept = user.department || 'ไม่ระบุ'
        if (!deptMap[dept]) {
            deptMap[dept] = { borrowerCount: 0, totalLoans: 0 }
        }
        if (user.loan_count > 0 || user.total_activity > 0) {
            deptMap[dept].borrowerCount++
            deptMap[dept].totalLoans += user.loan_count
        }
    })
    
    return Object.entries(deptMap)
        .map(([name, stats]) => ({
            name,
            borrowerCount: stats.borrowerCount,
            totalLoans: stats.totalLoans
        }))
        .filter(d => d.borrowerCount > 0)
        .sort((a, b) => b.borrowerCount - a.borrowerCount)
}

// Status label helper
function getStatusThaiLabel(status: string): string {
    const map: Record<string, string> = {
        ready: 'พร้อมใช้งาน',
        active: 'พร้อมใช้งาน',
        borrowed: 'ถูกใช้งาน',
        maintenance: 'ซ่อมบำรุง',
        retired: 'เลิกใช้งาน',
    }
    return map[status] || status
}

// Generate printable HTML with full report data
function generatePrintableHTML(data: ReportData, dateRange: { from: Date; to: Date }): string {
    const categoryBreakdown = buildCategoryBreakdown(data)
    const borrowersByDept = buildBorrowersByDepartment(data)

    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>${REPORT_HEADER}</title>
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
        }
        
        .section {
            margin-bottom: 22px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 13pt;
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
            font-size: 22pt;
            font-weight: 700;
            color: #2563eb;
            line-height: 1.2;
        }
        
        .stat-label {
            font-size: 9pt;
            color: #6b7280;
            margin-top: 2px;
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
        
        .category-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .category-row:last-child {
            border-bottom: none;
        }
        
        .cat-icon {
            font-size: 16pt;
            width: 30px;
            text-align: center;
        }
        
        .cat-name {
            flex: 1;
            font-weight: 600;
        }
        
        .cat-stats {
            display: flex;
            gap: 12px;
            font-size: 9pt;
        }
        
        .cat-stats span {
            display: inline-flex;
            align-items: center;
            gap: 3px;
        }
        
        .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .dot-green { background: #16a34a; }
        .dot-blue { background: #2563eb; }
        .dot-orange { background: #ea580c; }
        
        .bar-container {
            width: 80px;
            height: 10px;
            background: #e5e7eb;
            border-radius: 5px;
            overflow: hidden;
            display: inline-flex;
        }
        
        .bar-green { background: #16a34a; }
        .bar-blue { background: #2563eb; }
        .bar-orange { background: #ea580c; }
        
        .rank-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #f3f4f6;
            font-size: 9pt;
            font-weight: 600;
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
        <div class="title">${REPORT_HEADER}</div>
        <div class="subtitle">${ORGANIZATION}</div>
        <div class="date-range">ช่วงเวลา: ${formatThaiDate(dateRange.from)} - ${formatThaiDate(dateRange.to)}</div>
    </div>
    
    <!-- Overview Stats -->
    <div class="section">
        <div class="section-title">📊 สรุปภาพรวม</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value text-blue">${data.loanStats.total ?? 0}</div>
                <div class="stat-label">การยืมทั้งหมด</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-purple">${data.reservationStats.total ?? 0}</div>
                <div class="stat-label">การจองทั้งหมด</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.equipmentStats.total ?? 0}</div>
                <div class="stat-label">อุปกรณ์ทั้งหมด</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-red">${data.loanStats.overdue ?? 0}</div>
                <div class="stat-label">เกินกำหนด</div>
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
                <tr><td>อนุมัติแล้ว</td><td class="text-right text-bold">${data.loanStats.approved ?? 0} รายการ</td></tr>
                <tr><td>คืนแล้ว</td><td class="text-right text-bold text-green">${data.loanStats.returned ?? 0} รายการ</td></tr>
                <tr><td>ปฏิเสธ</td><td class="text-right text-bold">${data.loanStats.rejected ?? 0} รายการ</td></tr>
                <tr><td>เกินกำหนด</td><td class="text-right text-bold text-red">${data.loanStats.overdue ?? 0} รายการ</td></tr>
            </table>
        </div>
        <div>
            <div class="section-title">📅 สถิติการจอง</div>
            <table>
                <tr><td>รวมทั้งหมด</td><td class="text-right text-bold">${data.reservationStats.total ?? 0} รายการ</td></tr>
                <tr><td>รอดำเนินการ</td><td class="text-right text-bold">${data.reservationStats.pending ?? 0} รายการ</td></tr>
                <tr><td>อนุมัติแล้ว</td><td class="text-right text-bold">${data.reservationStats.approved ?? 0} รายการ</td></tr>
                <tr><td>เสร็จสิ้น</td><td class="text-right text-bold text-green">${data.reservationStats.completed ?? 0} รายการ</td></tr>
                <tr><td>ยกเลิก</td><td class="text-right text-bold">${data.reservationStats.cancelled ?? 0} รายการ</td></tr>
            </table>
        </div>
    </div>
    
    <!-- Equipment Stats -->
    <div class="section">
        <div class="section-title">📦 สถิติอุปกรณ์</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${data.equipmentStats.total ?? 0}</div>
                <div class="stat-label">ทั้งหมด</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-green">${data.equipmentStats.ready ?? 0}</div>
                <div class="stat-label">พร้อมใช้งาน</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-purple">${data.equipmentStats.borrowed ?? 0}</div>
                <div class="stat-label">ถูกยืม</div>
            </div>
            <div class="stat-card">
                <div class="stat-value text-orange">${data.equipmentStats.maintenance ?? 0}</div>
                <div class="stat-label">ซ่อมบำรุง</div>
            </div>
        </div>
    </div>
    
    <!-- Category Breakdown -->
    ${categoryBreakdown.length > 0 ? `
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
    
    <!-- Borrowers by Department -->
    ${borrowersByDept.length > 0 ? `
    <div class="section">
        <div class="section-title">👥 จำนวนผู้ยืมโดยแบ่งตามหน่วยงาน/สาขาวิชา</div>
        <table>
            <thead>
                <tr>
                    <th class="text-center">อันดับ</th>
                    <th>หน่วยงาน/สาขาวิชา</th>
                    <th class="text-right">จำนวนผู้ยืม (คน)</th>
                    <th class="text-right">รวมการยืม (ครั้ง)</th>
                </tr>
            </thead>
            <tbody>
                ${borrowersByDept.map((item, index) => `
                    <tr>
                        <td class="text-center"><span class="rank-badge">${index + 1}</span></td>
                        <td class="text-bold">${item.name}</td>
                        <td class="text-right text-blue text-bold">${item.borrowerCount.toLocaleString()}</td>
                        <td class="text-right">${item.totalLoans.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <!-- Overdue Items -->
    ${data.overdueItems && data.overdueItems.length > 0 ? `
    <div class="section">
        <div class="section-title">⚠️ รายการเกินกำหนดคืน (${data.overdueItems.length} รายการ)</div>
        <table>
            <thead>
                <tr>
                    <th>ผู้ยืม</th>
                    <th>อุปกรณ์</th>
                    <th class="text-center">กำหนดคืน</th>
                    <th class="text-center">เกินกำหนด</th>
                </tr>
            </thead>
            <tbody>
                ${data.overdueItems.slice(0, 10).map(item => `
                    <tr>
                        <td>${item.user_name}</td>
                        <td>${item.equipment_name}</td>
                        <td class="text-center">${formatThaiDate(new Date(item.end_date))}</td>
                        <td class="text-center text-red text-bold">${item.days_overdue} วัน</td>
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
