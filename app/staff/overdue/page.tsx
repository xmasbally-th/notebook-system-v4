'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { useState, useMemo } from 'react'
import StaffLayout from '@/components/staff/StaffLayout'
import {
    AlertTriangle, Bell, User, Package,
    Calendar, Search, Phone, Mail, Clock, Loader2, CheckCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function StaffOverduePage() {
    const queryClient = useQueryClient()
    const toast = useToast()
    const [searchTerm, setSearchTerm] = useState('')

    // Fetch overdue loans (approved status and past end_date)
    const { data: overdueLoans, isLoading } = useQuery({
        queryKey: ['staff-overdue-loans'],
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            // Fetch all approved loans
            const response = await fetch(
                `${url}/rest/v1/loanRequests?status=eq.approved&select=*,profiles!fk_loanrequests_profiles(first_name,last_name,email,phone_number),equipment(name,equipment_number,images)&order=end_date.asc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session?.access_token || key}`
                    }
                }
            )
            if (!response.ok) return []

            const loans = await response.json()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Filter to only overdue
            return loans.filter((loan: any) => {
                const endDate = new Date(loan.end_date)
                return endDate < today
            })
        }
    })

    // Send reminder mutation
    const sendReminderMutation = useMutation({
        mutationFn: async ({ loanId, borrowerEmail, borrowerName, equipmentName, daysOverdue }: {
            loanId: string
            borrowerEmail: string
            borrowerName: string
            equipmentName: string
            daysOverdue: number
        }) => {
            // Call server action to send system notifications, Discord and WeLPRU
            const { notifyOverdueLoan } = await import('@/app/notifications/actions')
            const res = await notifyOverdueLoan(loanId, daysOverdue)
            if (res && !res.success) {
                throw new Error(res.error || 'Failed to send notification')
            }

            // Update loan with last reminder timestamp
            const { url, key } = getSupabaseCredentials()
            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)
            const { data: { session } } = await client.auth.getSession()

            if (!session?.access_token) {
                throw new Error('กรุณาเข้าสู่ระบบก่อน')
            }

            await fetch(`${url}/rest/v1/loanRequests?id=eq.${loanId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    last_reminder_at: new Date().toISOString()
                })
            })

            return { borrowerName }
        },
        onSuccess: ({ borrowerName }) => {
            queryClient.invalidateQueries({ queryKey: ['staff-overdue-loans'] })
            toast.success(`ส่งการแจ้งเตือนให้ ${borrowerName} เรียบร้อยแล้ว`)
        },
        onError: (error: any) => {
            toast.error(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
    })

    // Filter overdue loans
    const filteredLoans = useMemo(() => {
        if (!overdueLoans) return []
        return overdueLoans.filter((loan: any) => {
            const searchLower = searchTerm.toLowerCase()
            return !searchTerm ||
                (loan.profiles?.first_name || '').toLowerCase().includes(searchLower) ||
                (loan.profiles?.last_name || '').toLowerCase().includes(searchLower) ||
                (loan.equipment?.name || '').toLowerCase().includes(searchLower)
        })
    }, [overdueLoans, searchTerm])

    const calculateDaysOverdue = (endDate: string) => {
        const end = new Date(endDate)
        const today = new Date()
        const diffTime = today.getTime() - end.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleSendReminder = (loan: any) => {
        const daysOverdue = calculateDaysOverdue(loan.end_date)
        sendReminderMutation.mutate({
            loanId: loan.id,
            borrowerEmail: loan.profiles?.email,
            borrowerName: `${loan.profiles?.first_name} ${loan.profiles?.last_name}`,
            equipmentName: loan.equipment?.name,
            daysOverdue
        })
    }

    const getOverdueSeverity = (days: number) => {
        if (days >= 7) {
            return {
                bg: 'bg-red-500',
                text: 'text-red-600',
                label: 'ค้างคืนนาน 🚨',
                gradient: 'from-red-50/80 to-rose-50/40',
                border: 'border-red-200/80 hover:border-red-300',
                accent: 'from-red-500 to-rose-600',
                iconBg: 'bg-red-100 text-red-600',
                badgeBg: 'bg-red-100/80 text-red-700 border-red-200/50'
            }
        }
        if (days >= 3) {
            return {
                bg: 'bg-orange-500',
                text: 'text-orange-600',
                label: 'ค้างคืน ⚠️',
                gradient: 'from-orange-50/80 to-amber-50/40',
                border: 'border-orange-200/80 hover:border-orange-300',
                accent: 'from-orange-500 to-amber-600',
                iconBg: 'bg-orange-100 text-orange-600',
                badgeBg: 'bg-orange-100/80 text-orange-700 border-orange-200/50'
            }
        }
        return {
            bg: 'bg-amber-500',
            text: 'text-amber-600',
            label: 'เกินกำหนด ⏰',
            gradient: 'from-amber-50/70 to-yellow-50/30',
            border: 'border-yellow-250/75 hover:border-yellow-350',
            accent: 'from-amber-500 to-yellow-500',
            iconBg: 'bg-yellow-100 text-yellow-600',
            badgeBg: 'bg-yellow-100/80 text-amber-700 border-yellow-200/50'
        }
    }

    return (
        <StaffLayout title="รายการค้างคืน" subtitle="ติดตามและแจ้งเตือนผู้ยืมที่เกินกำหนดคืน">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                        <AlertTriangle className="w-28 h-28" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-extrabold">{filteredLoans.length}</p>
                            <p className="text-sm font-medium text-red-100/90 mt-1">รายการค้างคืนทั้งหมด</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                        <Clock className="w-28 h-28" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-extrabold">
                                {filteredLoans.filter((l: any) => calculateDaysOverdue(l.end_date) >= 7).length}
                            </p>
                            <p className="text-sm font-medium text-orange-100/90 mt-1">ค้างคืนวิกฤต {"(>= 7 วัน)"}</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10">
                        <Bell className="w-28 h-28" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-extrabold">
                                {filteredLoans.filter((l: any) => l.last_reminder_at).length}
                            </p>
                            <p className="text-sm font-medium text-teal-100/90 mt-1">แจ้งเตือนแล้วสะสม</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-8 flex items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อผู้ยืม, อีเมล หรือชื่ออุปกรณ์..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm transition-all duration-200 text-sm placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Overdue Loans Cards Feed */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="relative p-5 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200" />
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-200 flex-shrink-0"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-5 w-40 bg-gray-200 rounded"></div>
                                            <div className="h-6 w-24 bg-gray-200 rounded-md"></div>
                                            <div className="h-3.5 w-48 bg-gray-200 rounded mt-2"></div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 md:items-end w-full md:w-auto">
                                        <div className="h-8 w-28 bg-gray-200 rounded-full"></div>
                                        <div className="h-5 w-20 bg-gray-200 rounded mt-1"></div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gray-200"></div>
                                        <div className="space-y-1">
                                            <div className="h-3.5 w-28 bg-gray-200 rounded"></div>
                                            <div className="h-3 w-36 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                                        <div className="h-9 w-10 bg-gray-200 rounded-lg"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredLoans.length === 0 ? (
                    <div className="p-16 text-center bg-white rounded-2xl border border-gray-200/60 shadow-sm max-w-lg mx-auto my-8">
                        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                            <div className="absolute inset-0 bg-emerald-50 rounded-full animate-ping opacity-20 duration-1000"></div>
                            <div className="absolute inset-0 bg-emerald-50 rounded-full"></div>
                            <div className="absolute inset-2 bg-emerald-100/40 rounded-full"></div>
                            <CheckCircle className="w-9 h-9 text-emerald-600 relative z-10 drop-shadow-sm" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">ยินดีด้วย! ไม่มีรายการค้างส่งคืน</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto">
                            พัสดุครุภัณฑ์คอมพิวเตอร์ทั้งหมดได้รับการส่งคืนครบตรงตามกำหนดเวลาเรียบร้อยแล้ว 🎉
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLoans.map((loan: any) => {
                            const daysOverdue = calculateDaysOverdue(loan.end_date)
                            const severity = getOverdueSeverity(daysOverdue)
                            const hasReminder = loan.last_reminder_at
                            const borrowerName = `${loan.profiles?.first_name || ''} ${loan.profiles?.last_name || ''}`.trim()
                            const firstLetter = borrowerName ? borrowerName.charAt(0) : 'U'

                            // Simple HSL background color for avatars based on name
                            const charCode = borrowerName.charCodeAt(0) || 65
                            const hue = (charCode * 7) % 360
                            const avatarStyle = {
                                background: `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${(hue + 40) % 360}, 80%, 45%))`
                            }

                            return (
                                <div
                                    key={loan.id}
                                    className={`relative p-5 sm:p-6 bg-gradient-to-br ${severity.gradient} rounded-2xl border ${severity.border} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group`}
                                >
                                    {/* Visual top accent indicator */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${severity.accent}`} />

                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                                        <div className="flex items-start gap-4">
                                            {/* Equipment Image & Badge Container */}
                                            <div className="relative flex-shrink-0">
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/80 border border-gray-250/30 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-[1.02] transition-transform duration-300">
                                                    {loan.equipment?.images?.[0] ? (
                                                        <img src={loan.equipment.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-10 h-10 text-gray-300" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Main Info */}
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold border ${severity.badgeBg} shadow-sm animate-pulse`}>
                                                        {severity.label}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        #{loan.equipment?.equipment_number || 'ไม่ระบุ'}
                                                    </span>
                                                </div>

                                                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                                                    {loan.equipment?.name || 'ไม่ระบุอุปกรณ์'}
                                                </h3>

                                                {/* Borrower details card in bubble */}
                                                <div className="mt-3 bg-white/70 backdrop-blur-sm border border-gray-150/40 rounded-xl p-3 flex items-start gap-3 shadow-sm max-w-md">
                                                    <div
                                                        style={avatarStyle}
                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 text-sm"
                                                    >
                                                        {firstLetter}
                                                    </div>
                                                    <div className="text-xs space-y-1 text-gray-600 min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{borrowerName}</p>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            {loan.profiles?.phone_number && (
                                                                <a href={`tel:${loan.profiles.phone_number}`} className="flex items-center gap-1 hover:text-teal-600 transition-colors">
                                                                    <Phone className="w-3.5 h-3.5" />
                                                                    <span>{loan.profiles.phone_number}</span>
                                                                </a>
                                                            )}
                                                            {loan.profiles?.email && (
                                                                <a href={`mailto:${loan.profiles.email}`} className="flex items-center gap-1 hover:text-teal-600 transition-colors truncate">
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                    <span className="truncate">{loan.profiles.email}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Dates Info */}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                        กำหนดคืน: {formatDate(loan.end_date)}
                                                        {loan.return_time && ` ${loan.return_time.slice(0, 5)} น.`}
                                                    </span>
                                                    <span className={`font-bold ${severity.text}`}>
                                                        (เกินกำหนดสะสม {daysOverdue} วัน)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Container */}
                                        <div className="flex flex-col items-stretch sm:items-end justify-between self-stretch gap-3 min-w-[170px]">
                                            <div className="text-xs text-gray-500 sm:text-right">
                                                {hasReminder ? (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] text-teal-600 font-semibold">🔔 แจ้งเตือนเสร็จสิ้น</p>
                                                        <p>ล่าสุด: {formatDate(loan.last_reminder_at)}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">ยังไม่ได้รับการแจ้งเตือน</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleSendReminder(loan)}
                                                disabled={sendReminderMutation.isPending}
                                                className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm ${
                                                    hasReminder
                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                        : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 hover:scale-[1.02]'
                                                } disabled:opacity-50`}
                                            >
                                                {sendReminderMutation.isPending && sendReminderMutation.variables?.loanId === loan.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Bell className="w-3.5 h-3.5" />
                                                )}
                                                <span>{hasReminder ? 'ส่งแจ้งเตือนอีกครั้ง' : 'ส่งแจ้งเตือนด่วน'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </StaffLayout>
    )
}
