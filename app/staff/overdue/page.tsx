'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import { useState, useMemo } from 'react'
import StaffLayout from '@/components/staff/StaffLayout'
import {
    AlertTriangle, Bell, User, Package,
    Calendar, Search, Phone, Mail, Clock
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
                `${url}/rest/v1/loanRequests?status=eq.approved&select=*,profiles(first_name,last_name,email,phone_number),equipment(name,equipment_number,images)&order=end_date.asc`,
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
            // In a real implementation, this would send an email via Resend, SendGrid, or AWS SES

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
        onError: () => {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
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
        if (days >= 7) return { color: 'bg-red-600', text: 'text-red-600', label: 'ค้างคืนนาน' }
        if (days >= 3) return { color: 'bg-orange-500', text: 'text-orange-600', label: 'ค้างคืน' }
        return { color: 'bg-yellow-500', text: 'text-yellow-600', label: 'เกินกำหนด' }
    }

    return (
        <StaffLayout title="รายการค้างคืน" subtitle="ติดตามและแจ้งเตือนผู้ยืมที่เกินกำหนดคืน">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{filteredLoans.length}</p>
                            <p className="text-sm text-gray-500">รายการค้างคืนทั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-600">
                                {filteredLoans.filter((l: any) => calculateDaysOverdue(l.end_date) >= 7).length}
                            </p>
                            <p className="text-sm text-gray-500">ค้างคืนเกิน 7 วัน</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Bell className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">
                                {filteredLoans.filter((l: any) => l.last_reminder_at).length}
                            </p>
                            <p className="text-sm text-gray-500">แจ้งเตือนแล้ว</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาผู้ยืม หรืออุปกรณ์..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Overdue Loans List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">รายการค้างคืน</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
                ) : filteredLoans.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 mx-auto text-green-300 mb-3" />
                        <p className="text-gray-500">ไม่มีรายการค้างคืน 🎉</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredLoans.map((loan: any) => {
                            const daysOverdue = calculateDaysOverdue(loan.end_date)
                            const severity = getOverdueSeverity(daysOverdue)
                            const hasReminder = loan.last_reminder_at

                            return (
                                <div key={loan.id} className="p-4 hover:bg-red-50/50">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    {loan.equipment?.images?.[0] ? (
                                                        <img src={loan.equipment.images[0]} alt="" className="w-16 h-16 object-cover" />
                                                    ) : (
                                                        <Package className="w-8 h-8 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className={`absolute -top-1 -right-1 w-6 h-6 ${severity.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                                                    {daysOverdue}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{loan.equipment?.name}</h3>
                                                <p className="text-sm text-gray-500 font-mono">{loan.equipment?.equipment_number}</p>

                                                {/* Borrower Info */}
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <User className="w-4 h-4" />
                                                        <span className="font-medium">{loan.profiles?.first_name} {loan.profiles?.last_name}</span>
                                                    </div>
                                                    {loan.profiles?.phone_number && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Phone className="w-4 h-4" />
                                                            <a href={`tel:${loan.profiles.phone_number}`} className="hover:text-teal-600">
                                                                {loan.profiles.phone_number}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {loan.profiles?.email && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                            <Mail className="w-4 h-4" />
                                                            <a href={`mailto:${loan.profiles.email}`} className="hover:text-teal-600">
                                                                {loan.profiles.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Dates */}
                                                <div className="flex items-center gap-4 mt-2 text-sm">
                                                    <span className="text-gray-500">
                                                        <Calendar className="w-4 h-4 inline mr-1" />
                                                        กำหนดคืน: {formatDate(loan.end_date)}
                                                        {loan.return_time && ` ${loan.return_time.slice(0, 5)} น.`}
                                                    </span>
                                                    <span className={`font-medium ${severity.text}`}>
                                                        เกินกำหนด {daysOverdue} วัน
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 ${severity.color} text-white text-xs rounded-full`}>
                                                {severity.label}
                                            </span>
                                            {hasReminder && (
                                                <span className="text-xs text-gray-500">
                                                    แจ้งเตือนล่าสุด: {formatDate(loan.last_reminder_at)}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleSendReminder(loan)}
                                                disabled={sendReminderMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                                            >
                                                <Bell className="w-4 h-4" />
                                                ส่งการแจ้งเตือน
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
