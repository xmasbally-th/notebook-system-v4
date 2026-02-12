'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './CartContext'
import { useProfile } from '@/hooks/useProfile'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import { X, Trash2, ShoppingCart, Send, Calendar, Clock, Loader2, AlertCircle, CheckCircle, Bookmark, AlertTriangle, RefreshCw, Star } from 'lucide-react'
import { createReservation } from '@/lib/reservations'
import { submitLoanRequest } from '@/app/equipment/actions'
import { supabase } from '@/lib/supabase/client'

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

    // Borrow mode: only end date + return time (start = today)
    const [endDate, setEndDate] = useState('')
    const [returnTime, setReturnTime] = useState('')

    // Reserve mode: start date + pickup time + end date + return time
    const [reserveStartDate, setReserveStartDate] = useState('')
    const [reservePickupTime, setReservePickupTime] = useState('')
    const [reserveEndDate, setReserveEndDate] = useState('')
    const [reserveReturnTime, setReserveReturnTime] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Bug 2: Track unavailable equipment in cart
    const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set())
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)

    // Bug 3: Confirmation dialog state
    const [showConfirmation, setShowConfirmation] = useState(false)

    // Pending evaluations check
    const [pendingEvaluationCount, setPendingEvaluationCount] = useState(0)

    // Get max loan days based on user type
    const getMaxDays = () => {
        if (!config?.loan_limits_by_type || !profile?.user_type) return 7
        const limits = config.loan_limits_by_type as LoanLimitsByType
        return limits[profile.user_type as keyof LoanLimitsByType]?.max_days || 7
    }

    const maxDays = getMaxDays()
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    // Operating hours from config
    const openingTime = config?.opening_time?.slice(0, 5) || '09:00'
    const closingTime = config?.closing_time?.slice(0, 5) || '17:00'
    const breakStartTime = config?.break_start_time?.slice(0, 5) || null
    const breakEndTime = config?.break_end_time?.slice(0, 5) || null

    // Calculate max end date for borrow mode
    // Example: if start=today(26th) and maxDays=3, maxEnd=28th (26=day1, 27=day2, 28=day3)
    const getMaxEndDate = () => {
        const start = new Date(today)
        start.setDate(start.getDate() + maxDays - 1)
        return start.toISOString().split('T')[0]
    }

    // Calculate max end date for reserve mode
    // Example: if start=26th and maxDays=3, maxEnd=28th (26=day1, 27=day2, 28=day3)
    const getReserveMaxEndDate = () => {
        if (!reserveStartDate) return ''
        const start = new Date(reserveStartDate)
        start.setDate(start.getDate() + maxDays - 1)
        return start.toISOString().split('T')[0]
    }

    // Max advance booking days
    const maxAdvanceBookingDays = (config as any)?.max_advance_booking_days || 30
    const getMaxAdvanceDate = () => {
        const date = new Date()
        date.setDate(date.getDate() + maxAdvanceBookingDays)
        return date.toISOString().split('T')[0]
    }

    // Validate time against break and closing hours
    const validateTime = (time: string): string | null => {
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

        // Check break time
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
    }

    // Bug 2: Check availability of all cart items when drawer opens
    const checkCartAvailability = useCallback(async () => {
        if (items.length === 0) {
            setUnavailableIds(new Set())
            return
        }

        setIsCheckingAvailability(true)
        try {
            const equipmentIds = items.map(item => item.id)

            // Check equipment status
            const { data: equipmentData } = await supabase
                .from('equipment')
                .select('id, status')
                .in('id', equipmentIds)

            // Check active loans
            const { data: activeLoanData } = await supabase
                .from('loanRequests')
                .select('equipment_id')
                .in('equipment_id', equipmentIds)
                .in('status', ['pending', 'approved'])

            const unavailable = new Set<string>()

            // Mark equipment that is not in 'ready'/'active' status
            equipmentData?.forEach((eq: any) => {
                if (eq.status !== 'ready' && eq.status !== 'active') {
                    unavailable.add(eq.id)
                }
            })

            // Mark equipment that has active loans
            activeLoanData?.forEach((loan: any) => {
                unavailable.add(loan.equipment_id)
            })

            setUnavailableIds(unavailable)
        } catch (err) {
            console.error('[CartDrawer] Availability check error:', err)
        } finally {
            setIsCheckingAvailability(false)
        }
    }, [items])

    // Check availability when drawer opens or items change
    useEffect(() => {
        if (isOpen) {
            checkCartAvailability()
        }
    }, [isOpen, items.length, checkCartAvailability])

    // Check for pending evaluations when drawer opens
    useEffect(() => {
        if (!isOpen) return
        const checkPendingEvaluations = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                // Get cutoff date
                const { data: config } = await supabase
                    .from('system_config')
                    .select('evaluation_cutoff_date')
                    .single()

                const cutoffDate = (config as any)?.evaluation_cutoff_date || new Date().toISOString().split('T')[0]

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
    const availableItems = items.filter(item => !unavailableIds.has(item.id))

    // Validation errors for display
    const validationErrors = useMemo(() => {
        const errors: string[] = []

        if (mode === 'borrow') {
            if (!endDate) return errors
            if (returnTime) {
                const timeError = validateTime(returnTime)
                if (timeError) errors.push(timeError)
            }
        } else {
            // Reserve mode
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
    }, [mode, endDate, returnTime, reserveStartDate, reservePickupTime, reserveReturnTime, today])

    // Bug 3: Show confirmation dialog instead of submitting immediately
    const handleShowConfirmation = () => {
        setError(null)

        if (items.length === 0) {
            setError('กรุณาเลือกอุปกรณ์')
            return
        }

        // Check for unavailable items
        if (hasUnavailableItems) {
            setError('กรุณานำอุปกรณ์ที่ไม่พร้อมให้ยืมออกจากรายการก่อน')
            return
        }

        // Validate based on mode
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
            // Validate times
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

        // All validated — show confirmation dialog
        setShowConfirmation(true)
    }

    const handleSubmit = async () => {
        setShowConfirmation(false)
        setIsSubmitting(true)
        setError(null)

        try {
            // Re-check availability before submitting
            await checkCartAvailability()

            // Check again after re-check
            const currentUnavailable = new Set<string>()
            const equipmentIds = items.map(item => item.id)
            const { data: activeLoanData } = await supabase
                .from('loanRequests')
                .select('equipment_id')
                .in('equipment_id', equipmentIds)
                .in('status', ['pending', 'approved'])

            activeLoanData?.forEach((loan: any) => {
                currentUnavailable.add(loan.equipment_id)
            })

            if (currentUnavailable.size > 0) {
                setUnavailableIds(currentUnavailable)
                setError('มีอุปกรณ์ที่ถูกยืมไปแล้วในรายการ กรุณานำออกก่อนส่งคำขอ')
                setIsSubmitting(false)
                return
            }

            if (mode === 'borrow') {
                // Use server action for each item
                const startDate = today

                for (const item of items) {
                    const formData = new FormData()
                    formData.set('equipmentId', item.id)
                    formData.set('startDate', startDate)
                    formData.set('endDate', endDate)
                    formData.set('returnTime', returnTime)

                    const result = await submitLoanRequest(null, formData)

                    if (result?.error) {
                        throw new Error(result.error)
                    }
                }
            } else {
                // Submit reservations
                for (const item of items) {
                    const result = await createReservation(
                        item.id,
                        reserveStartDate,
                        reserveEndDate
                    )
                    if (!result.success) {
                        throw new Error(result.error || `จองอุปกรณ์ ${item.name} ไม่สำเร็จ`)
                    }
                }
            }

            setSuccess(true)
            clearCart()

            // Redirect after short delay
            setTimeout(() => {
                onClose()
                router.push('/my-loans')
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
        ? (endDate && returnTime && validationErrors.length === 0 && !hasUnavailableItems && !hasPendingEvaluations)
        : (reserveStartDate && reserveEndDate && reservePickupTime && reserveReturnTime && validationErrors.length === 0 && !hasUnavailableItems && !hasPendingEvaluations)

    // Format date for Thai display
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
                        onClick={() => { setShowConfirmation(false); onClose(); }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Pending evaluations warning */}
                    {hasPendingEvaluations && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Star className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-orange-800">
                                        กรุณาประเมินอุปกรณ์ก่อนยืม/จองใหม่
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        คุณมีอุปกรณ์ที่คืนแล้วแต่ยังไม่ได้ประเมิน {pendingEvaluationCount} รายการ
                                    </p>
                                    <a
                                        href="/my-loans"
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-orange-700 hover:text-orange-900 underline"
                                    >
                                        <Star className="w-3 h-3" />
                                        ไปประเมินเลย
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

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
                        /* Bug 3: Confirmation Dialog */
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="text-center mb-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                    ยืนยันการ{mode === 'borrow' ? 'ยืม' : 'จอง'}อุปกรณ์
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">กรุณาตรวจสอบข้อมูลก่อนส่งคำขอ</p>
                            </div>

                            {/* Summary: Equipment List */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">📦 รายการอุปกรณ์</h4>
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 text-sm">
                                        <img src={item.imageUrl} alt={item.name} className="w-8 h-8 object-contain bg-white rounded" />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{item.equipment_number}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary: Date & Time */}
                            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                                <h4 className="text-sm font-semibold text-blue-800">📅 กำหนดการ</h4>
                                {mode === 'borrow' ? (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-700">วันที่รับ:</span>
                                            <span className="font-medium text-blue-900">{formatThaiDateShort(today)} (วันนี้)</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-700">วันที่คืน:</span>
                                            <span className="font-medium text-blue-900">{formatThaiDateShort(endDate)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-700">⏰ เวลาคืน:</span>
                                            <span className="font-bold text-lg text-blue-900">{returnTime} น.</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-700">วันที่รับ:</span>
                                            <span className="font-medium text-blue-900">{formatThaiDateShort(reserveStartDate)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-700">เวลารับ:</span>
                                            <span className="font-medium text-blue-900">{reservePickupTime} น.</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-700">วันที่คืน:</span>
                                            <span className="font-medium text-blue-900">{formatThaiDateShort(reserveEndDate)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-blue-700">⏰ เวลาคืน:</span>
                                            <span className="font-bold text-lg text-blue-900">{reserveReturnTime} น.</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Confirm / Cancel Buttons */}
                            <div className="space-y-2 pt-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-colors ${mode === 'borrow'
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                        } disabled:opacity-60`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            กำลังส่งคำขอ...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            ยืนยัน {mode === 'borrow' ? 'ส่งคำขอยืม' : 'ส่งคำขอจอง'}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    ย้อนกลับแก้ไข
                                </button>
                            </div>

                            {/* Error in confirmation */}
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-500">ยังไม่มีรายการ</h3>
                            <p className="text-sm text-gray-400 mt-1">เลือกอุปกรณ์ที่ต้องการยืม</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Tab Switch */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setMode('borrow')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${mode === 'borrow'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Send className="w-4 h-4" />
                                    ยืมทันที
                                </button>
                                <button
                                    onClick={() => setMode('reserve')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${mode === 'reserve'
                                        ? 'bg-white text-purple-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Bookmark className="w-4 h-4" />
                                    จองล่วงหน้า
                                </button>
                            </div>

                            {/* Bug 2: Unavailable Items Warning */}
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

                            {/* Item List */}
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const isUnavailable = unavailableIds.has(item.id)
                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${isUnavailable
                                                ? 'bg-red-50 border border-red-200'
                                                : 'bg-gray-50'
                                                }`}
                                        >
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className={`w-16 h-16 object-contain bg-white rounded-lg ${isUnavailable ? 'opacity-50' : ''}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-medium truncate ${isUnavailable ? 'text-red-700' : 'text-gray-900'}`}>{item.name}</h4>
                                                <p className="text-xs text-gray-500 font-mono">{item.equipment_number}</p>
                                                {isUnavailable && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        ไม่พร้อมให้ยืม / ถูกยืมแล้ว
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="นำออกจากรายการ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Refresh Availability Button */}
                            <button
                                onClick={checkCartAvailability}
                                disabled={isCheckingAvailability}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${isCheckingAvailability ? 'animate-spin' : ''}`} />
                                {isCheckingAvailability ? 'กำลังตรวจสอบ...' : 'ตรวจสอบความพร้อมอุปกรณ์'}
                            </button>

                            {/* User Limits Info */}
                            <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                                <p className="text-blue-800">
                                    <strong>{profile?.user_type === 'student' ? 'นักศึกษา' : profile?.user_type === 'lecturer' ? 'อาจารย์' : 'บุคลากร'}</strong>:
                                    {' '}ยืมได้สูงสุด {maxItems} ชิ้น, {maxDays} วัน
                                </p>
                                <p className="text-blue-700 text-xs">
                                    🕐 เปิด {openingTime}-{closingTime} น.
                                    {breakStartTime && breakEndTime && ` (พัก ${breakStartTime}-${breakEndTime})`}
                                </p>
                            </div>

                            {/* Form Fields */}
                            {mode === 'borrow' ? (
                                /* Borrow Mode Form */
                                <div className="space-y-3 pt-2">
                                    {/* Start Date - Auto today */}
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>วันที่รับอุปกรณ์:</span>
                                            <strong className="text-gray-900">
                                                {new Date().toLocaleDateString('th-TH', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })} (วันนี้)
                                            </strong>
                                        </div>
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            วันที่คืนอุปกรณ์
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            min={today}
                                            max={getMaxEndDate()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Return Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            เวลาคืนอุปกรณ์ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={returnTime}
                                            onChange={(e) => setReturnTime(e.target.value)}
                                            min={openingTime}
                                            max={closingTime}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!returnTime ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                                                }`}
                                            placeholder="กรุณาเลือกเวลาคืน"
                                        />
                                        {!returnTime && (
                                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                กรุณาระบุเวลาที่จะนำอุปกรณ์มาคืน
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Reserve Mode Form */
                                <div className="space-y-3 pt-2">
                                    {/* Reserve Start Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            วันที่รับอุปกรณ์
                                        </label>
                                        <input
                                            type="date"
                                            value={reserveStartDate}
                                            onChange={(e) => {
                                                setReserveStartDate(e.target.value)
                                                // Auto-set end date if not set or invalid
                                                if (!reserveEndDate || new Date(reserveEndDate) < new Date(e.target.value)) {
                                                    const start = new Date(e.target.value)
                                                    start.setDate(start.getDate() + 1)
                                                    setReserveEndDate(start.toISOString().split('T')[0])
                                                }
                                            }}
                                            min={tomorrow}
                                            max={getMaxAdvanceDate()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    {/* Pickup Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            เวลารับอุปกรณ์
                                        </label>
                                        <input
                                            type="time"
                                            value={reservePickupTime}
                                            onChange={(e) => setReservePickupTime(e.target.value)}
                                            min={openingTime}
                                            max={closingTime}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    {/* Reserve End Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            วันที่คืนอุปกรณ์
                                        </label>
                                        <input
                                            type="date"
                                            value={reserveEndDate}
                                            onChange={(e) => setReserveEndDate(e.target.value)}
                                            min={reserveStartDate || tomorrow}
                                            max={getReserveMaxEndDate()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    {/* Return Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            เวลาคืนอุปกรณ์ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="time"
                                            value={reserveReturnTime}
                                            onChange={(e) => setReserveReturnTime(e.target.value)}
                                            min={openingTime}
                                            max={closingTime}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${!reserveReturnTime ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                                                }`}
                                            placeholder="กรุณาเลือกเวลาคืน"
                                        />
                                        {!reserveReturnTime && (
                                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                กรุณาระบุเวลาที่จะนำอุปกรณ์มาคืน
                                            </p>
                                        )}
                                    </div>

                                    {/* Reserve Mode Info */}
                                    <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                                        <p>📅 สามารถจองล่วงหน้าได้สูงสุด {maxAdvanceBookingDays} วัน</p>
                                    </div>
                                </div>
                            )}

                            {/* Validation Errors */}
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

                            {/* Error Message */}
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
                            onClick={handleShowConfirmation}
                            disabled={isSubmitting || !isFormValid}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${mode === 'borrow'
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
