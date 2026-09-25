'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import EvaluationModal from './EvaluationModal'
import { AlertTriangle } from 'lucide-react'
import { usePendingEvaluations } from '@/hooks/usePendingEvaluations'

export default function ActiveEvaluationPrompt() {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const { pendingLoans, hasPendingEvaluations } = usePendingEvaluations()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const isExcludedRoute = !pathname ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/staff') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register')

    useEffect(() => {
        if (!isExcludedRoute && hasPendingEvaluations) {
            setIsModalOpen(true)
        } else {
            setIsModalOpen(false)
        }
    }, [isExcludedRoute, hasPendingEvaluations])

    if (isExcludedRoute || !hasPendingEvaluations || pendingLoans.length === 0) return null

    const currentLoan = pendingLoans[currentIndex] || pendingLoans[0]

    const handleEvaluationSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['pending-evaluations'] })
        queryClient.invalidateQueries({ queryKey: ['my-loans'] })
        queryClient.invalidateQueries({ queryKey: ['my-active-loans-count'] })
        queryClient.invalidateQueries({ queryKey: ['cart'] })

        if (currentIndex < pendingLoans.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            setIsModalOpen(false)
            setCurrentIndex(0)
        }
    }

    if (!isModalOpen || !currentLoan) return null

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-end justify-center pb-4 pointer-events-none">
                <div className="bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">
                        กรุณาประเมินอุปกรณ์ที่คืนแล้ว ({pendingLoans.length} รายการ) ก่อนใช้งานระบบต่อ
                    </span>
                </div>
            </div>

            <EvaluationModal
                isOpen={isModalOpen}
                onClose={() => { }}
                loan={currentLoan}
                onSuccess={handleEvaluationSuccess}
                mandatory={true}
            />
        </>
    )
}
