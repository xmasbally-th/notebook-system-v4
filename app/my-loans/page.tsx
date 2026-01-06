'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient, getSupabaseCredentials } from '@/lib/supabase-helpers'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle2, XCircle, Package, ArrowLeft, CalendarDays, FileText, Loader2 } from 'lucide-react'

type LoanStatus = 'pending' | 'approved' | 'rejected' | 'returned'

const statusConfig: Record<LoanStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
    approved: { label: 'อนุมัติแล้ว', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { label: 'ถูกปฏิเสธ', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" /> },
    returned: { label: 'คืนแล้ว', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Package className="w-4 h-4" /> },
}

export default function MyLoansPage() {
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const client = getSupabaseBrowserClient()
        if (client) {
            client.auth.getUser().then(({ data: { user } }) => {
                setUserId(user?.id || null)
            })
        }
    }, [])

    // Fetch loans using direct fetch
    const { data: loans, isLoading, error } = useQuery({
        queryKey: ['my-loans', userId],
        enabled: !!userId,
        staleTime: 30000,
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key || !userId) return []

            const response = await fetch(
                `${url}/rest/v1/loanRequests?user_id=eq.${userId}&select=*,equipment(id,name,equipment_number,images)&order=created_at.desc`,
                {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${key}`
                    }
                }
            )
            if (!response.ok) return []
            return response.json()
        },
    })

    if (!userId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">กำลังโหลด...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับหน้าหลัก
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">ประวัติการยืม</h1>
                    <p className="mt-2 text-gray-500">ดูสถานะคำขอยืมอุปกรณ์ทั้งหมดของคุณ</p>
                </div>

                {/* Loans List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 bg-red-50 rounded-xl">
                        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    </div>
                ) : loans?.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีประวัติการยืม</h3>
                        <p className="text-gray-500 mb-6">เริ่มยืมอุปกรณ์ได้โดยเลือกจากรายการอุปกรณ์</p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            ดูรายการอุปกรณ์
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {loans.map((loan: any) => {
                            const status = loan.status as LoanStatus
                            const config = statusConfig[status] || statusConfig.pending
                            const equipment = loan.equipment
                            const images = Array.isArray(equipment?.images) ? equipment.images : []
                            const imageUrl = images.length > 0 ? images[0] : 'https://placehold.co/100x100?text=No+Image'

                            return (
                                <div
                                    key={loan.id}
                                    className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Equipment Image */}
                                        <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                                src={imageUrl}
                                                alt={equipment?.name || 'Equipment'}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                        {equipment?.name || 'ไม่ระบุอุปกรณ์'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-mono">
                                                        #{equipment?.equipment_number}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                                                    {config.icon}
                                                    {config.label}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-3">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarDays className="w-4 h-4" />
                                                    <span>
                                                        {new Date(loan.start_date).toLocaleDateString('th-TH')} - {new Date(loan.end_date).toLocaleDateString('th-TH')}
                                                    </span>
                                                </div>
                                                {loan.reason && (
                                                    <div className="flex items-center gap-1.5">
                                                        <FileText className="w-4 h-4" />
                                                        <span className="truncate max-w-[200px]">{loan.reason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
