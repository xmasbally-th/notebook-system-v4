'use client'

import React, { useRef } from 'react'
import { X, Printer } from 'lucide-react'
import { SpecialLoan } from '@/lib/specialLoans'

interface Props {
    loan: SpecialLoan
    onClose: () => void
}

export default function SpecialLoanPrint({ loan, onClose }: Props) {
    const printRef = useRef<HTMLDivElement>(null)

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
                        margin: 20mm;
                    }
                    body {
                        font-family: 'TH Sarabun New', 'Sarabun', sans-serif;
                        font-size: 16pt;
                        line-height: 1.6;
                        color: #000;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo-placeholder {
                        width: 80px;
                        height: 80px;
                        border: 2px dashed #ccc;
                        margin: 0 auto 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #999;
                        font-size: 12pt;
                    }
                    .title {
                        font-size: 20pt;
                        font-weight: bold;
                        margin-bottom: 20px;
                    }
                    .content {
                        text-indent: 40px;
                        margin-bottom: 20px;
                        text-align: justify;
                    }
                    .section-title {
                        font-weight: bold;
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: center;
                    }
                    th {
                        background-color: #f0f0f0;
                    }
                    .signature-section {
                        margin-top: 40px;
                    }
                    .signature-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }
                    .signature-box {
                        width: 45%;
                        text-align: center;
                    }
                    .signature-line {
                        border-bottom: 1px dotted #000;
                        margin-bottom: 5px;
                        height: 30px;
                    }
                    .return-section {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #000;
                        page-break-before: ${loan.equipment_numbers.length > 20 ? 'always' : 'auto'};
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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
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
                        className="bg-white p-8 shadow-lg mx-auto max-w-[210mm] min-h-[297mm]"
                        style={{ fontFamily: "'TH Sarabun New', sans-serif" }}
                    >
                        {/* Loan Section */}
                        <div className="header">
                            <div className="logo-placeholder">LOGO</div>
                            <div className="title">บันทึกการยืมพัสดุและครุภัณฑ์</div>
                        </div>

                        <div className="content">
                            ด้วยข้าพเจ้า {loan.borrower_name}
                            {loan.borrower_phone && ` เบอร์โทรศัพท์ ${loan.borrower_phone}`}
                            {' '}มีความประสงค์จะขอยืม {loan.equipment_type_name} จำนวน {loan.quantity} เครื่อง
                            ตั้งแต่วันที่ {formatDate(loan.loan_date)} ถึงวันที่ {formatDate(loan.return_date)}
                            เพื่อใช้สำหรับ {loan.purpose}
                        </div>

                        <div className="section-title">รายการพัสดุและครุภัณฑ์</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '60px' }}>ลำดับ</th>
                                    <th>หมายเลขครุภัณฑ์</th>
                                    <th style={{ width: '150px' }}>หมายเหตุ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loan.equipment_numbers.map((num, idx) => (
                                    <tr key={idx}>
                                        <td>{idx + 1}</td>
                                        <td>{num}</td>
                                        <td></td>
                                    </tr>
                                ))}
                                {/* Empty rows for writing */}
                                {loan.equipment_numbers.length < 5 &&
                                    Array(5 - loan.equipment_numbers.length).fill(0).map((_, idx) => (
                                        <tr key={`empty-${idx}`}>
                                            <td>{loan.equipment_numbers.length + idx + 1}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>

                        <div className="signature-section">
                            <div className="signature-row">
                                <div className="signature-box">
                                    <div className="signature-line"></div>
                                    <div>ลงชื่อ ผู้ขอยืม</div>
                                    <div style={{ marginTop: '5px' }}>วันที่ ...................</div>
                                </div>
                                <div className="signature-box">
                                    <div className="signature-line"></div>
                                    <div>ลงชื่อ ผู้ให้ยืม</div>
                                    <div style={{ marginTop: '5px' }}>วันที่ ...................</div>
                                </div>
                            </div>
                        </div>

                        {/* Return Section */}
                        <div className={`return-section ${loan.equipment_numbers.length > 20 ? 'page-break' : ''}`}>
                            <div className="title" style={{ marginBottom: '20px' }}>บันทึกการคืนพัสดุและครุภัณฑ์</div>

                            <div className="content">
                                กำหนดคืนพัสดุและครุภัณฑ์ วันที่ {formatDate(loan.return_date)}
                                {' '}ได้รับพัสดุและครุภัณฑ์ ครบถ้วนและใช้งานได้ปกติ วันที่ .......................
                            </div>

                            <div className="signature-section">
                                <div className="signature-row">
                                    <div className="signature-box">
                                        <div className="signature-line"></div>
                                        <div>ลงชื่อ ผู้ขอยืม</div>
                                        <div style={{ marginTop: '5px' }}>วันที่ ...................</div>
                                    </div>
                                    <div className="signature-box">
                                        <div className="signature-line"></div>
                                        <div>ลงชื่อ ผู้ให้ยืม</div>
                                        <div style={{ marginTop: '5px' }}>วันที่ ...................</div>
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
