'use client'

import React, { useRef } from 'react'
import { X, Printer } from 'lucide-react'
import { SpecialLoan } from '@/lib/specialLoans'

interface Props {
    loan: SpecialLoan
    onClose: () => void
    logoUrl?: string | null
    organizationName?: string
}

export default function SpecialLoanPrint({ loan, onClose, logoUrl, organizationName = 'คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง' }: Props) {
    const printRef = useRef<HTMLDivElement>(null)

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatShortDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
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
                    body {
                        font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
                        font-size: 16pt;
                        line-height: 1.5;
                        color: #000;
                        margin: 0;
                        padding: 0;
                    }
                    .document {
                        max-width: 100%;
                    }
                    .header {
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: 15px;
                    }
                    .header-logo {
                        width: 70px;
                        flex-shrink: 0;
                    }
                    .header-logo img {
                        width: 60px;
                        height: 60px;
                        object-fit: contain;
                    }
                    .header-content {
                        flex: 1;
                        text-align: center;
                    }
                    .header-title {
                        font-size: 18pt;
                        font-weight: bold;
                        color: #1e3a5f;
                    }
                    .header-org {
                        font-size: 14pt;
                        color: #1e3a5f;
                        font-weight: bold;
                    }
                    .header-date {
                        width: 150px;
                        text-align: right;
                        flex-shrink: 0;
                    }
                    .form-row {
                        margin-bottom: 5px;
                        line-height: 1.8;
                    }
                    .dotted-line {
                        border-bottom: 1px dotted #000;
                        display: inline-block;
                        min-width: 150px;
                    }
                    .section-title {
                        text-align: center;
                        font-weight: bold;
                        margin: 15px 0 10px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 10px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 6px 8px;
                        text-align: center;
                        font-size: 14pt;
                    }
                    th {
                        background-color: #f5f5f5;
                        font-weight: bold;
                    }
                    .signature-section {
                        margin-top: 20px;
                    }
                    .signature-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }
                    .signature-box {
                        width: 48%;
                        text-align: center;
                    }
                    .signature-label {
                        margin-bottom: 3px;
                    }
                    .signature-name {
                        margin-bottom: 3px;
                    }
                    .return-section {
                        margin-top: 25px;
                        padding-top: 15px;
                        border-top: 2px solid #000;
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
                        width: 16px;
                        height: 16px;
                        border: 1px solid #000;
                        margin-right: 5px;
                        vertical-align: middle;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
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
                                    วันที่ {formatShortDate(loan.loan_date)}
                                </div>
                            </div>

                            {/* Borrower Info Form */}
                            <div className="form-row">
                                ด้วยข้าพเจ้า นาย/นาง/นางสาว <span className="dotted-line" style={{ minWidth: '200px' }}>{loan.borrower_name}</span>
                                {' '}เบอร์โทร <span className="dotted-line" style={{ minWidth: '120px' }}>{loan.borrower_phone || ''}</span>
                            </div>
                            <div className="form-row">
                                สังกัด/สาขาวิชา <span className="dotted-line" style={{ minWidth: '200px' }}></span>
                                {' '}มีความประสงค์ขอยืม <span className="dotted-line" style={{ minWidth: '200px' }}>{loan.equipment_type_name}</span>
                            </div>
                            <div className="form-row">
                                ตามรายการพัสดุและครุภัณฑ์ ตั้งแต่วันที่ <span className="dotted-line">{formatShortDate(loan.loan_date)}</span>
                                {' '}ถึงวันที่ <span className="dotted-line">{formatShortDate(loan.return_date)}</span>
                            </div>
                            <div className="form-row">
                                เพื่อใช้สำหรับ <span className="dotted-line" style={{ minWidth: '450px' }}>{loan.purpose}</span>
                            </div>

                            {/* Equipment Table */}
                            <div className="section-title">รายการพัสดุและครุภัณฑ์</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>ลำดับที่</th>
                                        <th style={{ width: '200px' }}>ชื่ออุปกรณ์</th>
                                        <th>หมายเลขครุภัณฑ์</th>
                                        <th style={{ width: '120px' }}>หมายเหตุ</th>
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
                                            <td>{loan.equipment_numbers.length + idx + 1}</td>
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
                                        <div className="signature-label">ลงชื่อ............................................ ผู้ขอยืม</div>
                                        <div className="signature-name">(..................................................)</div>
                                        <div>วันที่.............................................</div>
                                    </div>
                                    <div className="signature-box">
                                        <div className="signature-label">ลงชื่อ............................................ผู้ให้ยืม</div>
                                        <div className="signature-name">(..................................................)</div>
                                        <div>วันที่.............................................</div>
                                    </div>
                                </div>
                            </div>

                            {/* Return Section */}
                            <div className="return-section">
                                <div className="return-title">บันทึกการรับคืนพัสดุและครุภัณฑ์</div>

                                <div className="checkbox-row">
                                    ได้รับคืนพัสดุและครุภัณฑ์ เมื่อวันที่......................................
                                    {' '}<span className="checkbox"></span> ครบถ้วน/สภาพปกติ
                                    {' '}<span className="checkbox"></span> ไม่ครบ/สภาพไม่ปกติ
                                </div>

                                <div className="signature-section">
                                    <div className="signature-row">
                                        <div className="signature-box">
                                            <div className="signature-label">ลงชื่อ............................................ ผู้รับคืน</div>
                                            <div className="signature-name">(..................................................)</div>
                                            <div>วันที่.............................................</div>
                                        </div>
                                        <div className="signature-box">
                                            <div className="signature-label">ลงชื่อ............................................ผู้ส่งคืน</div>
                                            <div className="signature-name">(..................................................)</div>
                                            <div>วันที่.............................................</div>
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
