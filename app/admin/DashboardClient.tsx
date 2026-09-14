'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import { useRealtimeInvalidator } from '@/hooks/useRealtimeInvalidator'
import { updateUserStatus } from '@/app/admin/users/actions'
import { approveLoan, rejectLoan } from '@/app/staff/loans/actions'
import { formatThaiDate } from '@/lib/formatThaiDate'
import type {
    AdminDashboardData,
    AdminPendingUser,
    AdminPendingLoan
} from '@/lib/data/admin-dashboard'
import {
    Package,
    Users,
    ClipboardList,
    TrendingUp,
    ArrowRight,
    Plus,
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Check,
    X,
    Shield,
    Database,
    Sliders,
    QrCode,
    Calendar,
    Phone,
    Mail,
    ChevronRight,
    Sparkles,
    UserCheck,
    UserX,
    Loader2,
    ExternalLink,
    AlertCircle,
    Building2
} from 'lucide-react'
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

interface DashboardClientProps {
    initialData: AdminDashboardData
}

const USER_TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
    lecturer: { label: 'อาจารย์', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300' },
    staff: { label: 'บุคลากร', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300' },
    student: { label: 'นักศึกษา', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300' }
}

const STATUS_COLORS = {
    available: '#10B981', // Emerald
    borrowed: '#3B82F6',  // Blue
    maintenance: '#F59E0B' // Amber
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
    const router = useRouter()
    const { data: systemConfig } = useSystemConfig()

    // ─── Realtime Invalidation ─────────────────────────────────────────
    useRealtimeInvalidator(
        ['profiles', 'loanRequests', 'reservations', 'equipment', 'system_config'],
        [['admin-dashboard']]
    )

    const { stats, pendingUsers, equipmentCategories, pendingLoans, overdueLoans } = initialData

    // ─── Action Queues State ───────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<'users' | 'loans' | 'overdue'>('users')
    const [processingUserId, setProcessingUserId] = useState<string | null>(null)
    const [rejectUserModal, setRejectUserModal] = useState<AdminPendingUser | null>(null)
    const [rejectUserReason, setRejectUserReason] = useState('')
    const [isSubmittingUserReject, setIsSubmittingUserReject] = useState(false)

    // Loan Reject State
    const [processingLoanId, setProcessingLoanId] = useState<string | null>(null)
    const [rejectLoanModal, setRejectLoanModal] = useState<AdminPendingLoan | null>(null)
    const [rejectLoanReason, setRejectLoanReason] = useState('')
    const [isSubmittingLoanReject, setIsSubmittingLoanReject] = useState(false)

    // Feedback notification banner
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    // ─── User Actions ──────────────────────────────────────────────────
    const handleApproveUser = async (user: AdminPendingUser) => {
        setProcessingUserId(user.id)
        try {
            const res = await updateUserStatus(user.id, 'approved')
            if (res.error) {
                setFeedback({ type: 'error', message: res.error })
            } else {
                setFeedback({
                    type: 'success',
                    message: `อนุมัติบัญชีของ "${user.first_name} ${user.last_name || ''}" เรียบร้อยแล้ว พร้อมส่งอีเมลแจ้งเตือน`
                })
                router.refresh()
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err?.message || 'เกิดข้อผิดพลาดในการอนุมัติ' })
        } finally {
            setProcessingUserId(null)
        }
    }

    const handleConfirmRejectUser = async () => {
        if (!rejectUserModal) return
        setIsSubmittingUserReject(true)
        try {
            const res = await updateUserStatus(rejectUserModal.id, 'rejected', rejectUserReason.trim() || undefined)
            if (res.error) {
                alert(res.error)
            } else {
                setFeedback({
                    type: 'success',
                    message: `ปฏิเสธบัญชีของ "${rejectUserModal.first_name} ${rejectUserModal.last_name || ''}" เรียบร้อยแล้ว`
                })
                setRejectUserModal(null)
                setRejectUserReason('')
                router.refresh()
            }
        } catch (err: any) {
            alert(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setIsSubmittingUserReject(false)
        }
    }

    // ─── Loan Actions ──────────────────────────────────────────────────
    const handleApproveLoan = async (loan: AdminPendingLoan) => {
        setProcessingLoanId(loan.id)
        try {
            const res = await approveLoan(loan.id)
            if (res.success) {
                setFeedback({
                    type: 'success',
                    message: `อนุมัติคำขอยืมอุปกรณ์ #${loan.equipment?.equipment_number || ''} สำเร็จ`
                })
                router.refresh()
            } else {
                setFeedback({ type: 'error', message: res.error || 'เกิดข้อผิดพลาด' })
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: err?.message || 'เกิดข้อผิดพลาด' })
        } finally {
            setProcessingLoanId(null)
        }
    }

    const handleConfirmRejectLoan = async () => {
        if (!rejectLoanModal) return
        if (!rejectLoanReason.trim()) {
            alert('กรุณาระบุเหตุผลการปฏิเสธ')
            return
        }
        setIsSubmittingLoanReject(true)
        try {
            const res = await rejectLoan(rejectLoanModal.id, rejectLoanReason.trim())
            if (res.success) {
                setFeedback({
                    type: 'success',
                    message: `ปฏิเสธคำขอยืม #${rejectLoanModal.equipment?.equipment_number || ''} สำเร็จ`
                })
                setRejectLoanModal(null)
                setRejectLoanReason('')
                router.refresh()
            } else {
                alert(res.error || 'เกิดข้อผิดพลาด')
            }
        } catch (err: any) {
            alert(err?.message || 'เกิดข้อผิดพลาด')
        } finally {
            setIsSubmittingLoanReject(false)
        }
    }

    // Calculations for charts
    const totalEquipment = stats.equipment || 1
    const availabilityRate = Math.round((stats.equipmentAvailable / totalEquipment) * 100)

    const equipmentPieData = [
        { name: 'พร้อมใช้งาน', value: stats.equipmentAvailable, color: STATUS_COLORS.available },
        { name: 'กำลังถูกยืม', value: stats.equipmentBorrowed, color: STATUS_COLORS.borrowed },
        { name: 'ซ่อมบำรุง/ปลดระวาง', value: stats.equipmentMaintenance, color: STATUS_COLORS.maintenance }
    ].filter(d => d.value > 0)

    const categoryBarData = equipmentCategories.map(cat => ({
        name: cat.name.length > 12 ? cat.name.slice(0, 10) + '..' : cat.name,
        fullName: cat.name,
        พร้อมใช้: cat.available,
        ถูกยืม: cat.borrowed
    }))

    const statCards = [
        {
            label: 'ผู้ใช้รออนุมัติ',
            value: stats.pendingUsers,
            subtitle: `จากทั้งหมด ${stats.totalUsers} คน`,
            icon: Users,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-950/40',
            ringColor: stats.pendingUsers > 0 ? 'ring-2 ring-orange-400 dark:ring-orange-500' : '',
            urgent: stats.pendingUsers > 0,
            tabKey: 'users' as const
        },
        {
            label: 'คำขอยืมรอดำเนินการ',
            value: stats.pendingLoans,
            subtitle: `${stats.pendingReservations} รายการจองรอจัดสรร`,
            icon: ClipboardList,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-950/40',
            ringColor: stats.pendingLoans > 0 ? 'ring-2 ring-purple-400 dark:ring-purple-500' : '',
            urgent: stats.pendingLoans > 0,
            tabKey: 'loans' as const
        },
        {
            label: 'อุปกรณ์พร้อมใช้งาน',
            value: stats.equipmentAvailable,
            subtitle: `จากทั้งหมด ${stats.equipment} ชิ้น (${availabilityRate}% พร้อมใช้)`,
            icon: Package,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
            ringColor: '',
            urgent: false,
            href: '/admin/equipment'
        },
        {
            label: 'การยืมเกินกำหนด (Overdue)',
            value: stats.overdueLoans,
            subtitle: `${stats.activeLoans} รายการยืมปกติ`,
            icon: AlertTriangle,
            color: stats.overdueLoans > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-slate-400',
            bgColor: stats.overdueLoans > 0 ? 'bg-red-50 dark:bg-red-950/40' : 'bg-gray-50 dark:bg-slate-800',
            ringColor: stats.overdueLoans > 0 ? 'ring-2 ring-red-400 dark:ring-red-500' : '',
            urgent: stats.overdueLoans > 0,
            tabKey: 'overdue' as const
        }
    ]

    const quickActions = [
        { label: 'เพิ่มอุปกรณ์ใหม่', icon: Plus, href: '/admin/equipment/new', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
        { label: 'พิมพ์ QR Code', icon: QrCode, href: '/admin/equipment/qr-print', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
        { label: 'จัดการผู้ใช้', icon: Users, href: '/admin/users', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
        { label: 'รายงานสถิติ', icon: FileText, href: '/admin/reports', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
        { label: 'จัดการ/สำรองข้อมูล', icon: Database, href: '/admin/data-management', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
        { label: 'ตั้งค่าระบบ', icon: Sliders, href: '/admin/settings', color: 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white' }
    ]

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Executive Dashboard"
                subtitle="ศูนย์บัญชาการวิเคราะห์และกำกับดูแลระบบยืม-คืนอุปกรณ์"
            />

            {/* ─── Feedback Banner ─── */}
            {feedback && (
                <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {feedback.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                        <span className="text-sm font-medium">{feedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="text-xs font-semibold px-2 py-1 hover:underline opacity-80"
                    >
                        ✕ ปิด
                    </button>
                </div>
            )}

            {/* ─── 1. Executive Metric Cards ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon
                    const isClickable = !!stat.tabKey || !!stat.href

                    return (
                        <div
                            key={idx}
                            onClick={() => {
                                if (stat.tabKey) setActiveTab(stat.tabKey)
                                if (stat.href) router.push(stat.href)
                            }}
                            className={`
                                relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800
                                transition-all ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
                                ${stat.ringColor}
                            `}
                        >
                            {stat.urgent && (
                                <span className="absolute top-4 right-4 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">{stat.label}</p>
                                    <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{stat.subtitle}</p>
                                </div>
                                <div className={`p-3.5 rounded-2xl ${stat.bgColor}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ─── 2. Urgent Action Cockpit & Live System Health Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Urgent Action Cockpit */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    {/* Header & Tabs */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-slate-850/50">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                                แผงคิวงานด่วน (Action Cockpit)
                            </h3>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1.5 p-1 bg-gray-200/60 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setActiveTab('users')}
                                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                    activeTab === 'users'
                                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                                }`}
                            >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>ผู้ใช้รออนุมัติ</span>
                                {pendingUsers.length > 0 && (
                                    <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 rounded-full text-[10px] font-bold">
                                        {pendingUsers.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('loans')}
                                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                    activeTab === 'loans'
                                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                                }`}
                            >
                                <ClipboardList className="w-3.5 h-3.5" />
                                <span>คำขอยืม</span>
                                {pendingLoans.length > 0 && (
                                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-full text-[10px] font-bold">
                                        {pendingLoans.length}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('overdue')}
                                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                    activeTab === 'overdue'
                                        ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 shadow-xs'
                                        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                                }`}
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>เกินกำหนด</span>
                                {overdueLoans.length > 0 && (
                                    <span className="px-1.5 py-0.2 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-full text-[10px] font-bold">
                                        {overdueLoans.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Cockpit Content Area */}
                    <div className="p-4 sm:p-5 flex-1 space-y-3">
                        {/* TAB 1: PENDING USERS */}
                        {activeTab === 'users' && (
                            <>
                                {pendingUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 opacity-80" />
                                        <p className="font-semibold text-gray-700 dark:text-slate-300">ไม่มีผู้ใช้รออนุมัติในขณะนี้</p>
                                        <p className="text-xs text-gray-400 mt-1">ทุกบัญชีผู้ใช้งานใหม่ได้รับการตรวจสอบและอนุมัติครบถ้วนแล้ว</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {pendingUsers.map(user => {
                                            const typeInfo = USER_TYPE_LABELS[user.user_type || 'student'] || USER_TYPE_LABELS.student
                                            const isProcessing = processingUserId === user.id

                                            return (
                                                <div
                                                    key={user.id}
                                                    className="p-3.5 bg-gray-50/80 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-200 transition-all"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center shrink-0 text-sm">
                                                            {user.first_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                                                                    {user.title || ''}{user.first_name} {user.last_name || ''}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeInfo.bg} ${typeInfo.text}`}>
                                                                    {typeInfo.label}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-slate-400">
                                                                {user.user_id && <span>🆔 {user.user_id}</span>}
                                                                {user.departments?.name && <span>🏛️ {user.departments.name}</span>}
                                                                {user.phone_number && <span>📞 {user.phone_number}</span>}
                                                            </div>
                                                            <p className="text-[11px] text-gray-400">
                                                                ลงทะเบียนเมื่อ: {formatThaiDate(user.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Quick 1-Click Action Buttons */}
                                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing}
                                                            onClick={() => handleApproveUser(user)}
                                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>อนุมัติ</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing}
                                                            onClick={() => setRejectUserModal(user)}
                                                            className="px-3 py-1.5 bg-gray-200/80 hover:bg-red-100 dark:bg-slate-700 dark:hover:bg-red-950/40 text-gray-700 hover:text-red-700 dark:text-slate-300 dark:hover:text-red-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                            <span>ปฏิเสธ</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        <div className="pt-2 text-right">
                                            <Link
                                                href="/admin/users"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                <span>ดูและจัดการผู้ใช้ทั้งหมด ({stats.totalUsers} คน)</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* TAB 2: PENDING LOANS */}
                        {activeTab === 'loans' && (
                            <>
                                {pendingLoans.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 opacity-80" />
                                        <p className="font-semibold text-gray-700 dark:text-slate-300">ไม่มีคำขอยืมค้างอนุมัติ</p>
                                        <p className="text-xs text-gray-400 mt-1">คำขอยืมอุปกรณ์ทั้งหมดได้รับการจัดการเรียบร้อยแล้ว</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {pendingLoans.map(loan => {
                                            const isProcessing = processingLoanId === loan.id
                                            const borrowerName = loan.profiles
                                                ? `${loan.profiles.first_name || ''} ${loan.profiles.last_name || ''}`.trim()
                                                : 'ผู้ใช้งาน'

                                            return (
                                                <div
                                                    key={loan.id}
                                                    className="p-3.5 bg-gray-50/80 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-200 transition-all"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                                                                #{loan.equipment?.equipment_number} — {loan.equipment?.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-600 dark:text-slate-400">
                                                            <span>👤 {borrowerName}</span>
                                                            <span>📅 ยืม: {formatThaiDate(loan.start_date)} - {formatThaiDate(loan.end_date)}</span>
                                                        </div>
                                                        {loan.reason && (
                                                            <p className="text-xs text-gray-500 italic">
                                                                วัตถุประสงค์: &quot;{loan.reason}&quot;
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing}
                                                            onClick={() => handleApproveLoan(loan)}
                                                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                                        >
                                                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                            <span>อนุมัติ</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing}
                                                            onClick={() => setRejectLoanModal(loan)}
                                                            className="px-3 py-1.5 bg-gray-200/80 hover:bg-red-100 dark:bg-slate-700 dark:hover:bg-red-950/40 text-gray-700 hover:text-red-700 dark:text-slate-300 dark:hover:text-red-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                            <span>ปฏิเสธ</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        <div className="pt-2 text-right">
                                            <Link
                                                href="/admin/loans"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                                            >
                                                <span>ดูรายการคำขอยืมทั้งหมด</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* TAB 3: OVERDUE WATCHLIST */}
                        {activeTab === 'overdue' && (
                            <>
                                {overdueLoans.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 opacity-80" />
                                        <p className="font-semibold text-gray-700 dark:text-slate-300">ไม่มีรายการเกินกำหนดส่ง</p>
                                        <p className="text-xs text-gray-400 mt-1">ผู้ยืมทุกคนคืนอุปกรณ์ตรงตามเวลาที่กำหนด</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {overdueLoans.map(loan => {
                                            const borrowerName = loan.profiles
                                                ? `${loan.profiles.first_name || ''} ${loan.profiles.last_name || ''}`.trim()
                                                : 'ผู้ใช้งาน'

                                            return (
                                                <div
                                                    key={loan.id}
                                                    className="p-3.5 bg-red-50/40 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-red-950 dark:text-red-200 text-sm">
                                                                #{loan.equipment?.equipment_number} — {loan.equipment?.name}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-[10px] font-bold">
                                                                เกิน {loan.days_overdue} วัน
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-red-800 dark:text-red-300">
                                                            <span>👤 {borrowerName}</span>
                                                            {loan.profiles?.phone_number && <span>📞 {loan.profiles.phone_number}</span>}
                                                            <span>📅 กำหนดคืนเดิม: {formatThaiDate(loan.end_date)}</span>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href="/admin/loans"
                                                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-end sm:self-center flex items-center gap-1"
                                                    >
                                                        <span>ติดตามทวงถาม</span>
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            )
                                        })}

                                        <div className="pt-2 text-right">
                                            <Link
                                                href="/admin/loans"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                                            >
                                                <span>ดูรายการยืมทั้งหมด</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right 1 Col: Live System Health & Config */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-4">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                                    สถานะระบบจริง (Live Policy)
                                </h3>
                            </div>
                            <Link
                                href="/admin/settings"
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                แก้ไข
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {/* System Open Status */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 className={`w-5 h-5 ${systemConfig?.is_loan_system_active !== false ? 'text-emerald-500' : 'text-red-500'}`} />
                                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">ระบบยืม-คืน</span>
                                </div>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                    systemConfig?.is_loan_system_active !== false
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                }`}>
                                    {systemConfig?.is_loan_system_active !== false ? 'เปิดให้บริการปกติ' : 'ปิดระบบชั่วคราว'}
                                </span>
                            </div>

                            {/* Operating Hours */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl">
                                <div className="flex items-center gap-2.5">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">เวลาทำการ</span>
                                </div>
                                <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                                    {systemConfig?.opening_time || '08:30'} - {systemConfig?.closing_time || '16:30'} น.
                                </span>
                            </div>

                            {/* Reservation Policy */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl">
                                <div className="flex items-center gap-2.5">
                                    <Calendar className="w-5 h-5 text-purple-500" />
                                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">ระบบการจอง</span>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                    systemConfig?.is_reservation_active !== false
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                        : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    {systemConfig?.is_reservation_active !== false ? 'เปิดรับการจอง' : 'ปิดรับการจอง'}
                                </span>
                            </div>

                            {/* Data Archive Health */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl">
                                <div className="flex items-center gap-2.5">
                                    <Database className="w-5 h-5 text-emerald-500" />
                                    <span className="text-xs font-semibold text-gray-800 dark:text-slate-200">ระบบจัดเก็บประวัติ</span>
                                </div>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                    systemConfig?.archive_enabled
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    {systemConfig?.archive_enabled ? 'เปิดทำงาน' : 'ปิดอยู่'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-blue-950 dark:text-blue-200">
                            <span>ความจุผู้ใช้ในระบบ</span>
                            <span>{stats.totalUsers} บัญชี</span>
                        </div>
                        <div className="w-full bg-blue-200/50 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, (stats.totalUsers / 500) * 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 text-right">
                            อนุมัติแล้ว {stats.totalUsers - stats.pendingUsers} • รออนุมัติ {stats.pendingUsers}
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── 3. Visual Analytics Charts Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart: Equipment Availability */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                                สัดส่วนสถานะอุปกรณ์ในคลัง
                            </h3>
                            <p className="text-xs text-gray-400">จากอุปกรณ์ทั้งหมด {stats.equipment} ชิ้น</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            {availabilityRate}% พร้อมให้บริการ
                        </span>
                    </div>

                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={equipmentPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {equipmentPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(val) => [`${val ?? 0} ชิ้น`, 'จำนวน']}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Custom Legend */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-center">
                        <div className="p-2 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl">
                            <span className="block text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">พร้อมใช้งาน</span>
                            <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">{stats.equipmentAvailable}</span>
                        </div>
                        <div className="p-2 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl">
                            <span className="block text-[11px] text-blue-700 dark:text-blue-300 font-semibold">กำลังถูกยืม</span>
                            <span className="text-base font-extrabold text-blue-900 dark:text-blue-100">{stats.equipmentBorrowed}</span>
                        </div>
                        <div className="p-2 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl">
                            <span className="block text-[11px] text-amber-700 dark:text-amber-300 font-semibold">ซ่อมบำรุง/ปลดระวาง</span>
                            <span className="text-base font-extrabold text-amber-900 dark:text-amber-100">{stats.equipmentMaintenance}</span>
                        </div>
                    </div>
                </div>

                {/* Bar Chart: Equipment by Category */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                                จำนวนอุปกรณ์แบ่งตามหมวดหมู่
                            </h3>
                            <p className="text-xs text-gray-400">เปรียบเทียบจำนวน พร้อมใช้ vs ถูกยืม</p>
                        </div>
                        <Link
                            href="/admin/equipment-types"
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            จัดการประเภท
                        </Link>
                    </div>

                    <div className="h-64">
                        {categoryBarData.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                ไม่มีข้อมูลประเภทอุปกรณ์
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(val, name) => [`${val} ชิ้น`, name]}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar dataKey="พร้อมใช้" fill={STATUS_COLORS.available} radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="ถูกยืม" fill={STATUS_COLORS.borrowed} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span>พร้อมใช้งาน</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>กำลังถูกยืม</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 4. Quick Administration Hub ─── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">
                    ดำเนินการด่วนสำหรับผู้ดูแลระบบ (Admin Shortcuts)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {quickActions.map(action => {
                        const Icon = action.icon
                        return (
                            <Link
                                key={action.label}
                                href={action.href}
                                className={`
                                    flex flex-col items-center justify-center p-4 rounded-2xl
                                    ${action.color} transition-all hover:shadow-lg hover:-translate-y-0.5 text-center
                                `}
                            >
                                <Icon className="w-6 h-6 mb-2 opacity-95" />
                                <span className="text-xs font-bold leading-tight">{action.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 5. MODALS SECTION                                              */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            {/* Reject User Modal */}
            {rejectUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">
                        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-red-50/70 dark:bg-red-950/40">
                            <div className="flex items-center gap-2 text-red-900 dark:text-red-100 font-bold">
                                <UserX className="w-5 h-5 text-red-600" />
                                <span>ปฏิเสธการลงทะเบียนผู้ใช้งาน</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectUserModal(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs sm:text-sm">
                            <p className="text-gray-600 dark:text-slate-300">
                                ปฏิเสธบัญชีของ: <strong>{rejectUserModal.first_name} {rejectUserModal.last_name}</strong>
                                <br />
                                อีเมล: {rejectUserModal.email}
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    เหตุผลในการปฏิเสธ (จะแจ้งไปยังผู้ใช้)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="เช่น รหัสประจำตัวไม่ถูกต้อง, ไม่พบบัญชีในสังกัดมหาวิทยาลัย..."
                                    value={rejectUserReason}
                                    onChange={(e) => setRejectUserReason(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectUserModal(null)}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmRejectUser}
                                    disabled={isSubmittingUserReject}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                                >
                                    {isSubmittingUserReject ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Loan Modal */}
            {rejectLoanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800">
                        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-red-50/70 dark:bg-red-950/40">
                            <div className="flex items-center gap-2 text-red-900 dark:text-red-100 font-bold">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span>ปฏิเสธคำขอยืมอุปกรณ์</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectLoanModal(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 space-y-4 text-xs sm:text-sm">
                            <p className="text-gray-600 dark:text-slate-300">
                                ปฏิเสธคำขอยืม: <strong>#{rejectLoanModal.equipment?.equipment_number} ({rejectLoanModal.equipment?.name})</strong>
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                                    เหตุผลในการปฏิเสธ (จำเป็น)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="เช่น อุปกรณ์มีภารกิจอื่น หรือระยะเวลายืมไม่เป็นไปตามเกณฑ์..."
                                    value={rejectLoanReason}
                                    onChange={(e) => setRejectLoanReason(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl p-3 bg-gray-50/50 dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectLoanModal(null)}
                                    className="flex-1 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmRejectLoan}
                                    disabled={isSubmittingLoanReject || !rejectLoanReason.trim()}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                                >
                                    {isSubmittingLoanReject ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
