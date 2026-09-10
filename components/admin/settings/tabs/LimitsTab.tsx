'use client'

import React from 'react'
import Link from 'next/link'
import { Users, Building2, ChevronRight } from 'lucide-react'
import { Database } from '@/supabase/types'

export type LoanLimitsByType = {
    [key: string]: {
        max_days: number
        max_items: number
        type_limits?: Record<string, number>
    }
}

export const defaultLoanLimits: LoanLimitsByType = {
    student: { max_days: 3, max_items: 1, type_limits: {} },
    lecturer: { max_days: 7, max_items: 3, type_limits: {} },
    staff: { max_days: 5, max_items: 2, type_limits: {} }
}

export const userTypeLabels: Record<string, string> = {
    student: 'นักศึกษา',
    lecturer: 'อาจารย์',
    staff: 'บุคลากร'
}

interface LimitsTabProps {
    loanLimits: LoanLimitsByType
    setLoanLimits: React.Dispatch<React.SetStateAction<LoanLimitsByType>>
    activeEquipmentTypes: any[]
    setIsDirty: (dirty: boolean) => void
}

export default function LimitsTab({
    loanLimits,
    setLoanLimits,
    activeEquipmentTypes,
    setIsDirty
}: LimitsTabProps) {
    const handleLoanLimitChange = (
        userType: 'student' | 'lecturer' | 'staff',
        field: 'max_days' | 'max_items',
        value: number
    ) => {
        setLoanLimits(prev => ({
            ...prev,
            [userType]: {
                ...prev[userType],
                [field]: value
            }
        }))
        setIsDirty(true)
    }

    return (
        <div className="space-y-6">
            {/* Loan Limits by User Type */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">ขีดจำกัดตามประเภทผู้ใช้</h2>
                        <p className="text-sm text-gray-500 hidden sm:block">กำหนดจำนวนวันและอุปกรณ์สูงสุดสำหรับแต่ละประเภท</p>
                    </div>
                </div>

                {/* Mobile View */}
                <div className="sm:hidden space-y-4">
                    {(['student', 'lecturer', 'staff'] as const).map(userType => (
                        <div key={userType} className="p-4 bg-gray-50 rounded-xl">
                            <p className="font-medium text-gray-900 mb-3">{userTypeLabels[userType]}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">จำนวนวัน</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full text-center px-3 py-2 border border-gray-200 rounded-lg"
                                        value={loanLimits[userType]?.max_days || 1}
                                        onChange={e => handleLoanLimitChange(userType, 'max_days', parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 mb-1 block">จำนวนอุปกรณ์</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full text-center px-3 py-2 border border-gray-200 rounded-lg"
                                        value={loanLimits[userType]?.max_items || 1}
                                        onChange={e => handleLoanLimitChange(userType, 'max_items', parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="space-y-6">
                    {(['student', 'lecturer', 'staff'] as const).map(userType => (
                        <div key={userType} className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">{userTypeLabels[userType]}</h3>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">จำนวนวันสูงสุด:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={loanLimits[userType]?.max_days || 1}
                                            onChange={e => handleLoanLimitChange(userType, 'max_days', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">จำนวนอุปกรณ์รวมสูงสุด:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={loanLimits[userType]?.max_items || 1}
                                            onChange={e => handleLoanLimitChange(userType, 'max_items', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white">
                                <p className="text-sm font-medium text-gray-700 mb-3">ขีดจำกัดแยกตามประเภทอุปกรณ์ (ระบุ 0 เพื่อใช้ตามค่าปกติ)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {(Array.isArray(activeEquipmentTypes) ? activeEquipmentTypes : []).map((type: Database['public']['Tables']['equipment_types']['Row']) => (
                                        <div key={type.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">{type.icon}</span>
                                                <span className="text-sm text-gray-600">{type.name}</span>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="-"
                                                className="w-16 text-center px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                                value={loanLimits[userType]?.type_limits?.[type.id] || ''}
                                                onChange={e => {
                                                    const val = parseInt(e.target.value)
                                                    const newLimits = { ...(loanLimits[userType]?.type_limits || {}) }
                                                    if (isNaN(val) || val <= 0) {
                                                        delete newLimits[type.id]
                                                    } else {
                                                        newLimits[type.id] = val
                                                    }
                                                    setLoanLimits(prev => ({
                                                        ...prev,
                                                        [userType]: { ...prev[userType], type_limits: newLimits }
                                                    }))
                                                    setIsDirty(true)
                                                }}
                                            />
                                        </div>
                                    ))}
                                    {(Array.isArray(activeEquipmentTypes) ? activeEquipmentTypes : []).length === 0 && (
                                        <div className="col-span-full text-center py-4 text-gray-400 text-sm">
                                            ไม่พบข้อมูลประเภทอุปกรณ์
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Organization / Departments */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">หน่วยงาน</h2>
                        <p className="text-sm text-gray-500">จัดการหน่วยงานและภาควิชา</p>
                    </div>
                </div>
                <Link
                    href="/admin/settings/departments"
                    className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group"
                >
                    <div>
                        <p className="font-medium text-indigo-900">จัดการหน่วยงาน/ภาควิชา</p>
                        <p className="text-sm text-indigo-600 hidden sm:block">เพิ่ม แก้ไข หรือลบหน่วยงาน</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </Link>
            </section>
        </div>
    )
}
