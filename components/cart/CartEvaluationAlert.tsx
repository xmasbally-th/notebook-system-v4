'use client'

import React from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'

interface CartEvaluationAlertProps {
    pendingEvaluationCount: number
}

export default function CartEvaluationAlert({ pendingEvaluationCount }: CartEvaluationAlertProps) {
    if (pendingEvaluationCount <= 0) return null

    return (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
                <Star className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-orange-800">
                        กรุณาประเมินอุปกรณ์ก่อนยืม/จองใหม่
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                        คุณมีอุปกรณ์ที่คืนแล้วแต่ยังไม่ได้ประเมิน {pendingEvaluationCount} รายการ
                    </p>
                    <Link
                        href="/my-loans"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-orange-700 hover:text-orange-900 underline"
                    >
                        <Star className="w-3 h-3" />
                        ไปประเมินเลย
                    </Link>
                </div>
            </div>
        </div>
    )
}
