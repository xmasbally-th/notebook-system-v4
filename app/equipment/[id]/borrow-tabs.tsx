'use client'

import { useState } from 'react'
import { Clock, CalendarPlus } from 'lucide-react'

interface BorrowTabsProps {
    equipmentId: string
    loanForm: React.ReactNode
    reservationForm: React.ReactNode
}

export default function BorrowTabs({ equipmentId, loanForm, reservationForm }: BorrowTabsProps) {
    const [activeTab, setActiveTab] = useState<'loan' | 'reservation'>('loan')

    return (
        <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex rounded-xl bg-gray-100 p-1">
                <button
                    onClick={() => setActiveTab('loan')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'loan'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    ยืมทันที
                </button>
                <button
                    onClick={() => setActiveTab('reservation')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'reservation'
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <CalendarPlus className="w-4 h-4" />
                    จองล่วงหน้า
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'loan' ? loanForm : reservationForm}
            </div>
        </div>
    )
}
