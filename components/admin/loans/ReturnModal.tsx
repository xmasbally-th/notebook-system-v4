'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'

type ConditionType = 'good' | 'damaged' | 'missing_parts'

const CONDITION_OPTIONS: { value: ConditionType; label: string; color: string }[] = [
    { value: 'good', label: 'สภาพดี', color: 'bg-green-100 text-green-700' },
    { value: 'damaged', label: 'ชำรุด', color: 'bg-red-100 text-red-700' },
    { value: 'missing_parts', label: 'ขาดชิ้นส่วน', color: 'bg-yellow-100 text-yellow-700' },
]

interface Props {
    loan: {
        equipment?: { name?: string; equipment_number?: string } | null
        profiles?: { first_name?: string; last_name?: string } | null
    }
    isPending: boolean
    onConfirm: (condition: ConditionType, notes: string) => void
    onClose: () => void
}

export default function ReturnModal({ loan, isPending, onConfirm, onClose }: Props) {
    const [condition, setCondition] = useState<ConditionType>('good')
    const [notes, setNotes] = useState('')

    const handleConfirm = () => {
        onConfirm(condition, notes)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">บันทึกการคืนอุปกรณ์</h3>

                {/* Equipment Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="font-medium text-gray-900">{loan.equipment?.name}</p>
                    <p className="text-sm text-gray-500">{loan.equipment?.equipment_number}</p>
                    <p className="text-sm text-gray-500 mt-1">
                        ผู้ยืม: {loan.profiles?.first_name} {loan.profiles?.last_name}
                    </p>
                </div>

                {/* Condition Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">สภาพอุปกรณ์</label>
                    <div className="space-y-2">
                        {CONDITION_OPTIONS.map(option => (
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
                                    onChange={e => setCondition(e.target.value as ConditionType)}
                                    className="sr-only"
                                />
                                <span className={`px-2 py-0.5 text-xs rounded-full ${option.color}`}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Notes (only for damaged/missing) */}
                {condition !== 'good' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                รายละเอียดความเสียหาย
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="ระบุรายละเอียด..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-700">
                                    <p className="font-medium">อุปกรณ์จะถูกส่งซ่อมบำรุง</p>
                                    <p>Admin จะได้รับการแจ้งเตือนเกี่ยวกับความเสียหายนี้</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        {isPending ? 'กำลังบันทึก...' : 'ยืนยันการคืน'}
                    </button>
                </div>
            </div>
        </div>
    )
}
