'use client'

import dynamic from 'next/dynamic'

// P5: Lazy load ActiveEvaluationPrompt (usually returns null, imports heavy EvaluationModal)
// Must be in Client Component for ssr:false in Next.js 16
const ActiveEvaluationPrompt = dynamic(
    () => import('@/components/evaluations/ActiveEvaluationPrompt'),
    { ssr: false }
)

export default function LazyEvaluationPrompt() {
    return <ActiveEvaluationPrompt />
}
