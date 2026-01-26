'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import EvaluationModal from './EvaluationModal'
import { RocketIcon } from 'lucide-react'

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
            // We fetch evaluations(id) to check existence
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
                setCurrentLoan(pending[0]) // Prompt the most recent one first
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
            setCurrentLoan(remaining[0])
            // Keep modal open for next item? Or close it?
            // "Active Prompt" usually implies "do this now". 
            // Let's keep it open for the next one for efficiency, or close it to be less annoying.
            // Soft Block strategy: Notify but don't force. 
            // Let's close it and if they refresh they get prompted again, or maybe just prompt once per session?
            // For now, let's close it. The user can go to My Loans for the rest.
            setIsModalOpen(false)
        } else {
            setIsModalOpen(false)
        }
    }

    if (!isModalOpen || !currentLoan) return null

    return (
        <EvaluationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            loan={currentLoan}
            onSuccess={handleEvaluationSuccess}
        />
    )
}
