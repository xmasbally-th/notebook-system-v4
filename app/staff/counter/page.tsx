'use client'

import React, { useState } from 'react'
import {
    Camera,
    RotateCcw,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Search,
    Loader2,
    Package,
    User,
    Calendar,
    ArrowRight,
    QrCode
} from 'lucide-react'
import StaffPageHeader from '@/components/staff/StaffPageHeader'
import QrScannerModal from '@/components/scanner/QrScannerModal'
import FastCounterBorrowModal from '@/components/staff/FastCounterBorrowModal'
import { lookupEquipmentByCode } from './actions'
import { returnLoan } from '@/app/staff/returns/actions'
import { formatThaiDate } from '@/lib/formatThaiDate'

type ScanAction = 'borrow' | 'return' | null

export default function StaffCounterPage() {
    // Scanner state
    const [scannerAction, setScannerAction] = useState<ScanAction>(null)
    const [isLookingUp, setIsLookingUp] = useState(false)
    const [lookupError, setLookupError] = useState<string | null>(null)

    // Manual input code state
    const [manualCode, setManualCode] = useState('')

    // Borrow Modal state
    const [borrowModalEquipment, setBorrowModalEquipment] = useState<any | null>(null)

    // Return Modal state
    const [returnModalData, setReturnModalData] = useState<{
        equipment: any
        activeLoan: any
    } | null>(null)
    const [returnCondition, setReturnCondition] = useState<'good' | 'damaged' | 'missing_parts'>('good')
    const [returnNotes, setReturnNotes] = useState('')
    const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

    // Operation Success Feedback
    const [recentOperation, setRecentOperation] = useState<{
        type: 'borrow' | 'return'
        title: string
        details: string
    } | null>(null)

    // Handle scanned or typed code
    const handleCodeDetected = async (code: string, explicitAction?: ScanAction) => {
        setLookupError(null)
        setIsLookingUp(true)

        try {
            const res = await lookupEquipmentByCode(code)
            if (res.error || !res.equipment) {
                setLookupError(res.error || 'ไม่พบข้อมูลอุปกรณ์')
                return
            }

            const { equipment, activeLoan } = res
            const preferredAction = explicitAction || scannerAction

            if (preferredAction === 'return') {
                // Return flow
                if (!activeLoan) {
                    setLookupError(`อุปกรณ์ #${equipment.equipment_number} (${equipment.name}) มีสถานะ "${equipment.status}" ไม่พบรายการยืมที่กำลังใช้งาน`)
                    return
                }
                setReturnModalData({ equipment, activeLoan })
            } else {
                // Borrow flow (default)
                if (equipment.status === 'borrowed' || activeLoan) {
                    const borrowerName = activeLoan?.profiles
                        ? `${activeLoan.profiles.first_name || ''} ${activeLoan.profiles.last_name || ''}`.trim()
                        : 'ผู้ใช้อื่น'
                    setLookupError(`อุปกรณ์ #${equipment.equipment_number} กำลังถูกยืมโดยคุณ ${borrowerName} (หากต้องการรับคืน กรุณากดปุ่มสแกนรับคืน)`)
                    return
                }

                if (equipment.status !== 'ready' && equipment.status !== 'active') {
                    setLookupError(`อุปกรณ์ #${equipment.equipment_number} ไม่พร้อมให้ยืม (สถานะปัจจุบัน: ${equipment.status})`)
                    return
                }

                setBorrowModalEquipment(equipment)
            }
        } catch (err: any) {
            setLookupError(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบอุปกรณ์')
        } finally {
            setIsLookingUp(false)
            setScannerAction(null)
        }
    }

    // Process Return Confirm
    const handleConfirmReturn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!returnModalData) return

        setIsSubmittingReturn(true)
        try {
            const res = await returnLoan({
                loanId: returnModalData.activeLoan.id,
                equipmentId: returnModalData.equipment.id,
                condition: returnCondition,
                notes: returnNotes || undefined
            })

            if (res.success) {
                setRecentOperation({
                    type: 'return',
                    title: `รับคืนอุปกรณ์ #${returnModalData.equipment.equipment_number} เรียบร้อยแล้ว`,
                    details: `สภาพ: ${returnCondition === 'good' ? 'สภาพดี' : returnCondition === 'damaged' ? 'ชำรุด (ส่งซ่อม)' : 'ขาดชิ้นส่วน'} • อุปกรณ์พร้อมใช้งานทันที`
                })
                setReturnModalData(null)
                setReturnNotes('')
                setReturnCondition('good')
            } else {
                alert(res.error || 'เกิดข้อผิดพลาดในการบันทึกการรับคืน')
            }
        } catch (err: any) {
            alert(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setIsSubmittingReturn(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-16">
            <StaffPageHeader
                title="จุดบริการเคาน์เตอร์ด่วน (Fast Counter Station)"
                subtitle="สแกน QR Code เพื่อยืมด่วนให้ผู้ใช้/วิทยากรภายนอก หรือสแกนรับคืนเครื่องเสร็จใน 5 วินาที"
            />

            {/* Recent Operation Banner */}
            {recentOperation && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-emerald-950">{recentOperation.title}</h4>
                            <p className="text-xs text-emerald-700 mt-0.5">{recentOperation.details}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRecentOperation(null)}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                        ปิด
                    </button>
                </div>
            )}

            {/* Error Message */}
            {lookupError && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-amber-900">แจ้งเตือนสถานะอุปกรณ์</h4>
                        <p className="text-xs text-amber-700 mt-0.5">{lookupError}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setLookupError(null)}
                        className="text-xs text-amber-700 hover:text-amber-900 font-medium"
                    >
                        รับทราบ
                    </button>
                </div>
            )}

            {/* Fast Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. Fast Borrow Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-all" />

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>ยืมทันที ณ เคาน์เตอร์</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
                            สแกนยืมด่วนหน้าเคาน์เตอร์
                        </h2>
                        <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed mb-6">
                            ส่องกล้องสมาร์ทโฟนที่สติกเกอร์ QR บนตัวเครื่อง สามารถออกเครื่องให้นักศึกษา บุคลากร หรือวิทยากรภายนอกได้ทันที
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setScannerAction('borrow')}
                        disabled={isLookingUp}
                        className="w-full py-4 bg-white hover:bg-gray-50 text-indigo-700 font-bold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-98"
                    >
                        {isLookingUp && scannerAction === 'borrow' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        ) : (
                            <Camera className="w-5 h-5 text-indigo-600" />
                        )}
                        <span>เปิดกล้องสแกนเพื่อยืม</span>
                    </button>
                </div>

                {/* 2. Fast Return Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-all" />

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-4">
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>รับคืนด่วน 5 วินาที</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
                            สแกนรับคืนอุปกรณ์
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed mb-6">
                            สแกน QR บนเครื่องที่นำมาส่งคืน ระบบจะดึงข้อมูลผู้ยืมเดิมขึ้นมาทันที ตรวจสภาพและกดยืนยันรับคืนในคลิกเดียว
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setScannerAction('return')}
                        disabled={isLookingUp}
                        className="w-full py-4 bg-white hover:bg-gray-50 text-emerald-700 font-bold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-98"
                    >
                        {isLookingUp && scannerAction === 'return' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                        ) : (
                            <Camera className="w-5 h-5 text-emerald-600" />
                        )}
                        <span>เปิดกล้องสแกนรับคืน</span>
                    </button>
                </div>
            </div>

            {/* Quick Search / Manual Keypad Input Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>หรือพิมพ์หมายเลขครุภัณฑ์ด้วยตนเอง (กรณีไม่ได้เปิดกล้อง)</span>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (manualCode.trim()) handleCodeDetected(manualCode.trim(), 'borrow')
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                >
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="พิมพ์หมายเลขครุภัณฑ์ เช่น 150 หรือ NB-001..."
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (manualCode.trim()) handleCodeDetected(manualCode.trim(), 'borrow')
                            }}
                            disabled={!manualCode.trim() || isLookingUp}
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                        >
                            ขอยืม
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (manualCode.trim()) handleCodeDetected(manualCode.trim(), 'return')
                            }}
                            disabled={!manualCode.trim() || isLookingUp}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                        >
                            รับคืน
                        </button>
                    </div>
                </form>
            </div>

            {/* Scanner Modal */}
            <QrScannerModal
                isOpen={scannerAction !== null}
                onClose={() => setScannerAction(null)}
                onScanSuccess={(code) => handleCodeDetected(code)}
                autoCloseDelayMs={400}
                title={scannerAction === 'return' ? 'สแกน QR เพื่อรับคืนอุปกรณ์' : 'สแกน QR เพื่อบันทึกการยืมด่วน'}
                subtitle="ส่องกล้องสมาร์ทโฟนไปที่สติกเกอร์บนตัวเครื่องโน้ตบุ๊ค"
            />

            {/* Fast Counter Borrow Modal (Dual Mode) */}
            {borrowModalEquipment && (
                <FastCounterBorrowModal
                    isOpen={borrowModalEquipment !== null}
                    onClose={() => setBorrowModalEquipment(null)}
                    equipment={borrowModalEquipment}
                    onSuccess={(res) => {
                        setRecentOperation({
                            type: 'borrow',
                            title: `บันทึกการยืม #${res.equipmentNumber} เรียบร้อยแล้ว`,
                            details: `ผู้ยืม: ${res.borrowerName} • ส่งมอบเครื่องทันที`
                        })
                    }}
                />
            )}

            {/* Return Modal Confirmation */}
            {returnModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/60">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold">
                                <RotateCcw className="w-5 h-5 text-emerald-600" />
                                <span>บันทึกการรับคืนอุปกรณ์</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReturnModalData(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleConfirmReturn} className="p-5 space-y-4 text-xs sm:text-sm">
                            {/* Equipment Card */}
                            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                <p className="font-bold text-gray-900">
                                    #{returnModalData.equipment.equipment_number} — {returnModalData.equipment.name}
                                </p>
                                <p className="text-gray-500 text-xs">
                                    👤 ผู้ยืม:{' '}
                                    {returnModalData.activeLoan.profiles
                                        ? `${returnModalData.activeLoan.profiles.first_name || ''} ${returnModalData.activeLoan.profiles.last_name || ''}`.trim()
                                        : returnModalData.activeLoan.reason?.includes('[วิทยากรภายนอก')
                                        ? returnModalData.activeLoan.reason.split(']')[0].replace('[', '')
                                        : 'ไม่ทราบชื่อ'}
                                </p>
                                <p className="text-gray-400 text-[11px]">
                                    📅 กำหนดส่งคืนเดิม: {formatThaiDate(returnModalData.activeLoan.end_date)}
                                </p>
                            </div>

                            {/* Condition selector */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    ผลการตรวจรับสภาพอุปกรณ์
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setReturnCondition('good')}
                                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                                            returnCondition === 'good'
                                                ? 'border-green-600 bg-green-50 text-green-700 font-bold'
                                                : 'border-gray-200 bg-white text-gray-600'
                                        }`}
                                    >
                                        ✅ สภาพดี
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReturnCondition('damaged')}
                                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                                            returnCondition === 'damaged'
                                                ? 'border-red-600 bg-red-50 text-red-700 font-bold'
                                                : 'border-gray-200 bg-white text-gray-600'
                                        }`}
                                    >
                                        ⚠️ ชำรุด (ส่งซ่อม)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReturnCondition('missing_parts')}
                                        className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                                            returnCondition === 'missing_parts'
                                                ? 'border-yellow-600 bg-yellow-50 text-yellow-700 font-bold'
                                                : 'border-gray-200 bg-white text-gray-600'
                                        }`}
                                    >
                                        📦 ขาดชิ้นส่วน
                                    </button>
                                </div>
                            </div>

                            {/* Return Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    บันทึกเพิ่มเติม (ถ้ามี)
                                </label>
                                <input
                                    type="text"
                                    placeholder="เช่น ตรวจสอบพบรอยขีดข่วน หรืออุปกรณ์ครบถ้วน"
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50"
                                />
                            </div>

                            {/* Submit Return */}
                            <button
                                type="submit"
                                disabled={isSubmittingReturn}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmittingReturn ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span>ยืนยันการรับคืนทันที</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
