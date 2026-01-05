'use client'

import { useSystemConfig } from '@/hooks/useSystemConfig'
import { ShieldCheck, Clock, AlertCircle, Users, Loader2 } from 'lucide-react'

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
    const openingTime = config?.opening_time || '08:30'
    const closingTime = config?.closing_time || '16:30'

    // Build rules from config
    const rules = [
        {
            icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
            title: "สิทธิ์การยืม",
            description: "เฉพาะผู้ใช้ที่ได้รับการอนุมัติแล้วเท่านั้นจึงจะสามารถยืมอุปกรณ์ได้"
        },
        {
            icon: <Clock className="w-6 h-6 text-blue-600" />,
            title: "เวลาทำการ",
            description: `เปิดให้บริการเวลา ${openingTime} - ${closingTime} น. ในวันทำการ`
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
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">กฎระเบียบการยืม</h2>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        กรุณาปฏิบัติตามกฎระเบียบเพื่อให้บริการยืม-คืนเป็นไปอย่างราบรื่น
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {rules.map((rule, index) => (
                        <div
                            key={index}
                            className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="mb-4 p-3 bg-white rounded-lg w-fit shadow-sm border border-gray-100">
                                {rule.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{rule.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {rule.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Loan Limits Table */}
                {loanLimits && (
                    <div className="mt-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">ขีดจำกัดการยืมตามประเภทผู้ใช้</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(['student', 'lecturer', 'staff'] as const).map((userType) => {
                                const limits = loanLimits[userType]
                                if (!limits) return null

                                return (
                                    <div
                                        key={userType}
                                        className="bg-white rounded-xl p-5 shadow-sm border border-blue-100"
                                    >
                                        <h4 className="font-semibold text-blue-900 mb-3">{userTypeLabels[userType]}</h4>
                                        <div className="space-y-2 text-sm">
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
