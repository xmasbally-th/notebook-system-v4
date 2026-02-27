import { Suspense } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { getLoanRequests, getActiveLoans } from './actions'
import LoansTabs from './_components/LoansTabs'
import LoadingSkeleton from './loading'

export const metadata = {
    title: 'จัดการการยืม-คืน | Admin',
}

// ─── ใช้ revalidate แทน force-dynamic ──────────────────────────────────────
// Cache 30 วินาที — revalidatePath() ในทุก action จะ purge cache ทันทีเมื่อมีการเปลี่ยนแปลง
export const revalidate = 30

// ─── Async Server Component: ดึงข้อมูลแบบ parallel ──────────────────────────
// HTML shell (AdminLayout + header) จะ render และ stream ออกไปก่อน
// component นี้ suspend ระหว่างรอ query → Suspense แสดง skeleton แทน
async function LoansDataFetcher() {
    const [loanRequests, activeLoans] = await Promise.all([
        getLoanRequests(),
        getActiveLoans(),
    ])

    return (
        <LoansTabs
            loanRequests={loanRequests}
            activeLoans={activeLoans}
        />
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoansPage() {
    return (
        <AdminLayout title="จัดการการยืม-คืน" subtitle="คำขอยืม และรับคืนอุปกรณ์">
            {/* HTML shell ส่งออกทันที → FCP จับที่ header/sidebar
                LoansDataFetcher suspend ระหว่าง DB query → skeleton แสดงแทน */}
            <Suspense fallback={<LoadingSkeleton />}>
                <LoansDataFetcher />
            </Suspense>
        </AdminLayout>
    )
}
