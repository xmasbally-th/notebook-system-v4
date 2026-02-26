'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { ClipboardList, RotateCcw } from 'lucide-react'
import LoanRequestsSection from '@/components/admin/loans/LoanRequestsSection'
import ActiveLoansSection from '@/components/admin/loans/ActiveLoansSection'

type Tab = 'requests' | 'returns'

// LoansTabs ต้องถูกห่อด้วย Suspense (useSearchParams requirement)
function LoansTabsInner({
    loanRequests,
    activeLoans,
}: {
    loanRequests: any[]
    activeLoans: any[]
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeTab = (searchParams.get('tab') as Tab) ?? 'requests'

    const setTab = (tab: Tab) => {
        const params = new URLSearchParams(searchParams)
        params.set('tab', tab)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div>
            {/* Tab Nav */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('requests')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'requests'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <ClipboardList className="w-4 h-4" />
                    คำขอยืม
                </button>
                <button
                    onClick={() => setTab('returns')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'returns'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <RotateCcw className="w-4 h-4" />
                    รับคืนอุปกรณ์
                    {activeLoans.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                            {activeLoans.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'requests' ? (
                <LoanRequestsSection initialData={loanRequests} />
            ) : (
                <ActiveLoansSection initialData={activeLoans} />
            )}
        </div>
    )
}

// Export wrapped in Suspense — required by next-best-practices (useSearchParams needs Suspense boundary)
export default function LoansTabs({ loanRequests, activeLoans }: { loanRequests: any[]; activeLoans: any[] }) {
    return (
        <Suspense fallback={
            <div className="flex gap-2 mb-6">
                <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
            </div>
        }>
            <LoansTabsInner loanRequests={loanRequests} activeLoans={activeLoans} />
        </Suspense>
    )
}
