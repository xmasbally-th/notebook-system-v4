'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import EvaluationModal from './EvaluationModal'
import { AlertTriangle } from 'lucide-react'

export default function ActiveEvaluationPrompt() {
    const [userId, setUserId] = useState<string | null>(null)
    const [pendingLoans, setPendingLoans] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentLoan, setCurrentLoan] = useState<any>(null)

    useEffect(() => {
        const checkPendingEvaluations = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            setUserId(session.user.id)

            // Fetch returned loans that might not be evaluated
            const { data: loans, error } = await supabase
                .from('loanRequests')
                .select('*, equipment(name, equipment_number), evaluations(id)')
                .eq('user_id', session.user.id)
                .eq('status', 'returned')
                .order('updated_at', { ascending: false })

            if (error || !loans) return

            // Filter loans that have NO evaluations
            const pending = loans.filter((loan: any) =>
                !loan.evaluations || loan.evaluations.length === 0
            )

            if (pending.length > 0) {
                setPendingLoans(pending)
                setCurrentLoan(pending[0])
                setIsModalOpen(true)
            }
        }

        checkPendingEvaluations()
    }, [])

    const handleEvaluationSuccess = () => {
        // Remove the evaluated loan from the pending list
        const remaining = pendingLoans.filter(l => l.id !== currentLoan.id)
        setPendingLoans(remaining)

        if (remaining.length > 0) {
            // Auto-advance to next pending evaluation
            setCurrentLoan(remaining[0])
            // Keep modal open — mandatory flow continues
        } else {
            // All done — close modal
            setIsModalOpen(false)
            setCurrentLoan(null)
        }
    }

    if (!isModalOpen || !currentLoan) return null

    return (
        <>
            {/* Mandatory evaluation banner behind the modal */}
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
                onClose={() => { }} // No-op: mandatory mode prevents closing
                loan={currentLoan}
                onSuccess={handleEvaluationSuccess}
                mandatory={true}
            />
        </>
    )
}
