'use client'

import { useState } from 'react'
import { FileDown, Printer, Loader2 } from 'lucide-react'
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
    const [isPrinting, setIsPrinting] = useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

    // Print report using browser print dialog
    const handlePrint = () => {
        setIsPrinting(true)

        // Create printable content
        const printContent = generatePrintableHTML(data, dateRange)

        // Open new window with print content
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(printContent)
            printWindow.document.close()
            printWindow.onload = () => {
                printWindow.print()
                printWindow.onafterprint = () => {
                    printWindow.close()
                    setIsPrinting(false)
                }
            }
        } else {
            setIsPrinting(false)
            alert('กรุณาอนุญาตให้เปิด popup เพื่อพิมพ์รายงาน')
        }
    }

    // Generate PDF using @react-pdf/renderer (if available)
    const handleGeneratePDF = async () => {
        setIsGeneratingPDF(true)

        try {
            // Dynamically import @react-pdf/renderer
            const { pdf, Document, Page, Text, View, StyleSheet, Font } = await import('@react-pdf/renderer')

            // Register Thai font (optional - fallback to default if not available)
            try {
                Font.register({
                    family: 'Sarabun',
                    src: '/fonts/Sarabun-Regular.ttf'
                })
            } catch {
                console.log('Using default font')
            }

            // Create PDF document
            const styles = StyleSheet.create({
                page: {
                    padding: 40,
                    fontSize: 10,
                    fontFamily: 'Helvetica'
                },
                header: {
                    textAlign: 'center',
                    marginBottom: 20
                },
                title: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 5
                },
                subtitle: {
                    fontSize: 12,
                    color: '#666',
                    marginBottom: 5
                },
                dateRange: {
                    fontSize: 10,
                    color: '#888'
                },
                section: {
                    marginBottom: 20
                },
                sectionTitle: {
                    fontSize: 12,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#ddd',
                    paddingBottom: 5
                },
                row: {
                    flexDirection: 'row',
                    marginBottom: 5
                },
                label: {
                    width: '40%',
                    color: '#666'
                },
                value: {
                    width: '60%',
                    fontWeight: 'bold'
                },
                table: {
                    marginTop: 10
                },
                tableHeader: {
                    flexDirection: 'row',
                    backgroundColor: '#f5f5f5',
                    padding: 5,
                    fontWeight: 'bold'
                },
                tableRow: {
                    flexDirection: 'row',
                    padding: 5,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee'
                },
                tableCell: {
                    flex: 1
                },
                footer: {
                    position: 'absolute',
                    bottom: 30,
                    left: 40,
                    right: 40,
                    textAlign: 'center',
                    fontSize: 8,
                    color: '#999'
                }
            })

            const MyDocument = () => (
                <Document>
                    <Page size="A4" style={styles.page}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{REPORT_HEADER}</Text>
                            <Text style={styles.subtitle}>{ORGANIZATION}</Text>
                            <Text style={styles.dateRange}>
                                ช่วงเวลา: {formatThaiDate(dateRange.from)} - {formatThaiDate(dateRange.to)}
                            </Text>
                        </View>

                        {/* Loan Stats Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>สถิติการยืม-คืน</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>รวมทั้งหมด:</Text>
                                <Text style={styles.value}>{data?.loanStats.total ?? 0} รายการ</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>รอดำเนินการ:</Text>
                                <Text style={styles.value}>{data?.loanStats.pending ?? 0} รายการ</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>อนุมัติแล้ว:</Text>
                                <Text style={styles.value}>{data?.loanStats.approved ?? 0} รายการ</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>คืนแล้ว:</Text>
                                <Text style={styles.value}>{data?.loanStats.returned ?? 0} รายการ</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>เกินกำหนด:</Text>
                                <Text style={styles.value}>{data?.loanStats.overdue ?? 0} รายการ</Text>
                            </View>
                        </View>

                        {/* Reservation Stats Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>สถิติการจอง</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>รวมทั้งหมด:</Text>
                                <Text style={styles.value}>{data?.reservationStats.total ?? 0} รายการ</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>รอดำเนินการ:</Text>
                                <Text style={styles.value}>{data?.reservationStats.pending ?? 0} รายการ</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>เสร็จสิ้น:</Text>
                                <Text style={styles.value}>{data?.reservationStats.completed ?? 0} รายการ</Text>
                            </View>
                        </View>

                        {/* Equipment Stats Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>สถิติอุปกรณ์</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>รวมทั้งหมด:</Text>
                                <Text style={styles.value}>{data?.equipmentStats.total ?? 0} ชิ้น</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>พร้อมใช้งาน:</Text>
                                <Text style={styles.value}>{data?.equipmentStats.ready ?? 0} ชิ้น</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>ถูกยืม:</Text>
                                <Text style={styles.value}>{data?.equipmentStats.borrowed ?? 0} ชิ้น</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>ซ่อมบำรุง:</Text>
                                <Text style={styles.value}>{data?.equipmentStats.maintenance ?? 0} ชิ้น</Text>
                            </View>
                        </View>

                        {/* Footer */}
                        <Text style={styles.footer}>
                            พิมพ์เมื่อ: {formatThaiDateTime(new Date())} | {ORGANIZATION}
                        </Text>
                    </Page>
                </Document>
            )

            // Generate and download PDF
            const blob = await pdf(<MyDocument />).toBlob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `รายงานสถิติ_${formatThaiDate(new Date()).replace(/\//g, '-')}.pdf`
            link.click()
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error('PDF generation error:', error)
            // Fallback to print
            alert('ไม่สามารถสร้าง PDF ได้ กรุณาติดตั้ง @react-pdf/renderer หรือใช้ปุ่มพิมพ์แทน')
        } finally {
            setIsGeneratingPDF(false)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={handlePrint}
                disabled={isPrinting || isLoading || !data}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPrinting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Printer className="w-4 h-4" />
                )}
                พิมพ์รายงาน
            </button>

            <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF || isLoading || !data}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isGeneratingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <FileDown className="w-4 h-4" />
                )}
                ส่งออก PDF
            </button>
        </div>
    )
}

// Generate printable HTML
function generatePrintableHTML(data: ReportData | undefined, dateRange: { from: Date; to: Date }): string {
    return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>${REPORT_HEADER}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Sarabun', sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            padding: 20mm;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .logo-placeholder {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
            background: #f3f4f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 10pt;
        }
        
        .title {
            font-size: 18pt;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .subtitle {
            font-size: 14pt;
            color: #4b5563;
            margin-bottom: 10px;
        }
        
        .date-range {
            font-size: 11pt;
            color: #6b7280;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #1f2937;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 24pt;
            font-weight: bold;
            color: #2563eb;
        }
        
        .stat-label {
            font-size: 10pt;
            color: #6b7280;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        th {
            background: #f3f4f6;
            font-weight: 600;
        }
        
        .footer {
            position: fixed;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 9pt;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
        
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-placeholder">โลโก้</div>
        <div class="title">${REPORT_HEADER}</div>
        <div class="subtitle">${ORGANIZATION}</div>
        <div class="date-range">ช่วงเวลา: ${formatThaiDate(dateRange.from)} - ${formatThaiDate(dateRange.to)}</div>
    </div>
    
    <div class="section">
        <div class="section-title">📊 สรุปภาพรวม</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${data?.loanStats.total ?? 0}</div>
                <div class="stat-label">การยืมทั้งหมด</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data?.reservationStats.total ?? 0}</div>
                <div class="stat-label">การจองทั้งหมด</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data?.equipmentStats.total ?? 0}</div>
                <div class="stat-label">อุปกรณ์ทั้งหมด</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" style="color: #dc2626;">${data?.loanStats.overdue ?? 0}</div>
                <div class="stat-label">เกินกำหนด</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <div class="section-title">📋 สถิติการยืม-คืน</div>
        <table>
            <tr><td>รวมทั้งหมด</td><td><strong>${data?.loanStats.total ?? 0}</strong> รายการ</td></tr>
            <tr><td>รอดำเนินการ</td><td><strong>${data?.loanStats.pending ?? 0}</strong> รายการ</td></tr>
            <tr><td>อนุมัติแล้ว</td><td><strong>${data?.loanStats.approved ?? 0}</strong> รายการ</td></tr>
            <tr><td>คืนแล้ว</td><td><strong>${data?.loanStats.returned ?? 0}</strong> รายการ</td></tr>
            <tr><td>ปฏิเสธ</td><td><strong>${data?.loanStats.rejected ?? 0}</strong> รายการ</td></tr>
            <tr><td>เกินกำหนด</td><td><strong style="color: #dc2626;">${data?.loanStats.overdue ?? 0}</strong> รายการ</td></tr>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">📅 สถิติการจอง</div>
        <table>
            <tr><td>รวมทั้งหมด</td><td><strong>${data?.reservationStats.total ?? 0}</strong> รายการ</td></tr>
            <tr><td>รอดำเนินการ</td><td><strong>${data?.reservationStats.pending ?? 0}</strong> รายการ</td></tr>
            <tr><td>อนุมัติแล้ว</td><td><strong>${data?.reservationStats.approved ?? 0}</strong> รายการ</td></tr>
            <tr><td>เสร็จสิ้น</td><td><strong>${data?.reservationStats.completed ?? 0}</strong> รายการ</td></tr>
            <tr><td>ยกเลิก</td><td><strong>${data?.reservationStats.cancelled ?? 0}</strong> รายการ</td></tr>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">📦 สถิติอุปกรณ์</div>
        <table>
            <tr><td>รวมทั้งหมด</td><td><strong>${data?.equipmentStats.total ?? 0}</strong> ชิ้น</td></tr>
            <tr><td>พร้อมใช้งาน</td><td><strong style="color: #16a34a;">${data?.equipmentStats.ready ?? 0}</strong> ชิ้น</td></tr>
            <tr><td>ถูกยืม</td><td><strong style="color: #8b5cf6;">${data?.equipmentStats.borrowed ?? 0}</strong> ชิ้น</td></tr>
            <tr><td>ซ่อมบำรุง</td><td><strong style="color: #f97316;">${data?.equipmentStats.maintenance ?? 0}</strong> ชิ้น</td></tr>
        </table>
    </div>
    
    ${data?.popularEquipment && data.popularEquipment.length > 0 ? `
    <div class="section">
        <div class="section-title">🏆 อุปกรณ์ยอดนิยม (Top 5)</div>
        <table>
            <thead>
                <tr>
                    <th>อันดับ</th>
                    <th>ชื่ออุปกรณ์</th>
                    <th>รหัส</th>
                    <th>จำนวนครั้งที่ใช้</th>
                </tr>
            </thead>
            <tbody>
                ${data.popularEquipment.slice(0, 5).map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.name}</td>
                        <td>${item.equipment_number}</td>
                        <td><strong>${item.total_usage}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}
    
    <div class="footer">
        พิมพ์เมื่อ: ${formatThaiDateTime(new Date())} | ${ORGANIZATION}
    </div>
</body>
</html>
    `
}
