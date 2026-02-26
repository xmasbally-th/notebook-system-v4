'use client'

import { useTransition, useState, useMemo } from 'react'
import {
    RotateCcw, AlertTriangle, User, Package, Calendar, Search, ClipboardCheck
} from 'lucide-react'
import Image from 'next/image'
import { processReturn } from '@/app/admin/loans/actions'
import { useToast } from '@/components/ui/toast'
import ReturnModal from './ReturnModal'

interface ActiveLoan {
    id: string
    end_date: string
    return_time?: string | null
    profiles?: {
        first_name?: string; last_name?: string
        email?: string; phone_number?: string; avatar_url?: string
    } | null
    equipment?: { id?: string; name?: string; equipment_number?: string; images?: string[] } | null
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

const isOverdue = (loan: ActiveLoan) => {
    const endDate = new Date(loan.end_date)
    const now = new Date()
    if (loan.return_time) {
        const [h, m] = loan.return_time.split(':').map(Number)
        endDate.setHours(h, m, 0, 0)
        return endDate < now
    }
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const loanEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    return loanEnd < today
}

interface Props {
    initialData: ActiveLoan[]
}

export default function ActiveLoansSection({ initialData }: Props) {
    const toast = useToast()
    const [isPending, startTransition] = useTransition()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedLoan, setSelectedLoan] = useState<ActiveLoan | null>(null)

    const filteredLoans = useMemo(() => {
        if (!searchTerm) return initialData
        const s = searchTerm.toLowerCase()
        return initialData.filter(loan =>
            (loan.profiles?.first_name || '').toLowerCase().includes(s) ||
            (loan.profiles?.last_name || '').toLowerCase().includes(s) ||
            (loan.equipment?.name || '').toLowerCase().includes(s) ||
            (loan.equipment?.equipment_number || '').toLowerCase().includes(s)
        )
    }, [initialData, searchTerm])

    const handleReturn = (loan: ActiveLoan) => {
        setSelectedLoan(loan)
    }

    const handleReturnConfirm = (condition: 'good' | 'damaged' | 'missing_parts', notes: string) => {
        if (!selectedLoan?.equipment?.id) return
        startTransition(async () => {
            const result = await processReturn(
                selectedLoan.id,
                selectedLoan.equipment!.id!,
                condition,
                notes
            )
            if (result.error) {
                toast.error(result.error)
            } else {
                setSelectedLoan(null)
                if (result.condition === 'good') {
                    toast.success('บันทึกการคืนเรียบร้อยแล้ว')
                } else {
                    toast.warning('บันทึกการคืนแล้ว — อุปกรณ์ถูกส่งซ่อมบำรุง')
                }
            }
        })
    }

    return (
        <>
            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาผู้ยืม หรืออุปกรณ์..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        รายการกำลังยืม ({filteredLoans.length})
                    </h2>
                </div>

                {filteredLoans.length === 0 ? (
                    <div className="p-12 text-center">
                        <RotateCcw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">ไม่มีอุปกรณ์ที่กำลังยืมอยู่</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLoans.map(loan => {
                            const overdue = isOverdue(loan)
                            return (
                                <div key={loan.id} className={`p-4 hover:bg-gray-50 ${overdue ? 'bg-red-50' : ''}`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {loan.equipment?.images?.[0] ? (
                                                    <Image src={loan.equipment.images[0]} alt="" width={64} height={64} className="object-cover" />
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
                                                onClick={() => handleReturn(loan)}
                                                disabled={isPending}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
            {selectedLoan && (
                <ReturnModal
                    loan={selectedLoan}
                    isPending={isPending}
                    onConfirm={handleReturnConfirm}
                    onClose={() => setSelectedLoan(null)}
                />
            )}
        </>
    )
}
