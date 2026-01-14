'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './CartContext'
import { useProfile } from '@/hooks/useProfile'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import { X, Trash2, ShoppingCart, Send, Calendar, Clock, Loader2, AlertCircle, CheckCircle, Bookmark } from 'lucide-react'
import { createReservation } from '@/lib/reservations'

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
    const getMaxEndDate = () => {
        const start = new Date(today)
        start.setDate(start.getDate() + maxDays)
        return start.toISOString().split('T')[0]
    }

    // Calculate max end date for reserve mode
    const getReserveMaxEndDate = () => {
        if (!reserveStartDate) return ''
        const start = new Date(reserveStartDate)
        start.setDate(start.getDate() + maxDays)
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

    const handleSubmit = async () => {
        // Clear previous errors
        setError(null)

        if (items.length === 0) {
            setError('กรุณาเลือกอุปกรณ์')
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

        setIsSubmitting(true)

        try {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            // Get access token
            const { createBrowserClient } = await import('@supabase/ssr')
            const supabase = createBrowserClient(url!, key!)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.user) {
                setError('กรุณาเข้าสู่ระบบก่อนส่งคำขอ')
                setIsSubmitting(false)
                return
            }

            const accessToken = session.access_token

            if (mode === 'borrow') {
                // Submit loan requests
                const startDate = today

                await Promise.all(
                    items.map(async (item) => {
                        const response = await fetch(`${url}/rest/v1/loanRequests`, {
                            method: 'POST',
                            headers: {
                                'apikey': key || '',
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation',
                            },
                            body: JSON.stringify({
                                user_id: session.user.id,
                                equipment_id: item.id,
                                start_date: startDate,
                                end_date: endDate,
                                return_time: returnTime,
                                status: 'pending',
                            }),
                        })

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}))
                            throw new Error(errorData.message || `ส่งคำขอยืม ${item.name} ไม่สำเร็จ`)
                        }

                        return response.json()
                    })
                )
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
        ? (endDate && returnTime && validationErrors.length === 0)
        : (reserveStartDate && reserveEndDate && reservePickupTime && reserveReturnTime && validationErrors.length === 0)

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                onClick={onClose}
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
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
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

                            {/* Item List */}
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-16 h-16 object-contain bg-white rounded-lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                                            <p className="text-xs text-gray-500 font-mono">{item.equipment_number}</p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

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
                                            เวลาคืนอุปกรณ์
                                        </label>
                                        <input
                                            type="time"
                                            value={returnTime}
                                            onChange={(e) => setReturnTime(e.target.value)}
                                            min={openingTime}
                                            max={closingTime}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
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
                                            เวลาคืนอุปกรณ์
                                        </label>
                                        <input
                                            type="time"
                                            value={reserveReturnTime}
                                            onChange={(e) => setReserveReturnTime(e.target.value)}
                                            min={openingTime}
                                            max={closingTime}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
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
                {!success && items.length > 0 && (
                    <div className="p-4 border-t border-gray-200 space-y-3">
                        <button
                            onClick={handleSubmit}
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
                                    ส่งคำขอยืม ({items.length} รายการ)
                                </>
                            ) : (
                                <>
                                    <Bookmark className="w-5 h-5" />
                                    ส่งคำขอจอง ({items.length} รายการ)
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
