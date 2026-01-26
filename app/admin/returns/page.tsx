'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { useState, useMemo } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    RotateCcw, CheckCircle, AlertTriangle, User, Package,
    Calendar, Search, ClipboardCheck
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

type ConditionType = 'good' | 'damaged' | 'missing_parts'

const CONDITION_OPTIONS: { value: ConditionType; label: string; color: string }[] = [
    { value: 'good', label: 'สภาพดี', color: 'bg-green-100 text-green-700' },
    { value: 'damaged', label: 'ชำรุด', color: 'bg-red-100 text-red-700' },
    { value: 'missing_parts', label: 'ขาดชิ้นส่วน', color: 'bg-yellow-100 text-yellow-700' }
]

export default function AdminReturnsPage() {
    const queryClient = useQueryClient()
    const toast = useToast()
    const [searchTerm, setSearchTerm] = useState('')
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [selectedLoan, setSelectedLoan] = useState<any>(null)
    const [condition, setCondition] = useState<ConditionType>('good')
    const [notes, setNotes] = useState('')

    // Fetch active loans (approved status)
    const { data: activeLoans, isLoading } = useQuery({
        queryKey: ['admin-active-loans'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            const response = await fetch(
                `${url}/rest/v1/loanRequests?status=eq.approved&select=*,profiles(first_name,last_name,email,phone_number),equipment(id,name,equipment_number,images)&order=end_date.asc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        }
    })

    // Process return mutation
    const processReturnMutation = useMutation({
        mutationFn: async ({ loanId, equipmentId, condition, notes }: {
            loanId: string,
            equipmentId: string,
            condition: ConditionType,
            notes: string
        }) => {
            const { url, key } = getSupabaseCredentials()

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            if (!session?.access_token) {
                throw new Error('กรุณาเข้าสู่ระบบก่อน')
            }

            // Update loan request to returned
            const loanResponse = await fetch(`${url}/rest/v1/loanRequests?id=eq.${loanId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'returned',
                    returned_at: new Date().toISOString(),
                    return_condition: condition,
                    return_notes: notes
                })
            })

            if (!loanResponse.ok) throw new Error('Failed to update loan')

            // Update equipment status back to ready (if not damaged)
            const newStatus = condition === 'good' ? 'ready' : 'maintenance'
            const equipmentResponse = await fetch(`${url}/rest/v1/equipment?id=eq.${equipmentId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            })

            if (!equipmentResponse.ok) {
                console.warn('Failed to update equipment status')
            }

            return { condition }
        },
        onSuccess: ({ condition }) => {
            queryClient.invalidateQueries({ queryKey: ['admin-active-loans'] })
            queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] })
            setShowReturnModal(false)
            setSelectedLoan(null)
            setCondition('good')
            setNotes('')

            if (condition === 'good') {
                toast.success('บันทึกการคืนเรียบร้อยแล้ว')
            } else {
                toast.warning('บันทึกการคืนแล้ว - อุปกรณ์ถูกส่งซ่อมบำรุง')
            }
        },
        onError: () => {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
    })

    // Filter active loans
    const filteredLoans = useMemo(() => {
        if (!activeLoans) return []
        return activeLoans.filter((loan: any) => {
            const searchLower = searchTerm.toLowerCase()
            return !searchTerm ||
                (loan.profiles?.first_name || '').toLowerCase().includes(searchLower) ||
                (loan.profiles?.last_name || '').toLowerCase().includes(searchLower) ||
                (loan.equipment?.name || '').toLowerCase().includes(searchLower) ||
                (loan.equipment?.equipment_number || '').toLowerCase().includes(searchLower)
        })
    }, [activeLoans, searchTerm])

    const handleReturnClick = (loan: any) => {
        setSelectedLoan(loan)
        setCondition('good')
        setNotes('')
        setShowReturnModal(true)
    }

    const handleReturnConfirm = () => {
        if (selectedLoan) {
            processReturnMutation.mutate({
                loanId: selectedLoan.id,
                equipmentId: selectedLoan.equipment?.id,
                condition,
                notes
            })
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const isOverdue = (request: any) => {
        const endDate = new Date(request.end_date)
        const now = new Date()

        if (request.return_time) {
            const [hours, minutes] = request.return_time.split(':').map(Number)
            endDate.setHours(hours, minutes, 0, 0)
            return endDate < now
        }

        // For standard loans (no time), default to end of day
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        today.setHours(0, 0, 0, 0)

        // If end_date is strictly before today (without time), it's overdue
        // Note: endDate from DB is typically YYYY-MM-DDT00:00:00
        // So we compare dates primarily.

        // Let's use the logic: Overdue if end_date < today (meaning yesterday was the last day)
        // But if end_date == today, it's not overdue yet (until midnight)

        const loanEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        return loanEndDate < today
    }

    return (
        <AdminLayout title="รับคืนอุปกรณ์" subtitle="ตรวจสอบสภาพและบันทึกการคืนอุปกรณ์">
            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาผู้ยืม หรืออุปกรณ์..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Active Loans List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        รายการกำลังยืม ({filteredLoans.length})
                    </h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
                ) : filteredLoans.length === 0 ? (
                    <div className="p-12 text-center">
                        <RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่มีอุปกรณ์ที่กำลังยืมอยู่</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLoans.map((loan: any) => {
                            const overdue = isOverdue(loan)
                            return (
                                <div key={loan.id} className={`p-4 hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {loan.equipment?.images?.[0] ? (
                                                    <img src={loan.equipment.images[0]} alt="" className="w-16 h-16 object-cover" />
                                                ) : (
                                                    <Package className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{loan.equipment?.name}</h3>
                                                <p className="text-sm text-gray-500 font-mono">{loan.equipment?.equipment_number}</p>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                                    <User className="w-4 h-4" />
                                                    <span>{loan.profiles?.first_name} {loan.profiles?.last_name}</span>
                                                    {loan.profiles?.phone_number && (
                                                        <span className="text-gray-400">• {loan.profiles.phone_number}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                        กำหนดคืน: {formatDate(loan.end_date)}
                                                        {loan.return_time && ` เวลา ${loan.return_time.slice(0, 5)} น.`}
                                                        {overdue && ' (เกินกำหนด)'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 lg:flex-shrink-0">
                                            {overdue && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    ค้างคืน
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleReturnClick(loan)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <ClipboardCheck className="w-4 h-4" />
                                                รับคืน
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Return Modal */}
            {showReturnModal && selectedLoan && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">บันทึกการคืนอุปกรณ์</h3>

                        {/* Equipment Info */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="font-medium text-gray-900">{selectedLoan.equipment?.name}</p>
                            <p className="text-sm text-gray-500">{selectedLoan.equipment?.equipment_number}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                ผู้ยืม: {selectedLoan.profiles?.first_name} {selectedLoan.profiles?.last_name}
                            </p>
                        </div>

                        {/* Condition Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                สภาพอุปกรณ์
                            </label>
                            <div className="space-y-2">
                                {CONDITION_OPTIONS.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${condition === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="condition"
                                            value={option.value}
                                            checked={condition === option.value}
                                            onChange={(e) => setCondition(e.target.value as ConditionType)}
                                            className="sr-only"
                                        />
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${option.color}`}>
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        {condition !== 'good' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    รายละเอียดความเสียหาย
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="ระบุรายละเอียด..."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>
                        )}

                        {/* Warning for damaged equipment */}
                        {condition !== 'good' && (
                            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-700">
                                        <p className="font-medium">อุปกรณ์จะถูกส่งซ่อมบำรุง</p>
                                        <p>Admin จะได้รับการแจ้งเตือนเกี่ยวกับความเสียหายนี้</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowReturnModal(false)
                                    setSelectedLoan(null)
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleReturnConfirm}
                                disabled={processReturnMutation.isPending}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                {processReturnMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันการคืน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
