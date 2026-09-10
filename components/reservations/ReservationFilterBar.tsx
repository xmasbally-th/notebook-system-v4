'use client'

import React from 'react'
import { Search, Download, X } from 'lucide-react'
import { formatThaiDate } from '@/lib/formatThaiDate'
import type { ReservationItemData } from '@/app/admin/reservations/actions'

const STATUS_LABELS: Record<string, string> = {
    all: 'ทุกสถานะ',
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    ready: 'พร้อมรับ',
    completed: 'เสร็จสิ้น',
    rejected: 'ปฏิเสธ',
    cancelled: 'ยกเลิก',
    expired: 'หมดเวลา'
}

interface ReservationFilterBarProps {
    searchTerm: string
    onSearchChange: (value: string) => void
    statusFilter: string
    onStatusChange: (status: string) => void
    isAdmin?: boolean
    exportItems?: ReservationItemData[]
}

export default function ReservationFilterBar({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    isAdmin = true,
    exportItems = []
}: ReservationFilterBarProps) {
    // ปลอดภัยตามมาตรฐาน RFC 4180 ป้องกัน CSV Injection และ Comma Shifting
    const handleExportCSV = () => {
        if (!exportItems || exportItems.length === 0) return

        const headers = [
            'ID การจอง',
            'ชื่อ-นามสกุล ผู้จอง',
            'หน่วยงาน/ภาควิชา',
            'อีเมล',
            'เบอร์โทรศัพท์',
            'ชื่ออุปกรณ์',
            'หมายเลขครุภัณฑ์',
            'วันที่รับ',
            'เวลารับ',
            'วันที่คืน',
            'เวลาคืน',
            'สถานะ',
            'เหตุผลปฏิเสธ (ถ้ามี)',
            'วันที่สร้างรายการ'
        ]

        const escapeCSV = (value: string | number | null | undefined): string => {
            if (value === null || value === undefined) return '""'
            const str = String(value)
            // แทนที่ double quotes ด้วย double-double quotes ตามมาตรฐาน RFC 4180
            return `"${str.replace(/"/g, '""')}"`
        }

        const rows = exportItems.map((r) => {
            const profile = r.profiles
            const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '-'
            const dept = Array.isArray(profile?.departments) ? profile.departments[0]?.name : profile?.departments?.name || '-'
            const equip = r.equipment
            const statusText = STATUS_LABELS[r.status] || r.status

            return [
                escapeCSV(r.id),
                escapeCSV(fullName),
                escapeCSV(dept),
                escapeCSV(profile?.email || '-'),
                escapeCSV(profile?.phone_number || '-'),
                escapeCSV(equip?.name || '-'),
                escapeCSV(equip?.equipment_number || '-'),
                escapeCSV(formatThaiDate(r.start_date)),
                escapeCSV(r.pickup_time ? r.pickup_time.slice(0, 5) : '-'),
                escapeCSV(formatThaiDate(r.end_date)),
                escapeCSV(r.return_time ? r.return_time.slice(0, 5) : '-'),
                escapeCSV(statusText),
                escapeCSV(r.rejection_reason || '-'),
                escapeCSV(formatThaiDate(r.created_at))
            ].join(',')
        })

        const csvContent = [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n')
        // เพิ่ม UTF-8 BOM (\uFEFF) เพื่อให้เปิดใน Microsoft Excel ภาษาไทยไม่เพี้ยน
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reservations_export_${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อผู้จอง, แผนก, อุปกรณ์, หรือรหัสครุภัณฑ์..."
                        className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                            title="ล้างคำค้นหา"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Status Dropdown */}
                <select
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm min-w-[140px]"
                    value={statusFilter}
                    onChange={(e) => onStatusChange(e.target.value)}
                >
                    <option value="all">ทุกสถานะ</option>
                    <option value="pending">รออนุมัติ</option>
                    <option value="approved">อนุมัติแล้ว (รอรับ)</option>
                    <option value="ready">พร้อมรับ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="rejected">ปฏิเสธ</option>
                    <option value="cancelled">ยกเลิก</option>
                    <option value="expired">หมดเวลา</option>
                </select>

                {/* CSV Export Button (Admin Only or when exportItems exist) */}
                {isAdmin && (
                    <button
                        onClick={handleExportCSV}
                        disabled={exportItems.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="ส่งออกรายการทั้งหมดเป็น CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span>ส่งออก CSV</span>
                    </button>
                )}
            </div>
        </div>
    )
}
