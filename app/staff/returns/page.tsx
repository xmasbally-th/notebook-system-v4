'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { useState, useMemo } from 'react'
import StaffLayout from '@/components/staff/StaffLayout'
import {
    RotateCcw, CheckCircle, AlertTriangle, User, Package,
    Calendar, Search, ClipboardCheck
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { returnLoan } from './actions'

type ConditionType = 'good' | 'damaged' | 'missing_parts'

const CONDITION_OPTIONS: { value: ConditionType; label: string; color: string }[] = [
    { value: 'good', label: 'สภาพดี', color: 'bg-green-100 text-green-700' },
    { value: 'damaged', label: 'ชำรุด', color: 'bg-red-100 text-red-700' },
    { value: 'missing_parts', label: 'ขาดชิ้นส่วน', color: 'bg-yellow-100 text-yellow-700' }
]

export default function StaffReturnsPage() {
    const queryClient = useQueryClient()
    const toast = useToast()
    const [searchTerm, setSearchTerm] = useState('')
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [selectedLoan, setSelectedLoan] = useState<any>(null)
    const [condition, setCondition] = useState<ConditionType>('good')
    const [notes, setNotes] = useState('')

    // Fetch active loans (approved status)
    const { data: activeLoans, isLoading } = useQuery({
        queryKey: ['staff-active-loans'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            const response = await fetch(
                `${url}/rest/v1/loanRequests?status=eq.approved&select=*,profiles!fk_loanrequests_profiles(first_name,last_name,email,phone_number),equipment(id,name,equipment_number,images)&order=end_date.asc`,
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
            notes: string,
            loanUserId: string
        }) => {
            const result = await returnLoan({
                loanId,
                equipmentId,
                condition,
                notes: notes || undefined
            })
            if (!result.success) {
                throw new Error(result.error || 'เกิดข้อผิดพลาดในการดำเนินการ')
            }
            return { condition }
        },
        onSuccess: ({ condition }) => {
            queryClient.invalidateQueries({ queryKey: ['staff-active-loans'] })
            queryClient.invalidateQueries({ queryKey: ['staff-dashboard-stats'] })
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
        onError: (error: any) => {
            toast.error(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
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
                notes,
                loanUserId: selectedLoan.user_id
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

        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        today.setHours(0, 0, 0, 0)

        const loanEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        return loanEndDate < today
    }

    return (
        <StaffLayout title="รับคืนอุปกรณ์" subtitle="ตรวจสอบสภาพและบันทึกการคืนอุปกรณ์">
            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาผู้ยืม หรืออุปกรณ์..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
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
                    <div className="divide-y divide-gray-100 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-5 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0"></div>
                                    <div className="flex-1 space-y-2.5">
                                        <div className="h-5 w-2/3 bg-gray-200 rounded"></div>
                                        <div className="h-6 w-28 bg-gray-200 rounded-md"></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                    <div className="h-4 w-40 bg-gray-200 rounded"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredLoans.length === 0 ? (
                    <div className="p-16 text-center bg-white rounded-2xl border border-gray-200/60 shadow-sm max-w-lg mx-auto my-8">
                        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20 duration-1000"></div>
                            <div className="absolute inset-0 bg-blue-50 rounded-full"></div>
                            <div className="absolute inset-2 bg-blue-100/40 rounded-full"></div>
                            <RotateCcw className="w-9 h-9 text-blue-600 relative z-10 drop-shadow-sm" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">ไม่มีครุภัณฑ์อุปกรณ์ที่กำลังถูกยืม</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto">
                            ในขณะนี้ยังไม่มีอุปกรณ์โน้ตบุ๊คหรือครุภัณฑ์ชิ้นใดที่มีสถานะกำลังถูกยืมใช้งานในระบบให้บริการยืมคืน
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLoans.map((loan: any) => {
                            const overdue = isOverdue(loan)
                            return (
                                <div key={loan.id} className={`p-5 hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50/50' : ''}`}>
                                    <div className="flex flex-col gap-4">
                                        {/* Header: Equipment info with image */}
                                        <div className="flex items-start gap-4">
                                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-gray-200">
                                                {loan.equipment?.images?.[0] ? (
                                                    <img src={loan.equipment.images[0]} alt="" className="w-20 h-20 object-cover" />
                                                ) : (
                                                    <Package className="w-10 h-10 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {/* Equipment Name */}
                                                <h3 className="text-lg font-semibold text-blue-700 leading-tight mb-1.5">
                                                    {loan.equipment?.name}
                                                </h3>
                                                {/* Equipment Number Badge */}
                                                <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-600 text-sm font-mono rounded-md border border-blue-100">
                                                    {loan.equipment?.equipment_number}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Borrower Info Section */}
                                        <div className="flex items-center gap-2 pl-1">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                                                <User className="w-3.5 h-3.5 text-gray-500" />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                                <span className="font-medium text-gray-800">
                                                    {loan.profiles?.first_name} {loan.profiles?.last_name}
                                                </span>
                                                {loan.profiles?.phone_number && (
                                                    <>
                                                        <span className="text-gray-300">•</span>
                                                        <a href={`tel:${loan.profiles.phone_number}`} className="text-blue-600 hover:underline font-medium">
                                                            {loan.profiles.phone_number}
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Due Date Section */}
                                        <div className="flex items-center gap-2 pl-1">
                                            <div className={`flex items-center justify-center w-6 h-6 rounded-full ${overdue ? 'bg-red-100' : 'bg-amber-50'}`}>
                                                <Calendar className={`w-3.5 h-3.5 ${overdue ? 'text-red-500' : 'text-amber-500'}`} />
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                                <span className="text-gray-500">กำหนดคืน:</span>
                                                <span className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {formatDate(loan.end_date)}
                                                    {loan.return_time && (
                                                        <span className="ml-1">เวลา {loan.return_time.slice(0, 5)} น.</span>
                                                    )}
                                                </span>
                                                {overdue && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        เกินกำหนด
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="pt-1">
                                            <button
                                                onClick={() => handleReturnClick(loan)}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-teal-700 hover:to-teal-600 transition-all shadow-sm hover:shadow"
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
                                            ? 'border-teal-500 bg-teal-50'
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
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                {processReturnMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันการคืน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </StaffLayout>
    )
}
