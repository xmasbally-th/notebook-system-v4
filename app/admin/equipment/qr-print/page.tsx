'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, Printer, CheckSquare, Square, Filter, Loader2, Sparkles, SlidersHorizontal } from 'lucide-react'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { getAllEquipmentForQrPrint } from '../actions'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'

export default function EquipmentQrPrintPage() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [selectedType, setSelectedType] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [stickerSize, setStickerSize] = useState<'standard' | 'compact'>('standard')
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

    // Auto-select all when loaded
    useEffect(() => {
        if (equipmentList.length > 0) {
            setSelectedIds(new Set(equipmentList.map(e => e.id)))
        }
    }, [equipmentList])

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const selectAll = () => {
        setSelectedIds(new Set(equipmentList.map(e => e.id)))
    }

    const clearAll = () => {
        setSelectedIds(new Set())
    }

    const handlePrint = () => {
        window.print()
    }

    const selectedEquipment = useMemo(() => {
        return equipmentList.filter(e => selectedIds.has(e.id))
    }, [equipmentList, selectedIds])

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-16">
            {/* Screen Header (Hidden on print) */}
            <div className="print:hidden">
                <div className="flex items-center gap-2 mb-4">
                    <Link
                        href="/admin/equipment"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>กลับหน้ารายการอุปกรณ์</span>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span>🖨️ พิมพ์สติกเกอร์ QR Code ประจำอุปกรณ์</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            สร้างสติกเกอร์ QR Code พร้อมเลขครุภัณฑ์ สำหรับพิมพ์ติดบนตัวเครื่องโน้ตบุ๊ค
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={selectedEquipment.length === 0}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-sm disabled:opacity-50 disabled:bg-gray-400"
                    >
                        <Printer className="w-4 h-4" />
                        <span>สั่งพิมพ์สติกเกอร์ ({selectedEquipment.length} ชิ้น)</span>
                    </button>
                </div>

                {/* Filter and Print Settings Toolbar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Equipment Type Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                ประเภทอุปกรณ์
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50"
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
                                className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50"
                            >
                                <option value="all">ทุกสถานะ</option>
                                <option value="ready">พร้อมใช้งาน (ready)</option>
                                <option value="borrowed">ถูกยืม (borrowed)</option>
                                <option value="reserved">ถูกจอง (reserved)</option>
                                <option value="maintenance">ซ่อมบำรุง (maintenance)</option>
                            </select>
                        </div>

                        {/* Sticker Size Layout */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                รูปแบบขนาดสติกเกอร์
                            </label>
                            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                                <button
                                    type="button"
                                    onClick={() => setStickerSize('standard')}
                                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                        stickerSize === 'standard'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    มาตรฐาน (โน้ตบุ๊ค)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStickerSize('compact')}
                                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                                        stickerSize === 'compact'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    กะทัดรัด (อุปกรณ์เล็ก)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Selection Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-600">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={selectAll}
                                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                            >
                                เลือกทั้งหมด ({equipmentList.length})
                            </button>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-gray-500 hover:text-gray-700 hover:underline"
                            >
                                ล้างการเลือก
                            </button>
                        </div>
                        <span className="font-medium text-gray-700">
                            เลือกพิมพ์ {selectedEquipment.length} จาก {equipmentList.length} ชิ้น
                        </span>
                    </div>
                </div>
            </div>

            {/* Printable Stickers Grid Container */}
            {isLoading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-gray-500">กำลังโหลดรายการอุปกรณ์...</p>
                </div>
            ) : selectedEquipment.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">
                    <p className="text-sm">ไม่มีอุปกรณ์ที่เลือกสำหรับพิมพ์สติกเกอร์</p>
                </div>
            ) : (
                <div
                    id="printable-stickers-grid"
                    className={`grid gap-3 sm:gap-4 print:gap-2 ${
                        stickerSize === 'standard'
                            ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 print:grid-cols-2'
                            : 'grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 print:grid-cols-3'
                    }`}
                >
                    {selectedEquipment.map((eq: any) => {
                        const isSelected = selectedIds.has(eq.id)
                        const targetUrl = `${originUrl || 'https://notebook-system.app'}/equipment/${eq.id}?mode=counter`

                        return (
                            <div
                                key={eq.id}
                                onClick={() => toggleSelect(eq.id)}
                                className={`
                                    relative bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none
                                    break-inside-avoid print:cursor-default print:border-black print:border-dashed
                                    ${isSelected
                                        ? 'border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm print:ring-0'
                                        : 'border-dashed border-gray-300 opacity-60'
                                    }
                                `}
                                style={{ pageBreakInside: 'avoid' }}
                            >
                                {/* Screen Selection Checkbox */}
                                <div className="absolute top-3 right-3 print:hidden">
                                    {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-300" />
                                    )}
                                </div>

                                {/* Sticker Header */}
                                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 text-gray-800">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">💻</span>
                                        <span className="text-[11px] font-bold tracking-wider uppercase text-gray-700">
                                            Notebook System Service
                                        </span>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 font-mono text-gray-600 font-semibold print:border print:border-gray-400">
                                        #{eq.equipment_number}
                                    </span>
                                </div>

                                {/* Sticker Body */}
                                <div className="flex items-center gap-4">
                                    {/* High Resolution QR Code */}
                                    <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm print:border-black print:shadow-none shrink-0">
                                        <QRCodeSVG
                                            value={targetUrl}
                                            size={stickerSize === 'compact' ? 88 : 112}
                                            level="M"
                                            includeMargin={false}
                                        />
                                    </div>

                                    {/* Equipment Info */}
                                    <div className="min-w-0 flex-1 space-y-1 text-left">
                                        <p className="text-[11px] text-gray-500 font-medium">รหัสครุภัณฑ์</p>
                                        <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight truncate">
                                            #{eq.equipment_number}
                                        </h3>
                                        <p className="text-xs font-semibold text-indigo-700 print:text-black line-clamp-2">
                                            {eq.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400 pt-1 leading-snug">
                                            📱 สแกนกล้องเพื่อยืม-คืนด่วน
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom Cut/Border Guide */}
                                <div className="mt-3 pt-2 border-t border-dotted border-gray-200 text-center">
                                    <span className="text-[9px] text-gray-400 font-mono">
                                        ID: {eq.id.slice(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Print Stylesheet Injection */}
            <style jsx global>{`
                @media print {
                    /* Hide unnecessary browser/page elements */
                    header, nav, aside, footer, .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Ensure print container fits cleanly */
                    #printable-stickers-grid {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0.5cm !important;
                        gap: 0.4cm !important;
                    }
                }
            `}</style>
        </div>
    )
}
