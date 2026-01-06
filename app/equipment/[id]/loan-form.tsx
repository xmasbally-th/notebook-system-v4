'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { submitLoanRequest } from '../actions'
import { useLoanValidation } from '@/hooks/useLoanValidation'
import { useProfile } from '@/hooks/useProfile'
import { formatThaiDate, formatThaiTime } from '@/lib/formatThaiDate'
import {
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Calendar,
    AlertTriangle,
    Info,
    ShieldCheck
} from 'lucide-react'

interface LoanRequestFormProps {
    equipmentId: string
}

export default function LoanRequestForm({ equipmentId }: LoanRequestFormProps) {
    const router = useRouter()
    const { data: profile } = useProfile()
    const userType = profile?.user_type || 'student'

    const { validateDates, isLoading: validationLoading, config, currentLoanCount } = useLoanValidation(userType as 'student' | 'lecturer' | 'staff')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Form values
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [returnTime, setReturnTime] = useState('16:00')

    // Validation state
    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [validationWarnings, setValidationWarnings] = useState<string[]>([])

    // Validate on date/time change
    useEffect(() => {
        if (startDate && endDate && config) {
            const result = validateDates(startDate, endDate, returnTime)
            setValidationErrors(result.errors)
            setValidationWarnings(result.warnings)
        }
    }, [startDate, endDate, returnTime, config, validateDates])

    // Get min date (today)
    const today = new Date().toISOString().split('T')[0]

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Re-validate before submit
        const result = validateDates(startDate, endDate, returnTime)
        if (!result.isValid) {
            setValidationErrors(result.errors)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('equipmentId', equipmentId)
            formData.append('startDate', startDate)
            formData.append('endDate', `${endDate}T${returnTime}`)

            const submitResult = await submitLoanRequest(null, formData)
            if (submitResult?.error) {
                setError(submitResult.error)
            } else if (submitResult?.success) {
                setSuccess(true)
            }
        } catch (e: any) {
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">ส่งคำขอยืมสำเร็จ!</h3>
                <p className="text-green-600 text-sm mb-4">กรุณารอเจ้าหน้าที่อนุมัติคำขอของคุณ</p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => router.push('/my-loans')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        ดูประวัติการยืม
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                    >
                        กลับหน้าหลัก
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div id="borrow-form" className="space-y-6">
            {/* Rules Section */}
            {config && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <Info className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-2">กฎระเบียบการยืม</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                                    ยืมได้สูงสุด <strong>{config.maxDays} วัน</strong> ต่อครั้ง
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                                    ยืมได้ไม่เกิน <strong>{config.maxItems} รายการ</strong> พร้อมกัน
                                    <span className="text-blue-600 text-xs">
                                        (ปัจจุบัน: {currentLoanCount}/{config.maxItems})
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    เวลาทำการ: <strong>{config.openingTime} - {config.closingTime}</strong>
                                </li>
                            </ul>
                        </div>
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
                            วันที่ยืม
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            required
                            min={today}
                            className="w-full rounded-lg border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        {startDate && (
                            <p className="text-sm text-blue-600 mt-1 font-medium">
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
                            name="endDate"
                            required
                            min={startDate || today}
                            className="w-full rounded-lg border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        {endDate && (
                            <p className="text-sm text-blue-600 mt-1 font-medium">
                                ⇒ {formatThaiDate(endDate)} (พ.ศ.)
                            </p>
                        )}
                    </div>
                </div>

                {/* Return Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <Clock className="w-4 h-4 inline-block mr-1" />
                        เวลาที่จะมาคืน
                    </label>
                    <input
                        type="time"
                        name="returnTime"
                        required
                        className="w-full sm:w-auto rounded-lg border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                    />
                    <p className="text-sm text-blue-600 mt-1 font-medium">
                        ⇒ เวลา {returnTime} น. (รูปแบบ 24 ชั่วโมง)
                    </p>
                    {config && (
                        <p className="text-xs text-gray-500 mt-0.5">
                            เวลาทำการ: {config.openingTime} - {config.closingTime}
                        </p>
                    )}
                </div>



                {/* Validation Warnings */}
                {validationWarnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                {validationWarnings.map((warning, i) => (
                                    <p key={i} className="text-sm text-yellow-700">{warning}</p>
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
                    disabled={loading || validationLoading || validationErrors.length > 0}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading || validationLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {loading ? 'กำลังส่งคำขอ...' : 'กำลังตรวจสอบ...'}
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            ส่งคำขอยืม
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
