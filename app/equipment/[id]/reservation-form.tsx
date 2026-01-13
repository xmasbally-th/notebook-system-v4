'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createReservation } from '@/lib/reservations'
import { useReservationValidation } from '@/hooks/useReservationValidation'
import { useProfile } from '@/hooks/useProfile'
import { useEquipmentAvailability } from '@/hooks/useReservations'
import { formatThaiDate } from '@/lib/formatThaiDate'
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Calendar,
    AlertTriangle,
    Info,
    CalendarPlus
} from 'lucide-react'

interface ReservationFormProps {
    equipmentId: string
}

export default function ReservationForm({ equipmentId }: ReservationFormProps) {
    const router = useRouter()
    const { data: profile } = useProfile()
    const userType = profile?.user_type || 'student'
    const userRole = profile?.role || 'user'

    const { validateReservation, isLoading: validationLoading, config } = useReservationValidation(userType as 'student' | 'lecturer' | 'staff')
    const { data: availability } = useEquipmentAvailability(equipmentId)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Form values
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Validation
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [validationWarnings, setValidationWarnings] = useState<string[]>([])

    // Get min date (tomorrow for advance booking)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    // Get max date (based on config)
    const maxAdvanceDays = config?.maxAdvanceBookingDays || 30
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
    const maxDateStr = maxDate.toISOString().split('T')[0]

    // Check for date conflicts with existing reservations/loans
    const isDateConflict = (date: string): boolean => {
        if (!availability) return false
        const checkDate = new Date(date)

        const allBookings = [
            ...(availability.reservations || []),
            ...(availability.loans || [])
        ]

        return allBookings.some(booking => {
            const start = new Date(booking.start_date)
            const end = new Date(booking.end_date)
            return checkDate >= start && checkDate <= end
        })
    }

    // Validate on date change
    useEffect(() => {
        if (!startDate || !endDate) {
            setValidationErrors([])
            setValidationWarnings([])
            return
        }

        // Run main validation
        const result = validateReservation(startDate, endDate)

        // Additional conflict check
        const conflictErrors: string[] = []
        if (isDateConflict(startDate) || isDateConflict(endDate)) {
            conflictErrors.push('ช่วงวันที่เลือกมีการจองหรือยืมอยู่แล้ว')
        }

        setValidationErrors([...result.errors, ...conflictErrors])
        setValidationWarnings(result.warnings)
    }, [startDate, endDate, availability, validateReservation])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (validationErrors.length > 0) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            const result = await createReservation(
                equipmentId,
                `${startDate}T${config?.openingTime || '09:00'}:00`,
                `${endDate}T${config?.closingTime || '17:00'}:00`
            )

            if (result.success) {
                setSuccess(true)
            } else {
                setError(result.error || 'เกิดข้อผิดพลาด')
            }
        } catch (e: any) {
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        const isAutoApproved = userRole === 'staff' || userRole === 'admin'

        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                    {isAutoApproved ? 'จองสำเร็จ! (อนุมัติอัตโนมัติ)' : 'ส่งคำขอจองสำเร็จ!'}
                </h3>
                <p className="text-green-600 text-sm mb-4">
                    {isAutoApproved
                        ? 'การจองของคุณได้รับการอนุมัติแล้ว'
                        : 'กรุณารอเจ้าหน้าที่อนุมัติการจอง'
                    }
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => router.push('/my-reservations')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        ดูการจองของฉัน
                    </button>
                    <button
                        onClick={() => router.push('/equipment')}
                        className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                    >
                        กลับหน้าอุปกรณ์
                    </button>
                </div>
            </div>
        )
    }

    // Show loading while config loads
    if (validationLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-500">กำลังโหลดข้อมูล...</span>
            </div>
        )
    }

    // Check if reservation system is active
    if (config && !config.isReservationActive) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-yellow-800">ระบบจองปิดให้บริการ</h4>
                        <p className="text-sm text-yellow-700">ขณะนี้ระบบจองล่วงหน้าปิดให้บริการชั่วคราว</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Info Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <CalendarPlus className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-900 mb-1">จองล่วงหน้า</h4>
                        <p className="text-sm text-purple-700">
                            จองได้สูงสุด {maxAdvanceDays} วัน ยืมได้ {config?.maxDays || 7} วัน/ครั้ง
                            {(userRole === 'staff' || userRole === 'admin') && (
                                <span className="ml-1 text-purple-600 font-medium">
                                    (อนุมัติอัตโนมัติ)
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Operating Hours Info */}
            {config && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>เวลาทำการ: {config.openingTime} - {config.closingTime} น.</span>
                        {config.breakStartTime && config.breakEndTime && (
                            <span className="text-gray-400">| พัก {config.breakStartTime} - {config.breakEndTime} น.</span>
                        )}
                    </div>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-4 h-4 inline-block mr-1" />
                            วันที่รับอุปกรณ์
                        </label>
                        <input
                            type="date"
                            required
                            min={minDate}
                            max={maxDateStr}
                            className="w-full rounded-lg border-gray-300 border shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2.5"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        {startDate && (
                            <p className="text-sm text-purple-600 mt-1 font-medium">
                                ⇒ {formatThaiDate(startDate)} (พ.ศ.)
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            <Calendar className="w-4 h-4 inline-block mr-1" />
                            วันที่คืน
                        </label>
                        <input
                            type="date"
                            required
                            min={startDate || minDate}
                            max={maxDateStr}
                            className="w-full rounded-lg border-gray-300 border shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2.5"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        {endDate && (
                            <p className="text-sm text-purple-600 mt-1 font-medium">
                                ⇒ {formatThaiDate(endDate)} (พ.ศ.)
                            </p>
                        )}
                    </div>
                </div>

                {/* Validation Warnings */}
                {validationWarnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                {validationWarnings.map((warn, i) => (
                                    <p key={i} className="text-sm text-yellow-700">{warn}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                {validationErrors.map((err, i) => (
                                    <p key={i} className="text-sm text-red-700">{err}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Server Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || validationErrors.length > 0 || !startDate || !endDate}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังส่งคำขอ...
                        </>
                    ) : (
                        <>
                            <CalendarPlus className="w-5 h-5" />
                            จองล่วงหน้า
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
