'use client'

import { useSystemConfig } from '@/hooks/useSystemConfig'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, AlertCircle, Users, Loader2, AlertTriangle, Calendar, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { getActiveSpecialLoans, SpecialLoan } from '@/lib/specialLoans'

type LoanLimitsByType = {
    student: { max_days: number; max_items: number }
    lecturer: { max_days: number; max_items: number }
    staff: { max_days: number; max_items: number }
}

const userTypeLabels: Record<string, string> = {
    student: 'นักศึกษา',
    lecturer: 'อาจารย์',
    staff: 'บุคลากร'
}

export default function RulesSection() {
    const { data: config, isLoading } = useSystemConfig()
    const [showEquipmentList, setShowEquipmentList] = useState(false)

    // Fetch active special loans
    const { data: activeSpecialLoans = [] } = useQuery<SpecialLoan[]>({
        queryKey: ['active-special-loans'],
        queryFn: () => getActiveSpecialLoans(),
        staleTime: 60000
    })

    if (isLoading) {
        return (
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                </div>
            </section>
        )
    }

    const loanLimits = config?.loan_limits_by_type as LoanLimitsByType | null

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    // Simplified rules - removed duplicate operating hours (now shown in HoursSection)
    const rules = [
        {
            icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
            title: "สิทธิ์การยืม",
            description: "เฉพาะผู้ใช้ที่ได้รับการอนุมัติแล้วเท่านั้นจึงจะสามารถยืมอุปกรณ์ได้"
        },
        {
            icon: <Users className="w-6 h-6 text-purple-600" />,
            title: "ระยะเวลายืม",
            description: loanLimits
                ? `นักศึกษา: ${loanLimits.student?.max_days || 3} วัน | อาจารย์: ${loanLimits.lecturer?.max_days || 7} วัน | บุคลากร: ${loanLimits.staff?.max_days || 5} วัน`
                : "ระยะเวลายืมขึ้นอยู่กับประเภทผู้ใช้"
        },
        {
            icon: <AlertCircle className="w-6 h-6 text-orange-600" />,
            title: "การคืนล่าช้า",
            description: "การคืนอุปกรณ์ล่าช้าอาจถูกระงับสิทธิ์การยืมในครั้งต่อไป"
        }
    ]

    return (
        <section className="py-10 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">กฎระเบียบการยืม</h2>
                    <p className="mt-2 text-base text-gray-500 max-w-2xl mx-auto">
                        กรุณาปฏิบัติตามกฎระเบียบเพื่อให้บริการยืม-คืนเป็นไปอย่างราบรื่น
                    </p>
                </div>

                {/* Special Loan Notice */}
                {activeSpecialLoans.length > 0 && (
                    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-amber-100 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 mb-1 text-sm">
                                    ⚠️ แจ้งเตือนการยืมพิเศษ
                                </h3>
                                {activeSpecialLoans.map((loan) => (
                                    <div key={loan.id} className="mb-2 last:mb-0">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-amber-800">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(loan.loan_date)} - {formatDate(loan.return_date)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3 h-3" />
                                                {loan.equipment_type_name} × {loan.quantity}
                                            </span>
                                        </div>
                                        {loan.equipment_numbers && loan.equipment_numbers.length > 0 && (
                                            <div className="mt-1">
                                                <button
                                                    onClick={() => setShowEquipmentList(!showEquipmentList)}
                                                    className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1"
                                                >
                                                    หมายเลขครุภัณฑ์ที่ไม่พร้อมให้บริการ
                                                    {showEquipmentList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>
                                                {showEquipmentList && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {loan.equipment_numbers.map((num, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]"
                                                            >
                                                                {num}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {rules.map((rule, index) => (
                        <div
                            key={index}
                            className="p-5 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="mb-3 p-2.5 bg-white rounded-lg w-fit shadow-sm border border-gray-100">
                                {rule.icon}
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1.5">{rule.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {rule.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Loan Limits Table */}
                {loanLimits && (
                    <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">ขีดจำกัดการยืมตามประเภทผู้ใช้</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(['student', 'lecturer', 'staff'] as const).map((userType) => {
                                const limits = loanLimits[userType]
                                if (!limits) return null

                                return (
                                    <div
                                        key={userType}
                                        className="bg-white rounded-lg p-4 shadow-sm border border-blue-100"
                                    >
                                        <h4 className="font-semibold text-blue-900 mb-2 text-sm">{userTypeLabels[userType]}</h4>
                                        <div className="space-y-1.5 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">ยืมได้สูงสุด</span>
                                                <span className="font-medium text-gray-900">{limits.max_days} วัน</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">จำนวนอุปกรณ์</span>
                                                <span className="font-medium text-gray-900">{limits.max_items} ชิ้น</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}

