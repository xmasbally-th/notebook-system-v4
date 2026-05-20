'use client'

import dynamic from 'next/dynamic'
import ReportStatsCard from '@/components/admin/reports/ReportStatsCard'
import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { ReportData } from '@/hooks/useReportData'
import { exportOverdueReportCSV, exportPopularEquipmentCSV, calculatePercentage } from '@/lib/reports'
import { ClipboardList, Clock, AlertTriangle, Package, TrendingUp, Award, Building2, Layers } from 'lucide-react'

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

            {/* Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Popular Equipment */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500 animate-pulse" />
                                <h3 className="text-lg font-semibold text-gray-900">5 อันดับอุปกรณ์ยอดนิยม</h3>
                            </div>
                            <span className="text-xs text-gray-400">จำนวนครั้งที่ถูกเลือก</span>
                        </div>
                        <div className="space-y-4">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex items-center justify-between py-1">
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                        </div>
                                        <div className="h-6 bg-gray-100 rounded w-10"></div>
                                    </div>
                                ))
                            ) : !data?.popularEquipment?.length ? (
                                <div className="text-center py-8 text-gray-400 text-sm">ไม่มีประวัติการใช้งานในช่วงเวลานี้</div>
                            ) : (
                                data.popularEquipment.slice(0, 5).map((item, index) => {
                                    const maxUsage = data.popularEquipment[0]?.total_usage || 1
                                    const percentage = (item.total_usage / maxUsage) * 100
                                    return (
                                        <div key={item.id} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                        index === 1 ? 'bg-gray-100 text-gray-800' :
                                                        index === 2 ? 'bg-amber-100 text-amber-800' :
                                                        'text-gray-400'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-medium text-gray-800 truncate" title={item.name}>
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400 shrink-0">({item.equipment_number})</span>
                                                </div>
                                                <span className="font-semibold text-blue-600 shrink-0">{item.total_usage} ครั้ง</span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Departments */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-semibold text-gray-900">สาขาวิชาที่ใช้งานสูงสุด</h3>
                            </div>
                            <span className="text-xs text-gray-400">ตามจำนวนธุรกรรม</span>
                        </div>
                        <div className="space-y-4">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex items-center justify-between py-1">
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                            <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                                        </div>
                                        <div className="h-6 bg-gray-100 rounded w-10"></div>
                                    </div>
                                ))
                            ) : !data?.departmentStats?.length ? (
                                <div className="text-center py-8 text-gray-400 text-sm">ไม่มีข้อมูลสาขาวิชาในช่วงเวลานี้</div>
                            ) : (
                                data.departmentStats.slice(0, 5).map((item, index) => {
                                    const maxTotal = data.departmentStats[0]?.total || 1
                                    const percentage = (item.total / maxTotal) * 100
                                    return (
                                        <div key={item.department} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <span className="text-gray-400 text-xs w-4 font-semibold">{index + 1}.</span>
                                                    <span className="font-medium text-gray-800 truncate" title={item.department}>
                                                        {item.department}
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-gray-700 shrink-0">
                                                    {item.total} ครั้ง <span className="text-xs text-gray-400 font-normal">(ยืม {item.loans} / จอง {item.reservations})</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Special Bulk Loans Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-purple-500" />
                                <h3 className="text-lg font-semibold text-gray-900">การยืมกรณีพิเศษ (กลุ่ม/เหมา)</h3>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex justify-between py-1">
                                        <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                                        <div className="h-4 bg-gray-100 rounded w-12"></div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                                        <span className="text-gray-500">การยืมพิเศษทั้งหมด</span>
                                        <span className="font-semibold text-gray-800">{data?.specialLoanStats.total ?? 0} รายการ</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                                        <span className="text-gray-500">กำลังยืมอยู่ (Active)</span>
                                        <span className="font-semibold text-orange-600">{data?.specialLoanStats.active ?? 0} รายการ</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                                        <span className="text-gray-500">คืนสินค้าเรียบร้อย</span>
                                        <span className="font-semibold text-green-600">{data?.specialLoanStats.returned ?? 0} รายการ</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                                        <span className="text-gray-500">จำนวนอุปกรณ์ที่จ่ายออก</span>
                                        <span className="font-semibold text-purple-600">{data?.specialLoanStats.totalEquipment ?? 0} ชิ้น</span>
                                    </div>
                                </>
                            )}

                            {/* Latest active special loan notification */}
                            {!isLoading && data?.specialLoanStats?.items?.some(l => l.status === 'active') && (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-orange-800">มีรายการยืมพิเศษที่ยังไม่คืน</span>
                                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                                    </div>
                                    {data.specialLoanStats.items
                                        .filter(l => l.status === 'active')
                                        .slice(0, 1)
                                        .map(loan => (
                                            <p key={loan.id} className="text-xs text-orange-700 truncate" title={`${loan.borrower_name} ยืม ${loan.equipment_type_name} ${loan.quantity} ชิ้น`}>
                                                {loan.borrower_name} ยืม {loan.equipment_type_name} {loan.quantity} ชิ้น ({loan.purpose})
                                            </p>
                                        ))
                                    }
                                </div>
                            )}
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
