'use client'

import { ReportData } from '@/hooks/useReportData'
import { calculatePercentage } from '@/lib/reports'

interface ReservationsTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function ReservationsTab({ data, isLoading }: ReservationsTabProps) {
    return (
        <div className="space-y-6">
            {/* Reservation Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data?.reservationStats.total ?? 0}</p>
                    <p className="text-sm text-blue-700">ทั้งหมด</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{data?.reservationStats.pending ?? 0}</p>
                    <p className="text-sm text-yellow-700">รอดำเนินการ</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{data?.reservationStats.approved ?? 0}</p>
                    <p className="text-sm text-purple-700">อนุมัติแล้ว</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{data?.reservationStats.completed ?? 0}</p>
                    <p className="text-sm text-green-700">เสร็จสิ้น</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                    <p className="text-2xl font-bold text-gray-600">{data?.reservationStats.cancelled ?? 0}</p>
                    <p className="text-sm text-gray-700">ยกเลิก</p>
                </div>
            </div>

            {/* Conversion Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">อัตราความสำเร็จ</h3>
                    <p className="text-4xl font-bold text-green-600">
                        {calculatePercentage(data?.reservationStats.completed ?? 0, data?.reservationStats.total ?? 0)}
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                        การจองที่แปลงเป็นการยืมสำเร็จ
                    </p>
                </div>
                <div className="bg-orange-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">อัตราการยกเลิก</h3>
                    <p className="text-4xl font-bold text-orange-600">
                        {calculatePercentage(data?.reservationStats.cancelled ?? 0, data?.reservationStats.total ?? 0)}
                    </p>
                    <p className="text-sm text-orange-700 mt-2">
                        การจองที่ถูกยกเลิก
                    </p>
                </div>
            </div>
        </div>
    )
}
