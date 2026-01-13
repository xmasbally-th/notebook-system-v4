'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from './CartContext'
import { useProfile } from '@/hooks/useProfile'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import { X, Trash2, ShoppingCart, Send, Calendar, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { formatThaiDate } from '@/lib/formatThaiDate'

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
}

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

    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
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

    // Calculate max end date
    const getMaxEndDate = () => {
        if (!startDate) return ''
        const start = new Date(startDate)
        start.setDate(start.getDate() + maxDays)
        return start.toISOString().split('T')[0]
    }

    const handleSubmit = async () => {
        if (items.length === 0 || !startDate || !endDate) {
            setError('กรุณาเลือกอุปกรณ์และวันที่ยืม-คืน')
            return
        }

        setIsSubmitting(true)
        setError(null)

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

            // Submit each item as a separate loan request
            const results = await Promise.all(
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
                            status: 'pending',
                        }),
                    })

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}))
                        throw new Error(errorData.message || `Failed to submit request for ${item.name}`)
                    }

                    return response.json()
                })
            )

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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">ส่งคำขอสำเร็จ!</h3>
                            <p className="text-gray-500">กำลังนำท่านไปยังหน้ารายการยืม...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-500">ยังไม่มีรายการ</h3>
                            <p className="text-sm text-gray-400 mt-1">เลือกอุปกรณ์ที่ต้องการยืม</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                            <div className="p-3 bg-blue-50 rounded-lg text-sm">
                                <p className="text-blue-800">
                                    <strong>{profile?.user_type === 'student' ? 'นักศึกษา' : profile?.user_type === 'lecturer' ? 'อาจารย์' : 'บุคลากร'}</strong>:
                                    ยืมได้สูงสุด {maxItems} ชิ้น, {maxDays} วัน
                                </p>
                            </div>

                            {/* Date Selection */}
                            <div className="space-y-3 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        วันที่รับอุปกรณ์
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value)
                                            // Auto-set end date if not set or invalid
                                            if (!endDate || new Date(endDate) < new Date(e.target.value)) {
                                                const start = new Date(e.target.value)
                                                start.setDate(start.getDate() + 1)
                                                setEndDate(start.toISOString().split('T')[0])
                                            }
                                        }}
                                        min={today}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        วันที่คืนอุปกรณ์
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || today}
                                        max={getMaxEndDate()}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

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
                            disabled={isSubmitting || !startDate || !endDate}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    กำลังส่งคำขอ...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    ส่งคำขอยืม ({items.length} รายการ)
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
