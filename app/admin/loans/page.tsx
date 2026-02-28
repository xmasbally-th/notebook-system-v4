import { Suspense } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getLoanRequests, getActiveLoans } from './actions'
import LoanRequestsSection from '@/components/admin/loans/LoanRequestsSection'
import ActiveLoansSection from '@/components/admin/loans/ActiveLoansSection'
import LoansTabs from './_components/LoansTabs'
import TabSkeleton from './loading'

export const metadata = {
    title: 'จัดการการยืม-คืน | Admin',
}

// Cache 30 วินาที — revalidatePath() ในทุก action จะ purge cache ทันที
export const revalidate = 30

// ─── Independent async fetchers ──────────────────────────────────────────────
// แต่ละ fetcher stream อิสระ ไม่รอกัน
// Tab ที่ user อยู่จะ resolve ก่อน ซึ่งทำให้ TTI เร็วขึ้น

async function LoanRequestsFetcher() {
    const data = await getLoanRequests()
    return <LoanRequestsSection initialData={data} />
}

async function ActiveLoansFetcher() {
    const data = await getActiveLoans()
    return <ActiveLoansSection initialData={data} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function LoansPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>
}) {
    const { tab } = await searchParams
    const activeTab = tab === 'returns' ? 'returns' : 'requests'

    return (
        <AdminLayout title="จัดการการยืม-คืน" subtitle="คำขอยืม และรับคืนอุปกรณ์">
            {/* Tab navigation ส่งออกทันที — ไม่ต้องรอ data */}
            <LoansTabs activeTab={activeTab}>
                {/* คำขอยืม — stream อิสระ */}
                <Suspense
                    key="requests"
                    fallback={<TabSkeleton />}
                >
                    <LoanRequestsFetcher />
                </Suspense>

                {/* รับคืนอุปกรณ์ — stream อิสระ */}
                <Suspense
                    key="returns"
                    fallback={<TabSkeleton />}
                >
                    <ActiveLoansFetcher />
                </Suspense>
            </LoansTabs>
        </AdminLayout>
    )
}

