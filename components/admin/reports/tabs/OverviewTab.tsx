'use client'

import dynamic from 'next/dynamic'
import ReportStatsCard from '@/components/admin/reports/ReportStatsCard'
import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { ReportData } from '@/hooks/useReportData'
import { exportOverdueReportCSV, exportPopularEquipmentCSV, calculatePercentage } from '@/lib/reports'
import { ClipboardList, Clock, AlertTriangle, Package, TrendingUp } from 'lucide-react'

// Dynamic imports for charts
const LoanStatusPieChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.LoanStatusPieChart })), { ssr: false })
const ReservationStatusPieChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.ReservationStatusPieChart })), { ssr: false })
const EquipmentStatusPieChart = dynamic(() => import('@/components/admin/reports/ReportCharts').then(mod => ({ default: mod.EquipmentStatusPieChart })), { ssr: false })

interface OverviewTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function OverviewTab({ data, isLoading }: OverviewTabProps) {
    const statsCards = [
        {
            label: 'การยืมวันนี้',
            value: data?.todayLoans ?? 0,
            icon: ClipboardList,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            label: 'รอดำเนินการ',
            value: data?.loanStats.pending ?? 0,
            icon: Clock,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600'
        },
        {
            label: 'เกินกำหนด',
            value: data?.loanStats.overdue ?? 0,
            icon: AlertTriangle,
            color: 'bg-red-500',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600'
        },
        {
            label: 'อุปกรณ์ถูกยืม',
            value: data?.equipmentStats.borrowed ?? 0,
            subValue: `จากทั้งหมด ${data?.equipmentStats.total ?? 0} ชิ้น`,
            icon: Package,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat) => (
                    <ReportStatsCard
                        key={stat.label}
                        {...stat}
                        loading={isLoading}
                    />
                ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loan Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการยืม-คืน</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">ทั้งหมด</span>
                            <span className="font-semibold">{data?.loanStats.total ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">อนุมัติแล้ว</span>
                            <span className="font-semibold text-blue-600">{data?.loanStats.approved ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">คืนแล้ว</span>
                            <span className="font-semibold text-green-600">{data?.loanStats.returned ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">ปฏิเสธ</span>
                            <span className="font-semibold text-red-600">{data?.loanStats.rejected ?? 0}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">อัตราการอนุมัติ</span>
                                <span className="font-semibold text-blue-600">
                                    {calculatePercentage(
                                        (data?.loanStats.approved ?? 0) + (data?.loanStats.returned ?? 0),
                                        data?.loanStats.total ?? 0
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reservation Summary */}
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปการจอง</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">ทั้งหมด</span>
                            <span className="font-semibold">{data?.reservationStats.total ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">อนุมัติแล้ว</span>
                            <span className="font-semibold text-blue-600">{data?.reservationStats.approved ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">เสร็จสิ้น</span>
                            <span className="font-semibold text-green-600">{data?.reservationStats.completed ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">ยกเลิก</span>
                            <span className="font-semibold text-gray-500">{data?.reservationStats.cancelled ?? 0}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">อัตราการยกเลิก</span>
                                <span className="font-semibold text-orange-600">
                                    {calculatePercentage(
                                        data?.reservationStats.cancelled ?? 0,
                                        data?.reservationStats.total ?? 0
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สัดส่วนสถานะการยืม</h3>
                    {data?.loanStats && (
                        <LoanStatusPieChart data={data.loanStats} />
                    )}
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สัดส่วนสถานะการจอง</h3>
                    {data?.reservationStats && (
                        <ReservationStatusPieChart data={data.reservationStats} />
                    )}
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะอุปกรณ์</h3>
                    {data?.equipmentStats && (
                        <EquipmentStatusPieChart data={data.equipmentStats} />
                    )}
                </div>
            </div>
        </div>
    )
}
