'use client'

import React, { useState, useEffect } from 'react'
import { X, User, Users, Calendar, Clock, Loader2, CheckCircle2, AlertCircle, Building2, Phone, Sparkles } from 'lucide-react'
import { createFastCounterLoanAction, searchInternalProfiles } from '@/app/staff/counter/actions'
import { formatThaiDate } from '@/lib/formatThaiDate'

interface FastCounterBorrowModalProps {
    isOpen: boolean
    onClose: () => void
    equipment: any
    onSuccess: (result: any) => void
}

export default function FastCounterBorrowModal({
    isOpen,
    onClose,
    equipment,
    onSuccess
}: FastCounterBorrowModalProps) {
    const [borrowerType, setBorrowerType] = useState<'internal' | 'external'>('external')
    
    // Internal user selection
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any | null>(null)

    // External guest details
    const [externalName, setExternalName] = useState('')
    const [externalOrg, setExternalOrg] = useState('')
    const [externalPhone, setExternalPhone] = useState('')

    // Dates & Purpose
    const today = new Date().toISOString().split('T')[0]
    const [endDate, setEndDate] = useState(today)
    const [returnTime, setReturnTime] = useState('16:30')
    const [purpose, setPurpose] = useState('การบรรยายและฝึกอบรมเชิงปฏิบัติการ')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    // Debounced search for internal profiles
    useEffect(() => {
        if (!userSearch || userSearch.trim().length < 2 || borrowerType !== 'internal') {
            setSearchResults([])
            return
        }

        const timer = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await searchInternalProfiles(userSearch)
                setSearchResults(res.profiles || [])
            } catch (err) {
                console.error('Search error:', err)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [userSearch, borrowerType])

    if (!isOpen || !equipment) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg(null)

        if (borrowerType === 'internal' && !selectedUser) {
            setErrorMsg('กรุณาค้นหาและเลือกผู้ยืมในระบบ')
            return
        }

        if (borrowerType === 'external' && !externalName.trim()) {
            setErrorMsg('กรุณาระบุชื่อ-นามสกุลวิทยากรภายนอก')
            return
        }

        if (!purpose.trim()) {
            setErrorMsg('กรุณาระบุวัตถุประสงค์การใช้งาน')
            return
        }

        setIsSubmitting(true)

        try {
            const res = await createFastCounterLoanAction({
                equipmentId: equipment.id,
                borrowerType,
                targetUserId: selectedUser?.id,
                externalBorrowerName: externalName.trim(),
                externalBorrowerOrg: externalOrg.trim(),
                externalBorrowerPhone: externalPhone.trim(),
                purpose: purpose.trim(),
                endDate,
                returnTime
            })

            if (res.success) {
                onSuccess(res)
                onClose()
            } else {
                setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการบันทึกการยืม')
            }
        } catch (err: any) {
            setErrorMsg(err?.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                                บันทึกการยืมด่วนหน้าเคาน์เตอร์
                            </h3>
                            <p className="text-xs text-gray-500">
                                #{equipment.equipment_number} — {equipment.name}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Borrower Type Switcher */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            ประเภทผู้ยืม
                        </label>
                        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => setBorrowerType('external')}
                                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${
                                    borrowerType === 'external'
                                        ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                <span>วิทยากร / บุคคลภายนอก</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setBorrowerType('internal')}
                                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${
                                    borrowerType === 'internal'
                                        ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Users className="w-4 h-4" />
                                <span>นักศึกษา / บุคลากรในระบบ</span>
                            </button>
                        </div>
                    </div>

                    {/* Conditional Borrower Fields */}
                    {borrowerType === 'external' ? (
                        <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                                <span>🎤 ข้อมูลวิทยากรภายนอก (ไม่จำเป็นต้องมีบัญชีในระบบ)</span>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    ชื่อ-นามสกุล วิทยากร <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="เช่น ดร.สมชาย นามดี"
                                    value={externalName}
                                    onChange={(e) => setExternalName(e.target.value)}
                                    className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        หน่วยงาน / องค์กร
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="เช่น บริษัท ABC / สวทช."
                                        value={externalOrg}
                                        onChange={(e) => setExternalOrg(e.target.value)}
                                        className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        เบอร์โทรศัพท์ติดต่อ
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="เช่น 081-234-5678"
                                        value={externalPhone}
                                        onChange={(e) => setExternalPhone(e.target.value)}
                                        className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-3">
                            <label className="block text-xs font-semibold text-blue-900 mb-1">
                                ค้นหานักศึกษา / บุคลากรในระบบ <span className="text-red-500">*</span>
                            </label>

                            {selectedUser ? (
                                <div className="p-3 bg-white border border-blue-300 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">
                                            {selectedUser.first_name} {selectedUser.last_name}
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            รหัส: {selectedUser.user_id || '-'} • {selectedUser.departments?.name || '-'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedUser(null)
                                            setUserSearch('')
                                        }}
                                        className="text-xs text-red-600 hover:underline font-medium"
                                    >
                                        เปลี่ยน
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="พิมพ์ชื่อ นามสกุล หรือรหัสนักศึกษา/บุคลากร..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2.5 bg-white"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-3 text-xs text-gray-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        </div>
                                    )}

                                    {/* Dropdown Results */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 divide-y divide-gray-100">
                                            {searchResults.map((u) => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => {
                                                        setSelectedUser(u)
                                                        setSearchResults([])
                                                    }}
                                                    className="p-2.5 hover:bg-indigo-50 cursor-pointer text-xs"
                                                >
                                                    <p className="font-semibold text-gray-800">
                                                        {u.first_name} {u.last_name}
                                                    </p>
                                                    <p className="text-gray-400 text-[10px]">
                                                        {u.user_id || u.email} • {u.departments?.name || '-'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Schedule: Return Date & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                กำหนดส่งคืน (วันที่) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                min={today}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                เวลาส่งคืน <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                required
                                value={returnTime}
                                onChange={(e) => setReturnTime(e.target.value)}
                                className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white font-medium"
                            />
                        </div>
                    </div>

                    {/* Purpose / Project */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            วัตถุประสงค์ / โครงการที่ใช้ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="เช่น ใช้บรรยายโครงการอบรม Big Data หรือ การเรียนการสอน"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full text-xs sm:text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white font-medium"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>กำลังบันทึกและออกรายการยืม...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>ยืนยันและส่งมอบเครื่องทันที</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
