'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import EvaluationModal from './EvaluationModal'
import { AlertTriangle } from 'lucide-react'

export default function ActiveEvaluationPrompt() {
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

            // Get cutoff date from system_config
            const { data: config } = await supabase
                .from('system_config')
                .select('evaluation_cutoff_date')
                .single()

            const cutoffDate = (config as any)?.evaluation_cutoff_date || new Date().toISOString().split('T')[0]

            // Fetch returned loans that might not be evaluated
            let query = supabase
                .from('loanRequests')
                .select('*, equipment(name, equipment_number), evaluations(id)')
                .eq('user_id', session.user.id)
                .eq('status', 'returned')
                .gte('updated_at', cutoffDate) // Only loans returned after cutoff
                .order('updated_at', { ascending: false })

            const { data: loans, error } = await query

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
        const remaining = pendingLoans.filter(l => l.id !== currentLoan.id)
        setPendingLoans(remaining)

        if (remaining.length > 0) {
            setCurrentLoan(remaining[0])
        } else {
            setIsModalOpen(false)
            setCurrentLoan(null)
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
