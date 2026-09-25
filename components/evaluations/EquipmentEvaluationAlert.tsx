'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Star, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { PendingEvaluationLoan } from '@/hooks/usePendingEvaluations'

const EvaluationModal = dynamic(
    () => import('@/components/evaluations/EvaluationModal'),
    { ssr: false }
)

interface EquipmentEvaluationAlertProps {
    pendingLoans: PendingEvaluationLoan[]
    onEvaluationCompleted?: () => void
    className?: string
}

export default function EquipmentEvaluationAlert({
    pendingLoans,
    onEvaluationCompleted,
    className = ''
}: EquipmentEvaluationAlertProps) {
    const queryClient = useQueryClient()
    const [selectedLoanIndex, setSelectedLoanIndex] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)

    if (!pendingLoans || pendingLoans.length === 0) return null

    const currentLoan = pendingLoans[selectedLoanIndex] || pendingLoans[0]

    const handleOpenEvaluate = (index = 0) => {
        setSelectedLoanIndex(index)
        setIsModalOpen(true)
    }

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['pending-evaluations'] })
        queryClient.invalidateQueries({ queryKey: ['my-loans'] })
        queryClient.invalidateQueries({ queryKey: ['my-active-loans-count'] })
        queryClient.invalidateQueries({ queryKey: ['cart'] })

        if (onEvaluationCompleted) {
            onEvaluationCompleted()
        }

        // If there are more pending evaluations, advance to the next, otherwise close
        if (pendingLoans.length > 1 && selectedLoanIndex < pendingLoans.length - 1) {
            setSelectedLoanIndex(prev => prev + 1)
        } else {
            setIsModalOpen(false)
            setSelectedLoanIndex(0)
        }
    }

    const equipmentName = currentLoan?.equipment?.name || 'อุปกรณ์'
    const equipmentNumber = currentLoan?.equipment?.equipment_number ? `#${currentLoan.equipment.equipment_number}` : ''

    return (
        <>
            <div className={`bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5 animate-pulse">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                            <h4 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-1.5">
                                <span>⚠️ กรุณาประเมินการใช้งานอุปกรณ์รอบก่อนหน้าก่อนยืมใหม่</span>
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                                ค้าง {pendingLoans.length} รายการ
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                            คุณมีรายการยืมที่ส่งคืนแล้วแต่ยังไม่ได้ทำแบบประเมินความพึงพอใจ <strong>{pendingLoans.length} รายการ</strong>{' '}
                            (เช่น <span className="font-semibold">{equipmentName} {equipmentNumber}</span>)
                        </p>
                        <p className="text-[11px] sm:text-xs text-amber-700">
                            💡 เพื่อพัฒนาคุณภาพการให้บริการและปฏิบัติตามระเบียบ กรุณาสละเวลาประเมินความพึงพอใจ 1-5 ดาว เพื่อปลดล็อกการส่งคำขอยืมหรือจองอุปกรณ์
                        </p>

                        <div className="pt-2 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => handleOpenEvaluate(0)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
                            >
                                <Star className="w-4 h-4 fill-white text-white" />
                                <span>ทำแบบประเมินความพึงพอใจตอนนี้</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                            </button>

                            <Link
                                href="/my-loans"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 transition-colors py-1"
                            >
                                <span>ดูประวัติการยืมทั้งหมด</span>
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* In-page Evaluation Modal */}
            {isModalOpen && currentLoan && (
                <EvaluationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    loan={currentLoan}
                    onSuccess={handleSuccess}
                    mandatory={false}
                />
            )}
        </>
    )
}
