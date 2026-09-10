'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './CartContext'
import { useProfile } from '@/hooks/useProfile'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import {
    X,
    ShoppingCart,
    Send,
    Bookmark,
    RefreshCw,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react'
import { submitLoanRequest } from '@/app/equipment/actions'
import { submitReservationRequest } from '@/app/reservations/actions'
import { supabase } from '@/lib/supabase/client'
import CartDrawerItem from './CartDrawerItem'
import CartBorrowForm from './CartBorrowForm'
import CartReserveForm from './CartReserveForm'
import CartConfirmModal from './CartConfirmModal'
import CartEvaluationAlert from './CartEvaluationAlert'

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
}

type CartMode = 'borrow' | 'reserve'

type LoanLimitsByType = {
    student: { max_days: number; max_items: number }
    lecturer: { max_days: number; max_items: number }
    staff: { max_days: number; max_items: number }
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const router = useRouter()
    const { items, removeItem, clearCart, maxItems } = useCart()
    const { data: profile } = useProfile()
    const { data: config } = useSystemConfig()

    // Mode state
    const [mode, setMode] = useState<CartMode>('borrow')

    // Borrow mode
    const [endDate, setEndDate] = useState('')
    const [returnTime, setReturnTime] = useState('')

    // Reserve mode
    const [reserveStartDate, setReserveStartDate] = useState('')
    const [reservePickupTime, setReservePickupTime] = useState('')
    const [reserveEndDate, setReserveEndDate] = useState('')
    const [reserveReturnTime, setReserveReturnTime] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Availability tracking
    const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set())
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

    // Confirmation dialog
    const [showConfirmation, setShowConfirmation] = useState(false)

    // Pending evaluations
    const [pendingEvaluationCount, setPendingEvaluationCount] = useState(0)

    // Max loan days based on user type
    const maxDays = useMemo(() => {
        if (!config?.loan_limits_by_type || !profile?.user_type) return 7
        const limits = config.loan_limits_by_type as LoanLimitsByType
        return limits[profile.user_type as keyof LoanLimitsByType]?.max_days || 7
    }, [config?.loan_limits_by_type, profile?.user_type])

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    // Operating hours
    const openingTime = config?.opening_time?.slice(0, 5) || '09:00'
    const closingTime = config?.closing_time?.slice(0, 5) || '17:00'
    const breakStartTime = config?.break_start_time?.slice(0, 5) || null
    const breakEndTime = config?.break_end_time?.slice(0, 5) || null

    // Max end date calculation
    const maxEndDate = useMemo(() => {
        const start = new Date(today)
        start.setDate(start.getDate() + maxDays - 1)
        return start.toISOString().split('T')[0]
    }, [today, maxDays])

    const reserveMaxEndDate = useMemo(() => {
        if (!reserveStartDate) return ''
        const start = new Date(reserveStartDate)
        start.setDate(start.getDate() + maxDays - 1)
        return start.toISOString().split('T')[0]
    }, [reserveStartDate, maxDays])

    const maxAdvanceBookingDays = (config as any)?.max_advance_booking_days || 30
    const maxAdvanceDate = useMemo(() => {
        const date = new Date()
        date.setDate(date.getDate() + maxAdvanceBookingDays)
        return date.toISOString().split('T')[0]
    }, [maxAdvanceBookingDays])

    // Validate time against operating hours and lunch break
    const validateTime = useCallback((time: string): string | null => {
        if (!time) return null

        const [hours, minutes] = time.split(':').map(Number)
        const timeMinutes = hours * 60 + minutes

        const [openH, openM] = openingTime.split(':').map(Number)
        const [closeH, closeM] = closingTime.split(':').map(Number)
        const openMinutes = openH * 60 + openM
        const closeMinutes = closeH * 60 + closeM

        if (timeMinutes < openMinutes) {
            return `เวลาต้องไม่ก่อน ${openingTime} น.`
        }
        if (timeMinutes > closeMinutes) {
            return `เวลาต้องไม่เกิน ${closingTime} น.`
        }

        if (breakStartTime && breakEndTime) {
            const [breakStartH, breakStartM] = breakStartTime.split(':').map(Number)
            const [breakEndH, breakEndM] = breakEndTime.split(':').map(Number)
            const breakStartMinutes = breakStartH * 60 + breakStartM
            const breakEndMinutes = breakEndH * 60 + breakEndM

            if (timeMinutes >= breakStartMinutes && timeMinutes <= breakEndMinutes) {
                return `เวลา ${breakStartTime}-${breakEndTime} น. เป็นช่วงพักกลางวัน`
            }
        }

        return null
    }, [openingTime, closingTime, breakStartTime, breakEndTime])

    // Check availability of cart items
    const checkCartAvailability = useCallback(async () => {
        if (items.length === 0) {
            setUnavailableIds(new Set())
            return
        }

        setIsCheckingAvailability(true)
        try {
            const equipmentIds = items.map(item => item.id)

            const { data: equipmentData } = await supabase
                .from('equipment')
                .select('id, status')
                .in('id', equipmentIds)

            const { data: activeLoanData } = await supabase
                .from('loanRequests')
                .select('equipment_id')
                .in('equipment_id', equipmentIds)
                .in('status', ['pending', 'approved'])

            const { data: activeReservationData } = await supabase
                .from('reservations')
                .select('equipment_id')
                .in('equipment_id', equipmentIds)
                .in('status', ['pending', 'approved', 'ready'])

            const unavailable = new Set<string>()

            equipmentData?.forEach((eq: any) => {
                if (eq.status !== 'ready' && eq.status !== 'active') {
                    unavailable.add(eq.id)
                }
            })

            activeLoanData?.forEach((loan: any) => {
                unavailable.add(loan.equipment_id)
            })

            activeReservationData?.forEach((res: any) => {
                unavailable.add(res.equipment_id)
            })

            setUnavailableIds(unavailable)
        } catch (err) {
            console.error('[CartDrawer] Availability check error:', err)
        } finally {
            setIsCheckingAvailability(false)
        }
    }, [items])

    useEffect(() => {
        if (isOpen) {
            checkCartAvailability()
        }
    }, [isOpen, items.length, checkCartAvailability])

    // Check pending evaluations
    useEffect(() => {
        if (!isOpen) return
        const checkPendingEvaluations = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                const { data: cutoffDateRaw, error: configError } = await supabase
                    .rpc('get_evaluation_cutoff_date')

                if (configError) {
                    console.error('[CartDrawer] Error fetching cutoff date via RPC:', configError)
                }

                const cutoffDate = cutoffDateRaw || new Date().toISOString().split('T')[0]

                const { data: returnedLoans } = await supabase
                    .from('loanRequests')
                    .select('id, evaluations(id)')
                    .eq('user_id', session.user.id)
                    .eq('status', 'returned')
                    .gte('updated_at', cutoffDate)

                const pending = (returnedLoans || []).filter(
                    (loan: any) => !loan.evaluations || loan.evaluations.length === 0
                )
                setPendingEvaluationCount(pending.length)
            } catch (err) {
                console.error('[CartDrawer] Evaluation check error:', err)
            }
        }
        checkPendingEvaluations()
    }, [isOpen])

    const hasPendingEvaluations = pendingEvaluationCount > 0
    const hasUnavailableItems = unavailableIds.size > 0

    // Validation errors
    const validationErrors = useMemo(() => {
        const errors: string[] = []

        if (mode === 'borrow') {
            if (!endDate) return errors
            if (returnTime) {
                const timeError = validateTime(returnTime)
                if (timeError) errors.push(timeError)
            }
        } else {
            if (reserveStartDate && reserveStartDate <= today) {
                errors.push('วันที่รับต้องเป็นวันพรุ่งนี้เป็นต้นไป')
            }
            if (reservePickupTime) {
                const timeError = validateTime(reservePickupTime)
                if (timeError) errors.push(`เวลารับ: ${timeError}`)
            }
            if (reserveReturnTime) {
                const timeError = validateTime(reserveReturnTime)
                if (timeError) errors.push(`เวลาคืน: ${timeError}`)
            }
        }

        return errors
    }, [mode, endDate, returnTime, reserveStartDate, reservePickupTime, reserveReturnTime, today, validateTime])

    const handleShowConfirmation = () => {
        setError(null)

        if (items.length === 0) {
            setError('กรุณาเลือกอุปกรณ์')
            return
        }

        if (hasUnavailableItems) {
            setError('กรุณานำอุปกรณ์ที่ไม่พร้อมให้ยืมออกจากรายการก่อน')
            return
        }

        if (mode === 'borrow') {
            if (!endDate) {
                setError('กรุณาระบุวันที่คืน')
                return
            }
            if (!returnTime) {
                setError('กรุณาระบุเวลาคืน')
                return
            }
            const timeError = validateTime(returnTime)
            if (timeError) {
                setError(timeError)
                return
            }
        } else {
            if (!reserveStartDate || !reserveEndDate) {
                setError('กรุณาระบุวันที่รับและวันที่คืน')
                return
            }
            if (!reservePickupTime || !reserveReturnTime) {
                setError('กรุณาระบุเวลารับและเวลาคืน')
                return
            }
            const pickupError = validateTime(reservePickupTime)
            if (pickupError) {
                setError(`เวลารับ: ${pickupError}`)
                return
            }
            const returnError = validateTime(reserveReturnTime)
            if (returnError) {
                setError(`เวลาคืน: ${returnError}`)
                return
            }
        }

        setShowConfirmation(true)
    }

    const handleSubmit = async () => {
        setShowConfirmation(false)
        setIsSubmitting(true)
        setError(null)

        try {
            await checkCartAvailability()

            const currentUnavailable = new Set<string>()
            const equipmentIds = items.map(item => item.id)
            const { data: activeLoanData } = await supabase
                .from('loanRequests')
                .select('equipment_id')
                .in('equipment_id', equipmentIds)
                .in('status', ['pending', 'approved'])

            const { data: activeReservationData } = await supabase
                .from('reservations')
                .select('equipment_id')
                .in('equipment_id', equipmentIds)
                .in('status', ['pending', 'approved', 'ready'])

            activeLoanData?.forEach((loan: any) => {
                currentUnavailable.add(loan.equipment_id)
            })
            activeReservationData?.forEach((res: any) => {
                currentUnavailable.add(res.equipment_id)
            })

            if (currentUnavailable.size > 0) {
                setUnavailableIds(currentUnavailable)
                setError('มีอุปกรณ์ที่ถูกยืมไปแล้วในรายการ กรุณานำออกก่อนส่งคำขอ')
                setIsSubmitting(false)
                return
            }

            if (mode === 'borrow') {
                for (const item of items) {
                    const formData = new FormData()
                    formData.set('equipmentId', item.id)
                    formData.set('startDate', today)
                    formData.set('endDate', endDate)
                    formData.set('returnTime', returnTime)

                    const result = await submitLoanRequest(null, formData)
                    if (result?.error) {
                        throw new Error(result.error)
                    }
                }
            } else {
                for (const item of items) {
                    const formData = new FormData()
                    formData.set('equipmentId', item.id)
                    formData.set('startDate', reserveStartDate)
                    formData.set('endDate', reserveEndDate)
                    if (reservePickupTime) formData.set('pickupTime', reservePickupTime)
                    if (reserveReturnTime) formData.set('returnTime', reserveReturnTime)

                    const result = await submitReservationRequest(formData)
                    if (result?.error) {
                        throw new Error(result.error || `จองอุปกรณ์ ${item.name} ไม่สำเร็จ`)
                    }
                }
            }

            setSuccess(true)
            clearCart()

            setTimeout(() => {
                onClose()
                router.push(mode === 'reserve' ? '/my-reservations' : '/my-loans')
            }, 2000)

        } catch (err: any) {
            console.error('[CartDrawer] Submit error:', err)
            setError(err.message || 'เกิดข้อผิดพลาดในการส่งคำขอ')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    const isFormValid = mode === 'borrow'
        ? (Boolean(endDate && returnTime) && validationErrors.length === 0 && !hasUnavailableItems && !hasPendingEvaluations)
        : (Boolean(reserveStartDate && reserveEndDate && reservePickupTime && reserveReturnTime) && validationErrors.length === 0 && !hasUnavailableItems && !hasPendingEvaluations)

    const formatThaiDateShort = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={() => { setShowConfirmation(false); onClose(); }}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">รายการที่เลือก</h2>
                        <span className="text-sm text-gray-500">({items.length}/{maxItems})</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowConfirmation(false); onClose(); }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Pending evaluations alert */}
                    <CartEvaluationAlert pendingEvaluationCount={pendingEvaluationCount} />

                    {success ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {mode === 'borrow' ? 'ส่งคำขอยืมสำเร็จ!' : 'ส่งคำขอจองสำเร็จ!'}
                            </h3>
                            <p className="text-gray-500">กำลังนำท่านไปยังหน้าประวัติ...</p>
                        </div>
                    ) : showConfirmation ? (
                        <CartConfirmModal
                            items={items}
                            mode={mode}
                            today={today}
                            endDate={endDate}
                            returnTime={returnTime}
                            reserveStartDate={reserveStartDate}
                            reservePickupTime={reservePickupTime}
                            reserveEndDate={reserveEndDate}
                            reserveReturnTime={reserveReturnTime}
                            isSubmitting={isSubmitting}
                            error={error}
                            onConfirm={handleSubmit}
                            onCancel={() => setShowConfirmation(false)}
                            formatThaiDateShort={formatThaiDateShort}
                        />
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-500">ยังไม่มีรายการ</h3>
                            <p className="text-sm text-gray-400 mt-1">เลือกอุปกรณ์ที่ต้องการยืม</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setMode('borrow')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                                        mode === 'borrow'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Send className="w-4 h-4" />
                                    ยืมทันที
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('reserve')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                                        mode === 'reserve'
                                            ? 'bg-white text-purple-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Bookmark className="w-4 h-4" />
                                    จองล่วงหน้า
                                </button>
                            </div>

                            {/* Unavailable warning */}
                            {hasUnavailableItems && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-orange-800">มีอุปกรณ์ที่ไม่พร้อมให้ยืม</p>
                                            <p className="text-orange-600 mt-0.5">กรุณานำออกจากรายการก่อนส่งคำขอ</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Item list */}
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <CartDrawerItem
                                        key={item.id}
                                        item={item}
                                        isUnavailable={unavailableIds.has(item.id)}
                                        onRemove={removeItem}
                                    />
                                ))}
                            </div>

                            {/* Refresh availability */}
                            <button
                                type="button"
                                onClick={checkCartAvailability}
                                disabled={isCheckingAvailability}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${isCheckingAvailability ? 'animate-spin' : ''}`} />
                                {isCheckingAvailability ? 'กำลังตรวจสอบ...' : 'ตรวจสอบความพร้อมอุปกรณ์'}
                            </button>

                            {/* User limits info */}
                            <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                                <p className="text-blue-800">
                                    <strong>
                                        {profile?.user_type === 'student' ? 'นักศึกษา' : profile?.user_type === 'lecturer' ? 'อาจารย์' : 'บุคลากร'}
                                    </strong>:
                                    {' '}ยืมได้สูงสุด {maxItems} ชิ้น, {maxDays} วัน
                                </p>
                                <p className="text-blue-700 text-xs">
                                    🕐 เปิด {openingTime}-{closingTime} น.
                                    {breakStartTime && breakEndTime && ` (พัก ${breakStartTime}-${breakEndTime})`}
                                </p>
                            </div>

                            {/* Forms */}
                            {mode === 'borrow' ? (
                                <CartBorrowForm
                                    today={today}
                                    endDate={endDate}
                                    onEndDateChange={setEndDate}
                                    returnTime={returnTime}
                                    onReturnTimeChange={setReturnTime}
                                    maxEndDate={maxEndDate}
                                    openingTime={openingTime}
                                    closingTime={closingTime}
                                />
                            ) : (
                                <CartReserveForm
                                    reserveStartDate={reserveStartDate}
                                    onReserveStartDateChange={setReserveStartDate}
                                    reservePickupTime={reservePickupTime}
                                    onReservePickupTimeChange={setReservePickupTime}
                                    reserveEndDate={reserveEndDate}
                                    onReserveEndDateChange={setReserveEndDate}
                                    reserveReturnTime={reserveReturnTime}
                                    onReserveReturnTimeChange={setReserveReturnTime}
                                    tomorrow={tomorrow}
                                    maxAdvanceDate={maxAdvanceDate}
                                    maxAdvanceBookingDays={maxAdvanceBookingDays}
                                    reserveMaxEndDate={reserveMaxEndDate}
                                    openingTime={openingTime}
                                    closingTime={closingTime}
                                />
                            )}

                            {/* Validation errors */}
                            {validationErrors.length > 0 && (
                                <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            {validationErrors.map((err, i) => (
                                                <p key={i}>{err}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error display */}
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && !showConfirmation && items.length > 0 && (
                    <div className="p-4 border-t border-gray-200 space-y-3">
                        <button
                            type="button"
                            onClick={handleShowConfirmation}
                            disabled={isSubmitting || !isFormValid}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
                                mode === 'borrow'
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังส่งคำขอ...
                                </>
                            ) : mode === 'borrow' ? (
                                <>
                                    <Send className="w-5 h-5" />
                                    ตรวจสอบและส่งคำขอยืม ({items.length} รายการ)
                                </>
                            ) : (
                                <>
                                    <Bookmark className="w-5 h-5" />
                                    ตรวจสอบและส่งคำขอจอง ({items.length} รายการ)
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={clearCart}
                            className="w-full px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
                        >
                            ล้างรายการทั้งหมด
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
