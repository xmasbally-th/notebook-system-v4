import { Suspense } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import LoanRequestsSection from '@/components/admin/loans/LoanRequestsSection'
import ActiveLoansSection from '@/components/admin/loans/ActiveLoansSection'
import { getLoanRequests, getActiveLoans } from './actions'
import LoansTabs from './_components/LoansTabs'

// ─── Server-side data fetch ───────────────────────────────────────────────────
// Parallel fetch: ทั้งสองชุดข้อมูลดึงพร้อมกันบน server ไม่มี waterfall
async function LoanData() {
    const [loanRequests, activeLoans] = await Promise.all([
        getLoanRequests(),
        getActiveLoans(),
    ])
    return { loanRequests, activeLoans }
}

export const metadata = {
    title: 'จัดการการยืม-คืน | Admin',
}

export const dynamic = 'force-dynamic'

export default async function LoansPage() {
    const { loanRequests, activeLoans } = await LoanData()

    return (
        <AdminLayout title="จัดการการยืม-คืน" subtitle="คำขอยืม และรับคืนอุปกรณ์">
            <LoansTabs
                loanRequests={loanRequests}
                activeLoans={activeLoans}
            />
        </AdminLayout>
    )
}
