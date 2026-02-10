'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    Loader2,
    Plus,
    Printer,
    Check,
    XCircle,
    FileStack,
    Calendar,
    User,
    Package,
    ChevronDown,
    ChevronUp,
    Search,
    AlertTriangle
} from 'lucide-react'
import { getSpecialLoans, completeSpecialLoan, cancelSpecialLoan, SpecialLoan } from '@/lib/specialLoans'
import SpecialLoanForm from '@/components/admin/SpecialLoanForm'
import SpecialLoanPrint from '@/components/admin/SpecialLoanPrint'
import { useSystemConfig } from '@/hooks/useSystemConfig'

type TabType = 'active' | 'returned' | 'all'

export default function AdminSpecialLoansPage() {
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<TabType>('active')
    const [showForm, setShowForm] = useState(false)
    const [printLoan, setPrintLoan] = useState<SpecialLoan | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch system config for logo
    const { data: config } = useSystemConfig()

    // Fetch special loans
    const { data: loans = [], isLoading } = useQuery({
        queryKey: ['special-loans', activeTab === 'all' ? undefined : activeTab],
        queryFn: () => getSpecialLoans(activeTab === 'all' ? undefined : activeTab as 'active' | 'returned'),
        staleTime: 30000
    })

    // Complete mutation
    const completeMutation = useMutation({
        mutationFn: completeSpecialLoan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['special-loans'] })
            alert('บันทึกการคืนเรียบร้อยแล้ว')
        },
        onError: (error: any) => {
            alert(error?.message || 'เกิดข้อผิดพลาด')
        }
    })

    // Cancel mutation
    const cancelMutation = useMutation({
        mutationFn: cancelSpecialLoan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['special-loans'] })
            alert('ยกเลิกยืมพิเศษเรียบร้อยแล้ว')
        },
        onError: (error: any) => {
            alert(error?.message || 'เกิดข้อผิดพลาด')
        }
    })

    // Filter loans by search
    const filteredLoans = loans.filter((loan: SpecialLoan) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            loan.borrower_name.toLowerCase().includes(query) ||
            loan.equipment_type_name.toLowerCase().includes(query) ||
            loan.purpose.toLowerCase().includes(query)
        )
    })

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: hasTime ? '2-digit' : undefined,
            minute: hasTime ? '2-digit' : undefined,
        }) + (hasTime ? ' น.' : '')
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">กำลังยืม</span>
            case 'returned':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">คืนแล้ว</span>
            case 'cancelled':
                return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">ยกเลิก</span>
            default:
                return null
        }
    }

    const handleComplete = (id: string) => {
        if (confirm('ยืนยันการบันทึกการคืนอุปกรณ์?')) {
            completeMutation.mutate(id)
        }
    }

    const handleCancel = (id: string) => {
        if (confirm('ยืนยันการยกเลิกยืมพิเศษ?')) {
            cancelMutation.mutate(id)
        }
    }

    if (isLoading) {
        return (
            <AdminLayout title="ยืมพิเศษ" subtitle="จัดการการยืมอุปกรณ์จำนวนมาก">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout title="ยืมพิเศษ" subtitle="จัดการการยืมอุปกรณ์จำนวนมากสำหรับอาจารย์">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>สร้างยืมพิเศษ</span>
                </button>

                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาผู้ยืม, อุปกรณ์..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
                <div className="flex">
                    {[
                        { id: 'active', label: 'กำลังยืม', count: loans.filter((l: SpecialLoan) => l.status === 'active').length },
                        { id: 'returned', label: 'คืนแล้ว', count: loans.filter((l: SpecialLoan) => l.status === 'returned').length },
                        { id: 'all', label: 'ทั้งหมด', count: loans.length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Loans List */}
            {filteredLoans.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <FileStack className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">ไม่พบรายการยืมพิเศษ</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredLoans.map((loan: SpecialLoan) => (
                        <div
                            key={loan.id}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                            {/* Card Header */}
                            <div
                                onClick={() => setExpandedId(expandedId === loan.id ? null : loan.id)}
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <FileStack className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{loan.borrower_name}</h3>
                                            {getStatusBadge(loan.status)}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {loan.equipment_type_name} × {loan.quantity} | {formatDate(loan.loan_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {loan.status === 'active' && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setPrintLoan(loan) }}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="พิมพ์"
                                            >
                                                <Printer className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleComplete(loan.id) }}
                                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                title="บันทึกการคืน"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                    {expandedId === loan.id ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === loan.id && (
                                <div className="border-t border-gray-100 p-4 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-500">ผู้ยืม:</span>
                                            <span className="text-gray-900">{loan.borrower_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-500">จำนวน:</span>
                                            <span className="text-gray-900">{loan.quantity} ชิ้น</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-500">วันที่ยืม:</span>
                                            <span className="text-gray-900">{formatDate(loan.loan_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-500">วันที่คืน:</span>
                                            <span className="text-gray-900">{formatDate(loan.return_date)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 mb-1">วัตถุประสงค์:</p>
                                        <p className="text-sm text-gray-900">{loan.purpose}</p>
                                    </div>

                                    {loan.equipment_numbers && loan.equipment_numbers.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 mb-2">หมายเลขครุภัณฑ์:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {loan.equipment_numbers.map((num, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
                                                    >
                                                        {num}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {loan.status === 'active' && (
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => setPrintLoan(loan)}
                                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                                            >
                                                <Printer className="w-4 h-4" />
                                                พิมพ์ใบยืม
                                            </button>
                                            <button
                                                onClick={() => handleComplete(loan.id)}
                                                disabled={completeMutation.isPending}
                                                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                                            >
                                                <Check className="w-4 h-4" />
                                                บันทึกการคืน
                                            </button>
                                            <button
                                                onClick={() => handleCancel(loan.id)}
                                                disabled={cancelMutation.isPending}
                                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                ยกเลิก
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Form Modal */}
            {showForm && (
                <SpecialLoanForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => {
                        setShowForm(false)
                        queryClient.invalidateQueries({ queryKey: ['special-loans'] })
                    }}
                />
            )}

            {/* Print Modal */}
            {printLoan && (
                <SpecialLoanPrint
                    loan={printLoan}
                    onClose={() => setPrintLoan(null)}
                    logoUrl={config?.document_logo_url}
                    templateUrl={config?.document_template_url}
                />
            )}
        </AdminLayout>
    )
}
