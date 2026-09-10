'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Printer, CheckSquare, Square, Filter, Loader2, Sparkles, SlidersHorizontal, Search, X, Tag, FileText, Info } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { getAllEquipmentForQrPrint } from '../actions'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'

export default function EquipmentQrPrintPage() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [selectedType, setSelectedType] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [stickerSize, setStickerSize] = useState<'compact' | 'standard'>('compact')
    const [originUrl, setOriginUrl] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOriginUrl(window.location.origin)
        }
    }, [])

    // Fetch equipment types for filter
    const { data: equipmentTypes = [] } = useQuery({
        queryKey: ['equipment-types'],
        staleTime: 60000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data } = await client.from('equipment_types').select('id, name, icon').order('name')
            return data || []
        }
    })

    // Fetch all equipment for printing
    const { data: equipmentList = [], isLoading } = useQuery({
        queryKey: ['equipment-for-qr', selectedType, selectedStatus],
        staleTime: 30000,
        queryFn: async () => {
            const res = await getAllEquipmentForQrPrint({
                type: selectedType,
                status: selectedStatus
            })
            if ('error' in res) throw new Error(res.error)
            return res.data || []
        }
    })

    // Auto-select all when equipment list is loaded
    useEffect(() => {
        if (equipmentList.length > 0) {
            setSelectedIds(new Set(equipmentList.map(e => e.id)))
        }
    }, [equipmentList])

    // Filter equipment list by search keyword
    const filteredEquipment = useMemo(() => {
        if (!searchQuery.trim()) return equipmentList
        const query = searchQuery.toLowerCase().trim()
        return equipmentList.filter((eq: any) => {
            const nameMatch = eq.name?.toLowerCase().includes(query)
            const numberMatch = eq.equipment_number?.toLowerCase().includes(query)
            return Boolean(nameMatch || numberMatch)
        })
    }, [equipmentList, searchQuery])

    // Currently selected equipment list (for printing and badge count)
    const selectedEquipment = useMemo(() => {
        return equipmentList.filter(e => selectedIds.has(e.id))
    }, [equipmentList, selectedIds])

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const selectAllFiltered = () => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            filteredEquipment.forEach(e => next.add(e.id))
            return next
        })
    }

    const clearAllFiltered = () => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            filteredEquipment.forEach(e => next.delete(e.id))
            return next
        })
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div id="print-page-wrapper" className="space-y-6 max-w-6xl mx-auto pb-16 print:max-w-none print:m-0 print:p-0 print:space-y-0">
            {/* Screen Header (Hidden on print) */}
            <div className="print:hidden">
                <div className="flex items-center gap-2 mb-4">
                    <Link
                        href="/admin/equipment"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-xs transition-all hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>กลับหน้ารายการอุปกรณ์</span>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span>🖨️ พิมพ์สติกเกอร์ QR Code ประจำอุปกรณ์</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            สร้างสติกเกอร์ QR Code พร้อมรหัสครุภัณฑ์ ออกแบบให้พอดีกับกระดาษ A4 มาตรฐาน
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={selectedEquipment.length === 0}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-sm disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4" />
                        <span>สั่งพิมพ์สติกเกอร์ ({selectedEquipment.length} ชิ้น)</span>
                    </button>
                </div>

                {/* Filter and Print Settings Toolbar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                ค้นหาอุปกรณ์
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ชื่ออุปกรณ์, รหัสครุภัณฑ์..."
                                    className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl pl-9 pr-8 py-2 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Equipment Type Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                ประเภทอุปกรณ์
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="all">ทุกประเภท ({equipmentTypes.length})</option>
                                {equipmentTypes.map((t: any) => (
                                    <option key={t.id} value={t.id}>
                                        {t.icon || '📦'} {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                สถานะอุปกรณ์
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="all">ทุกสถานะ</option>
                                <option value="ready">พร้อมใช้งาน (ready)</option>
                                <option value="borrowed">ถูกยืม (borrowed)</option>
                                <option value="reserved">ถูกจอง (reserved)</option>
                                <option value="maintenance">ซ่อมบำรุง (maintenance)</option>
                            </select>
                        </div>

                        {/* Sticker Size Layout Toggle */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                รูปแบบขนาดสติกเกอร์
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                                <button
                                    type="button"
                                    onClick={() => setStickerSize('compact')}
                                    className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                                        stickerSize === 'compact'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    กะทัดรัด (A4: 3 คอลัมน์)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStickerSize('standard')}
                                    className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                                        stickerSize === 'standard'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    มาตรฐาน (A4: 2 คอลัมน์, QR ใหญ่)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* A4 Paper Specification & Helper banner */}
                    <div className="text-xs text-gray-600 bg-indigo-50/70 border border-indigo-100 px-3.5 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>
                                {stickerSize === 'compact' ? (
                                    <>
                                        <strong>แบบกะทัดรัดสำหรับ A4:</strong> จัดวาง 3 คอลัมน์ x 8 แถว (~24 ดวง/แผ่น A4) พอดีขอบกระดาษ มีเฉพาะ QR, รหัส และชื่ออุปกรณ์
                                    </>
                                ) : (
                                    <>
                                        <strong>แบบมาตรฐานสำหรับ A4:</strong> จัดวาง 2 คอลัมน์ (~10-12 ดวง/แผ่น A4) QR Code ขนาดใหญ่พิเศษ ชัดเจน สแกนติดง่าย มีเฉพาะ QR, รหัส และชื่ออุปกรณ์
                                    </>
                                )}
                            </span>
                        </div>
                        <span className="text-[11px] text-indigo-700 font-medium whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-indigo-200/60 shadow-2xs self-start sm:self-auto">
                            📄 รองรับ A4 แนวตั้ง (Portrait)
                        </span>
                    </div>

                    {/* Selection Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-600 gap-2">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={selectAllFiltered}
                                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
                            >
                                เลือกทั้งหมด{searchQuery ? 'ในผลค้นหา' : ''} ({filteredEquipment.length})
                            </button>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={clearAllFiltered}
                                className="text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                            >
                                ล้างการเลือก
                            </button>
                        </div>
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                            <span>
                                เลือกพิมพ์ {selectedEquipment.length} จากทั้งหมด {equipmentList.length} ชิ้น
                            </span>
                            {searchQuery && (
                                <span className="text-gray-400 text-[11px]">
                                    (พบ {filteredEquipment.length} รายการที่ตรงกับการค้นหา)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Printable Stickers Grid Container */}
            {isLoading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-gray-500">กำลังโหลดรายการอุปกรณ์...</p>
                </div>
            ) : filteredEquipment.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">
                    <p className="text-sm">
                        {searchQuery ? 'ไม่พบอุปกรณ์ที่ตรงกับการค้นหา' : 'ไม่มีอุปกรณ์ในหมวดหมู่ที่เลือก'}
                    </p>
                </div>
            ) : (
                <div
                    id="printable-stickers-grid"
                    className={`grid gap-3 sm:gap-4 print:gap-2 ${
                        stickerSize === 'compact'
                            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 grid-compact'
                            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 grid-standard'
                    }`}
                >
                    {filteredEquipment.map((eq: any) => {
                        const isSelected = selectedIds.has(eq.id)
                        // Short URL reduces payload by 20+ chars, dropping QR matrix density for ultra-fast mobile camera scans
                        const targetUrl = `${originUrl || 'https://notebook-system.app'}/eq/${eq.id}`
                        // Remove leading '#' symbol and whitespace from equipment number
                        const formattedEquipmentNumber = (eq.equipment_number || '').replace(/^#+/, '').trim() || '-'

                        // Compact Layout (Optimized for A4: 3 columns x 8 rows, height 33mm)
                        if (stickerSize === 'compact') {
                            return (
                                <div
                                    key={eq.id}
                                    onClick={() => toggleSelect(eq.id)}
                                    className={`
                                        sticker-card sticker-card-compact relative bg-white rounded-xl p-3 border transition-all cursor-pointer select-none
                                        break-inside-avoid print:break-inside-avoid print:cursor-default
                                        ${isSelected
                                            ? 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-xs print:ring-0 print:shadow-none'
                                            : 'border-dashed border-gray-300 opacity-45 hover:opacity-75 print:hidden'
                                        }
                                    `}
                                    style={{ pageBreakInside: 'avoid' }}
                                >
                                    {/* Screen Selection Checkbox */}
                                    <div className="absolute top-2 right-2 print:hidden z-10">
                                        {isSelected ? (
                                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                            <Square className="w-4 h-4 text-gray-300" />
                                        )}
                                    </div>

                                    {/* Compact Layout: Strictly QR CODE + รหัสครุภัณฑ์ + ชื่ออุปกรณ์ */}
                                    <div className="flex items-center gap-2.5 h-full pr-3 print:pr-0">
                                        {/* 1. High Resolution QR Code (Optimized for Instant Mobile Scanning) */}
                                        <div className="qr-code-box p-0.5 bg-white rounded-lg border border-gray-200 print:border-black shrink-0 flex items-center justify-center shadow-2xs print:shadow-none">
                                            <QRCodeSVG
                                                value={targetUrl}
                                                size={88}
                                                level="L"
                                                includeMargin={true}
                                            />
                                        </div>

                                        {/* 2. รหัสครุภัณฑ์ & 3. ชื่ออุปกรณ์ */}
                                        <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5 text-left">
                                            <div>
                                                <span className="text-[8px] font-semibold text-gray-500 print:text-gray-700 uppercase tracking-wider block leading-none mb-0.5">
                                                    รหัสครุภัณฑ์
                                                </span>
                                                <span className="text-xs print:text-[9px] font-bold font-mono text-gray-900 print:text-black leading-tight block break-all">
                                                    {formattedEquipmentNumber}
                                                </span>
                                            </div>
                                            <div className="mt-0.5">
                                                <span className="text-[8px] font-semibold text-gray-500 print:text-gray-700 uppercase tracking-wider block leading-none mb-0.5">
                                                    ชื่ออุปกรณ์
                                                </span>
                                                <p className="text-[11px] print:text-[9.5px] font-semibold text-gray-800 print:text-black leading-tight line-clamp-2">
                                                    {eq.name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        // Standard Layout (Laptop size with header)
                        return (
                            <div
                                key={eq.id}
                                onClick={() => toggleSelect(eq.id)}
                                className={`
                                    sticker-card sticker-card-standard relative bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none
                                    break-inside-avoid print:break-inside-avoid print:cursor-default
                                    ${isSelected
                                        ? 'border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs print:ring-0 print:shadow-none'
                                        : 'border-dashed border-gray-300 opacity-45 hover:opacity-75 print:hidden'
                                    }
                                `}
                                style={{ pageBreakInside: 'avoid' }}
                            >
                                {/* Screen Selection Checkbox */}
                                <div className="absolute top-3.5 right-3.5 print:hidden z-10">
                                    {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-300" />
                                    )}
                                </div>

                                {/* Standard Layout: Strictly QR CODE + รหัสครุภัณฑ์ + ชื่ออุปกรณ์ (Large size matching compact layout) */}
                                <div className="flex items-center gap-4 h-full pr-4 print:pr-0">
                                    {/* Large High Resolution QR Code */}
                                    <div className="qr-code-box-standard p-1 bg-white rounded-xl border border-gray-200 print:border-black shrink-0 flex items-center justify-center shadow-2xs print:shadow-none">
                                        <QRCodeSVG
                                            value={targetUrl}
                                            size={136}
                                            level="L"
                                            includeMargin={true}
                                        />
                                    </div>

                                    {/* Equipment Info: รหัสครุภัณฑ์ & ชื่ออุปกรณ์ */}
                                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-2 text-left">
                                        <div>
                                            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 print:text-gray-700 uppercase tracking-wider block leading-none mb-1">
                                                รหัสครุภัณฑ์
                                            </span>
                                            <span className="text-base sm:text-lg print:text-sm font-extrabold font-mono text-gray-900 print:text-black leading-tight block break-all">
                                                {formattedEquipmentNumber}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 print:text-gray-700 uppercase tracking-wider block leading-none mb-1">
                                                ชื่ออุปกรณ์
                                            </span>
                                            <p className="text-xs sm:text-sm print:text-xs font-semibold text-gray-800 print:text-black leading-snug line-clamp-2">
                                                {eq.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Print Stylesheet Injection for A4 Paper */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 8mm 10mm 8mm;
                    }
                    html, body {
                        width: 210mm !important;
                        height: auto !important;
                        min-height: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Hide unnecessary layout and screen elements */
                    header, nav, aside, footer, .print\\:hidden {
                        display: none !important;
                    }
                    /* Reset Next.js layout containers that cause print clipping */
                    div, main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        overflow: visible !important;
                        max-width: none !important;
                        box-shadow: none !important;
                    }
                    #print-page-wrapper {
                        width: 100% !important;
                        max-width: 194mm !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                    }
                    #printable-stickers-grid {
                        display: grid !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                    }
                    #printable-stickers-grid.grid-compact {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 2.5mm !important;
                    }
                    #printable-stickers-grid.grid-standard {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 3.5mm !important;
                    }
                    .sticker-card {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                        box-sizing: border-box !important;
                        border: 0.8px dashed #555 !important;
                        border-radius: 4px !important;
                        background: white !important;
                        box-shadow: none !important;
                    }
                    .sticker-card-compact {
                        height: 33mm !important;
                        max-height: 33mm !important;
                        padding: 2.5mm 3mm !important;
                        overflow: hidden !important;
                    }
                    .sticker-card-compact .qr-code-box {
                        width: 27mm !important;
                        height: 27mm !important;
                        min-width: 27mm !important;
                    }
                    .sticker-card-compact .qr-code-box svg {
                        width: 100% !important;
                        height: 100% !important;
                    }
                    .sticker-card-standard {
                        height: 48mm !important;
                        max-height: 48mm !important;
                        padding: 3mm 4mm !important;
                        overflow: hidden !important;
                    }
                    .sticker-card-standard .qr-code-box-standard {
                        width: 41mm !important;
                        height: 41mm !important;
                        min-width: 41mm !important;
                    }
                    .sticker-card-standard .qr-code-box-standard svg {
                        width: 100% !important;
                        height: 100% !important;
                    }
                }
            `}</style>
        </div>
    )
}
