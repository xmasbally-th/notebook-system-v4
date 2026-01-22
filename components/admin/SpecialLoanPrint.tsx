'use client'

import React, { useRef, useState } from 'react'
import { X, Printer, Download, Loader2 } from 'lucide-react'
import { SpecialLoan } from '@/lib/specialLoans'

interface Props {
    loan: SpecialLoan
    onClose: () => void
    logoUrl?: string | null
    organizationName?: string
    templateUrl?: string | null
}

export default function SpecialLoanPrint({ loan, onClose, logoUrl, organizationName = 'คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง', templateUrl }: Props) {
    const printRef = useRef<HTMLDivElement>(null)
    const [isDownloading, setIsDownloading] = useState(false)

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const handlePrint = () => {
        const content = printRef.current
        if (!content) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>บันทึกการยืมพัสดุและครุภัณฑ์</title>
                <style>
                    @page {
                        size: A4;
                        margin: 15mm 20mm;
                    }
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
                        font-size: 16pt;
                        line-height: 1.4;
                        color: #000;
                    }
                    .document {
                        max-width: 100%;
                    }
                    
                    /* Header Section */
                    .header {
                        display: table;
                        width: 100%;
                        margin-bottom: 10px;
                    }
                    .header-logo {
                        display: table-cell;
                        width: 80px;
                        vertical-align: top;
                    }
                    .header-logo img {
                        width: 70px;
                        height: 70px;
                        object-fit: contain;
                    }
                    .header-content {
                        display: table-cell;
                        text-align: center;
                        vertical-align: top;
                        padding-top: 5px;
                    }
                    .header-title {
                        font-size: 20pt;
                        font-weight: bold;
                        color: #1a4a7c;
                    }
                    .header-org {
                        font-size: 16pt;
                        color: #1a4a7c;
                        font-weight: bold;
                    }
                    .header-date {
                        display: table-cell;
                        width: 150px;
                        text-align: right;
                        vertical-align: top;
                        padding-top: 40px;
                    }
                    
                    /* Form Fields */
                    .form-section {
                        margin-top: 15px;
                        line-height: 2;
                    }
                    .form-row {
                        margin-bottom: 3px;
                    }
                    .field-value {
                        border-bottom: 1px dotted #666;
                        display: inline-block;
                        min-width: 100px;
                        padding: 0 5px;
                    }
                    
                    /* Table Section */
                    .section-title {
                        text-align: center;
                        font-weight: bold;
                        margin: 15px 0 10px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 4px 8px;
                        text-align: center;
                        font-size: 14pt;
                    }
                    th {
                        background-color: #f8f8f8;
                        font-weight: bold;
                    }
                    td {
                        height: 28px;
                    }
                    
                    /* Signature Section */
                    .signature-section {
                        margin-top: 20px;
                    }
                    .signature-row {
                        display: table;
                        width: 100%;
                        margin-bottom: 15px;
                    }
                    .signature-box {
                        display: table-cell;
                        width: 50%;
                        text-align: center;
                        vertical-align: top;
                    }
                    .sig-line {
                        margin-bottom: 2px;
                    }
                    
                    /* Return Section */
                    .return-section {
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 1px solid #000;
                    }
                    .return-title {
                        text-align: center;
                        font-size: 16pt;
                        font-weight: bold;
                        margin-bottom: 15px;
                    }
                    .checkbox-row {
                        margin: 10px 0;
                    }
                    .checkbox {
                        display: inline-block;
                        width: 14px;
                        height: 14px;
                        border: 1px solid #000;
                        margin: 0 3px;
                        vertical-align: middle;
                    }
                    
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
    }

    const handleDownloadDocx = async () => {
        if (!templateUrl) {
            alert('ยังไม่มี template DOCX กรุณาอัปโหลดที่หน้า Settings ก่อน')
            return
        }

        setIsDownloading(true)
        try {
            const { generateDocxFromTemplate } = await import('@/lib/docxGenerator')
            await generateDocxFromTemplate(templateUrl, loan)
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถสร้างเอกสารได้')
        } finally {
            setIsDownloading(false)
        }
    }

    // Calculate minimum rows for table (at least 8 rows)
    const minRows = 8
    const emptyRowsCount = Math.max(0, minRows - loan.equipment_numbers.length)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">พิมพ์ใบยืม</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Printer className="w-4 h-4" />
                            พิมพ์
                        </button>
                        <button
                            onClick={handleDownloadDocx}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {isDownloading ? 'กำลังสร้าง...' : 'DOCX'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div
                        ref={printRef}
                        className="bg-white p-8 shadow-lg mx-auto max-w-[210mm]"
                        style={{ fontFamily: "'TH Sarabun New', sans-serif", fontSize: '14pt' }}
                    >
                        <div className="document">
                            {/* Header */}
                            <div className="header">
                                <div className="header-logo">
                                    {logoUrl && (
                                        <img src={logoUrl} alt="Logo" />
                                    )}
                                </div>
                                <div className="header-content">
                                    <div className="header-title">บันทึกการยืมพัสดุและครุภัณฑ์</div>
                                    <div className="header-org">{organizationName}</div>
                                </div>
                                <div className="header-date">
                                    วันที่ <span className="field-value">{formatDate(loan.loan_date)}</span>
                                </div>
                            </div>

                            {/* Borrower Info Form */}
                            <div className="form-section">
                                <div className="form-row">
                                    ด้วยข้าพเจ้า นาย/นาง/นางสาว <span className="field-value" style={{ minWidth: '180px' }}>{loan.borrower_name}</span>
                                    {' '}เบอร์โทร <span className="field-value" style={{ minWidth: '120px' }}>{loan.borrower_phone || ''}</span>
                                </div>
                                <div className="form-row">
                                    สังกัด/สาขาวิชา <span className="field-value" style={{ minWidth: '200px' }}></span>
                                    {' '}มีความประสงค์ขอยืม <span className="field-value" style={{ minWidth: '180px' }}>{loan.equipment_type_name}</span>
                                </div>
                                <div className="form-row">
                                    ตามรายการพัสดุและครุภัณฑ์ ตั้งแต่วันที่ <span className="field-value">{formatDate(loan.loan_date)}</span>
                                    {' '}ถึงวันที่ <span className="field-value">{formatDate(loan.return_date)}</span>
                                </div>
                                <div className="form-row">
                                    เพื่อใช้สำหรับ <span className="field-value" style={{ minWidth: '400px' }}>{loan.purpose}</span>
                                </div>
                            </div>

                            {/* Equipment Table */}
                            <div className="section-title">รายการพัสดุและครุภัณฑ์</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>ลำดับที่</th>
                                        <th style={{ width: '180px' }}>ชื่ออุปกรณ์</th>
                                        <th>หมายเลขครุภัณฑ์</th>
                                        <th style={{ width: '100px' }}>หมายเหตุ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loan.equipment_numbers.map((num, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td>{loan.equipment_type_name}</td>
                                            <td>{num}</td>
                                            <td></td>
                                        </tr>
                                    ))}
                                    {/* Empty rows */}
                                    {Array(emptyRowsCount).fill(0).map((_, idx) => (
                                        <tr key={`empty-${idx}`}>
                                            <td>&nbsp;</td>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Loan Signatures */}
                            <div className="signature-section">
                                <div className="signature-row">
                                    <div className="signature-box">
                                        <div className="sig-line">ลงชื่อ.............................................. ผู้ขอยืม</div>
                                        <div className="sig-line">(..................................................)</div>
                                        <div>วันที่................................................</div>
                                    </div>
                                    <div className="signature-box">
                                        <div className="sig-line">ลงชื่อ..............................................ผู้ให้ยืม</div>
                                        <div className="sig-line">(..................................................)</div>
                                        <div>วันที่................................................</div>
                                    </div>
                                </div>
                            </div>

                            {/* Return Section */}
                            <div className="return-section">
                                <div className="return-title">บันทึกการรับคืนพัสดุและครุภัณฑ์</div>

                                <div className="checkbox-row">
                                    ได้รับคืนพัสดุและครุภัณฑ์ เมื่อวันที่.........................................
                                    {' '}<span className="checkbox"></span> ครบถ้วน/สภาพปกติ
                                    {' '}<span className="checkbox"></span> ไม่ครบ/สภาพไม่ปกติ
                                </div>

                                <div className="signature-section">
                                    <div className="signature-row">
                                        <div className="signature-box">
                                            <div className="sig-line">ลงชื่อ.............................................. ผู้รับคืน</div>
                                            <div className="sig-line">(..................................................)</div>
                                            <div>วันที่................................................</div>
                                        </div>
                                        <div className="signature-box">
                                            <div className="sig-line">ลงชื่อ..............................................ผู้ส่งคืน</div>
                                            <div className="sig-line">(..................................................)</div>
                                            <div>วันที่................................................</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
