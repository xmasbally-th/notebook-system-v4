'use client'

import { useMemo } from 'react'
import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { ReportData } from '@/hooks/useReportData'
import { exportPopularEquipmentCSV, calculatePercentage } from '@/lib/reports'
import {
    Package,
    TrendingDown,
    TrendingUp,
    CheckCircle2,
    Clock,
    Wrench,
    AlertTriangle,
    BarChart3
} from 'lucide-react'

interface EquipmentTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

const STATUS_COLORS: Record<string, string> = {
    ready: 'bg-green-500',
    active: 'bg-green-500',
    borrowed: 'bg-blue-500',
    maintenance: 'bg-orange-500',
    retired: 'bg-gray-400',
}

export default function EquipmentTab({ data, isLoading }: EquipmentTabProps) {
    // Popular equipment columns
    const popularEquipmentColumns = [
        { key: 'rank', label: 'อันดับ' },
        { key: 'name', label: 'ชื่ออุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        { key: 'loan_count', label: 'จำนวนครั้งที่ยืม', render: columnRenderers.number },
        { key: 'total_usage', label: 'รวมการใช้งาน', render: columnRenderers.number }
    ]

    // Least borrowed equipment columns
    const leastBorrowedColumns = [
        { key: 'rank', label: 'อันดับ' },
        { key: 'name', label: 'ชื่ออุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        {
            key: 'type_name',
            label: 'ประเภท',
            render: (value: string) => (
                <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{value || '-'}</span>
            )
        },
        {
            key: 'total_usage',
            label: 'จำนวนครั้งที่ยืม',
            render: (value: number) => (
                <span className={`font-semibold ${value === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                    {value.toLocaleString()} ครั้ง
                </span>
            )
        },
        {
            key: 'status',
            label: 'สถานะ',
            render: (value: string) => {
                const map: Record<string, { label: string, color: string }> = {
                    'ready': { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700' },
                    'active': { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700' },
                    'borrowed': { label: 'ถูกใช้งาน', color: 'bg-blue-100 text-blue-700' },
                    'maintenance': { label: 'ซ่อมบำรุง', color: 'bg-orange-100 text-orange-700' },
                    'retired': { label: 'เลิกใช้งาน', color: 'bg-red-100 text-red-700' },
                }
                const config = map[value] || { label: value, color: 'bg-gray-100 text-gray-700' }
                return (
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                        {config.label}
                    </span>
                )
            }
        }
    ]

    // Category breakdown data
    const categoryBreakdown = useMemo(() => {
        if (!data?.allEquipment || !data?.equipmentTypes) return []

        return data.equipmentTypes.map(type => {
            const items = data.allEquipment.filter(eq => eq.equipment_type_id === type.id)
            const total = items.length
            const ready = items.filter(e => e.status === 'ready' || e.status === 'active').length
            const borrowed = items.filter(e => e.status === 'borrowed').length
            const maintenance = items.filter(e => e.status === 'maintenance').length
            const usageRate = total > 0 ? Math.round((borrowed / total) * 100) : 0

            return {
                id: type.id,
                name: type.name,
                icon: type.icon,
                total,
                ready,
                borrowed,
                maintenance,
                usageRate
            }
        }).sort((a, b) => b.total - a.total)
    }, [data?.allEquipment, data?.equipmentTypes])

    // Least borrowed equipment
    const leastBorrowedEquipment = useMemo(() => {
        if (!data?.allEquipment || !data?.popularEquipment) return []

        // Build usage count map from popularEquipment
        const usageMap: Record<string, number> = {}
        data.popularEquipment.forEach(item => {
            usageMap[item.id] = item.total_usage
        })

        // Map all equipment with their usage count
        return data.allEquipment
            .map(eq => {
                const type = data.equipmentTypes?.find(t => t.id === eq.equipment_type_id)
                return {
                    id: eq.id,
                    name: eq.name,
                    equipment_number: eq.equipment_number,
                    status: eq.status,
                    type_name: type ? `${type.icon} ${type.name}` : '-',
                    total_usage: usageMap[eq.id] || 0,
                }
            })
            .sort((a, b) => a.total_usage - b.total_usage)
            .slice(0, 10)
            .map((item, index) => ({ ...item, rank: index + 1 }))
    }, [data?.allEquipment, data?.popularEquipment, data?.equipmentTypes])

    // Uncategorized equipment count
    const uncategorizedCount = useMemo(() => {
        if (!data?.allEquipment || !data?.equipmentTypes) return 0
        const typeIds = new Set(data.equipmentTypes.map(t => t.id))
        return data.allEquipment.filter(eq => !typeIds.has(eq.equipment_type_id)).length
    }, [data?.allEquipment, data?.equipmentTypes])

    return (
        <div className="space-y-8">
            {/* Equipment Status Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100">
                    <Package className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-600">{data?.equipmentStats.total ?? 0}</p>
                    <p className="text-xs text-blue-600/70">ทั้งหมด</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{data?.equipmentStats.ready ?? 0}</p>
                    <p className="text-xs text-green-600/70">พร้อมใช้งาน</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 text-center border border-purple-100">
                    <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-600">{data?.equipmentStats.borrowed ?? 0}</p>
                    <p className="text-xs text-purple-600/70">ถูกยืม</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center border border-orange-100">
                    <Wrench className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-orange-600">{data?.equipmentStats.maintenance ?? 0}</p>
                    <p className="text-xs text-orange-600/70">ซ่อมบำรุง</p>
                </div>
            </div>

            {/* Usage Rate Bar */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">อัตราการใช้งานปัจจุบัน</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${data?.equipmentStats.total ? Math.round((data.equipmentStats.borrowed / data.equipmentStats.total) * 100) : 0}%`
                            }}
                        />
                    </div>
                    <span className="text-xl font-bold text-gray-900 min-w-[3ch]">
                        {calculatePercentage(data?.equipmentStats.borrowed ?? 0, data?.equipmentStats.total ?? 0)}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium text-gray-900">{data?.equipmentStats.borrowed ?? 0}</span> จาก <span className="font-medium text-gray-900">{data?.equipmentStats.total ?? 0}</span> ชิ้นกำลังถูกใช้งาน
                </p>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">สรุปอุปกรณ์ตามประเภท</h3>
                </div>
                <div className="p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : categoryBreakdown.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลประเภทอุปกรณ์</p>
                    ) : (
                        <div className="space-y-4">
                            {categoryBreakdown.map(cat => (
                                <div key={cat.id} className="bg-gray-50/80 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{cat.icon}</span>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{cat.name}</h4>
                                                <p className="text-xs text-gray-500">ทั้งหมด {cat.total} ชิ้น</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-gray-900">{cat.usageRate}%</span>
                                            <p className="text-xs text-gray-500">ใช้งาน</p>
                                        </div>
                                    </div>

                                    {/* Status bar */}
                                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 mb-2">
                                        {cat.total > 0 && (
                                            <>
                                                {cat.ready > 0 && (
                                                    <div
                                                        className="bg-green-500 transition-all duration-500"
                                                        style={{ width: `${(cat.ready / cat.total) * 100}%` }}
                                                        title={`พร้อมใช้งาน: ${cat.ready}`}
                                                    />
                                                )}
                                                {cat.borrowed > 0 && (
                                                    <div
                                                        className="bg-blue-500 transition-all duration-500"
                                                        style={{ width: `${(cat.borrowed / cat.total) * 100}%` }}
                                                        title={`ถูกยืม: ${cat.borrowed}`}
                                                    />
                                                )}
                                                {cat.maintenance > 0 && (
                                                    <div
                                                        className="bg-orange-500 transition-all duration-500"
                                                        style={{ width: `${(cat.maintenance / cat.total) * 100}%` }}
                                                        title={`ซ่อมบำรุง: ${cat.maintenance}`}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Status labels */}
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            <span className="text-gray-600">พร้อมใช้ {cat.ready}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            <span className="text-gray-600">ถูกยืม {cat.borrowed}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            <span className="text-gray-600">ซ่อมบำรุง {cat.maintenance}</span>
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Uncategorized */}
                            {uncategorizedCount > 0 && (
                                <div className="bg-yellow-50/50 rounded-xl p-4 border border-yellow-100">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm text-yellow-700">
                                            อุปกรณ์ที่ยังไม่จัดประเภท: <span className="font-bold">{uncategorizedCount}</span> ชิ้น
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Popular Equipment (Most Borrowed) */}
            <div className="relative">
                <div className="absolute -top-2 left-6 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm">
                        <TrendingUp className="w-3 h-3" />
                        ยืมมาก
                    </span>
                </div>
                <ReportTable
                    title="อุปกรณ์ที่ถูกยืมมากที่สุด"
                    columns={popularEquipmentColumns}
                    data={(data?.popularEquipment ?? []).map((item, index) => ({ ...item, rank: index + 1 }))}
                    loading={isLoading}
                    emptyMessage="ไม่มีข้อมูลการใช้งาน"
                    onExport={() => data?.popularEquipment && exportPopularEquipmentCSV(data.popularEquipment)}
                />
            </div>

            {/* Least Borrowed Equipment */}
            <div className="relative">
                <div className="absolute -top-2 left-6 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-sm">
                        <TrendingDown className="w-3 h-3" />
                        ยืมน้อย
                    </span>
                </div>
                <ReportTable
                    title="อุปกรณ์ที่ถูกยืมน้อยที่สุด"
                    columns={leastBorrowedColumns}
                    data={leastBorrowedEquipment}
                    loading={isLoading}
                    emptyMessage="ไม่มีข้อมูลอุปกรณ์"
                />
            </div>
        </div>
    )
}
