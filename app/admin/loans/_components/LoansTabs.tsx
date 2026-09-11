'use client'

import React, { Children } from 'react'
import Link from 'next/link'
import { ClipboardList, RotateCcw, Printer, Zap } from 'lucide-react'

interface LoansTabsProps {
    activeTab: 'requests' | 'returns'
    children: React.ReactNode
}

export default function LoansTabs({
    activeTab,
    children,
}: LoansTabsProps) {
    const tabs: { key: 'requests' | 'returns'; label: string; Icon: React.ElementType }[] = [
        { key: 'requests', label: 'คำขอยืม', Icon: ClipboardList },
        { key: 'returns', label: 'รับคืนอุปกรณ์', Icon: RotateCcw },
    ]

    const childArray = Children.toArray(children)

    return (
        <div className="space-y-6">
            {/* Tab Navigation & Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Tab Switcher */}
                <div className="flex gap-2">
                    {tabs.map(({ key, label, Icon }) => (
                        <Link
                            key={key}
                            href={`/admin/loans?tab=${key}`}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                activeTab === key
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                        </Link>
                    ))}
                </div>

                {/* Equipment QR Tools & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/admin/equipment/qr-print"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        <span>พิมพ์สติกเกอร์ QR ประจำอุปกรณ์</span>
                    </Link>

                    <Link
                        href="/staff/counter"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium transition-all shadow-xs"
                    >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>เคาน์เตอร์ด่วน</span>
                    </Link>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'requests' ? childArray[0] : childArray[1]}
            </div>
        </div>
    )
}
