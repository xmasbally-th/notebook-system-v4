'use client'

import { useState, useMemo } from 'react'
import ReportTable, { columnRenderers } from '@/components/admin/reports/ReportTable'
import { ReportData } from '@/hooks/useReportData'
import { exportPopularEquipmentCSV, calculatePercentage } from '@/lib/reports'
import {
    Search,
    Filter,
    LayoutGrid,
    List as ListIcon,
    Package,
    CheckCircle2,
    Clock,
    Wrench,
    AlertTriangle,
    X
} from 'lucide-react'

interface EquipmentTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function EquipmentTab({ data, isLoading }: EquipmentTabProps) {
    const [selectedTypeId, setSelectedTypeId] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

    // Existing columns for popular equipment
    const popularEquipmentColumns = [
        { key: 'rank', label: 'อันดับ' },
        { key: 'name', label: 'ชื่ออุปกรณ์' },
        { key: 'equipment_number', label: 'รหัส' },
        { key: 'loan_count', label: 'จำนวนครั้งที่ยืม', render: columnRenderers.number },
        { key: 'total_usage', label: 'รวมการใช้งาน', render: columnRenderers.number }
    ]

    // Filter equipment logic
    const filteredEquipment = useMemo(() => {
        if (!data?.allEquipment) return []

        return data.allEquipment.filter(item => {
            const matchesType = selectedTypeId === 'all' || item.equipment_type_id === selectedTypeId
            const matchesSearch = searchTerm === '' ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.equipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()))

            return matchesType && matchesSearch
        })
    }, [data?.allEquipment, selectedTypeId, searchTerm])

    return (
        <div className="space-y-8">
            {/* Equipment Status Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data?.equipmentStats.total ?? 0}</p>
                    <p className="text-sm text-blue-700">ทั้งหมด</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{data?.equipmentStats.ready ?? 0}</p>
                    <p className="text-sm text-green-700">พร้อมใช้งาน</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{data?.equipmentStats.borrowed ?? 0}</p>
                    <p className="text-sm text-purple-700">ถูกยืม</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">{data?.equipmentStats.maintenance ?? 0}</p>
                    <p className="text-sm text-orange-700">ซ่อมบำรุง</p>
                </div>
            </div>

            {/* Usage Rate Bar */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">อัตราการใช้งานปัจจุบัน</h3>
                <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 relative"
                            style={{
                                width: `${data?.equipmentStats.total ? Math.round((data.equipmentStats.borrowed / data.equipmentStats.total) * 100) : 0}%`
                            }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-gray-900 min-w-[3ch]">
                        {calculatePercentage(data?.equipmentStats.borrowed ?? 0, data?.equipmentStats.total ?? 0)}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium text-gray-900">{data?.equipmentStats.borrowed ?? 0}</span> จาก <span className="font-medium text-gray-900">{data?.equipmentStats.total ?? 0}</span> ชิ้นกำลังถูกใช้งาน
                </p>
            </div>

            {/* Popular Equipment Table */}
            <ReportTable
                title="อุปกรณ์ยอดนิยม"
                columns={popularEquipmentColumns}
                data={(data?.popularEquipment ?? []).map((item, index) => ({ ...item, rank: index + 1 }))}
                loading={isLoading}
                emptyMessage="ไม่มีข้อมูลการใช้งาน"
                onExport={() => data?.popularEquipment && exportPopularEquipmentCSV(data.popularEquipment)}
            />

            {/* All Equipment List with Filters */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">รายการอุปกรณ์ทั้งหมด</h3>

                        {/* View Toggle */}
                        <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ, รหัส, ยี่ห้อ..."
                                className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Type Filter */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <select
                                value={selectedTypeId}
                                onChange={(e) => setSelectedTypeId(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all min-w-[150px]"
                            >
                                <option value="all">ทุกประเภท</option>
                                {data?.equipmentTypes?.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.icon} {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
                    ) : filteredEquipment.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 bg-gray-50/50">
                            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p>ไม่พบอุปกรณ์ที่ค้นหา</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'list' ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รูปภาพ</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่ออุปกรณ์</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสครุภัณฑ์</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยี่ห้อ/รุ่น</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {filteredEquipment.map((item) => {
                                                const type = data?.equipmentTypes?.find(t => t.id === item.equipment_type_id)
                                                const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null

                                                const statusMap: Record<string, { label: string, color: string, icon: any }> = {
                                                    'ready': { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
                                                    'active': { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
                                                    'borrowed': { label: 'ถูกใช้งาน', color: 'bg-blue-100 text-blue-700', icon: Clock },
                                                    'maintenance': { label: 'ซ่อมบำรุง', color: 'bg-orange-100 text-orange-700', icon: Wrench },
                                                    'retired': { label: 'เลิกใช้งาน', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
                                                }
                                                const config = statusMap[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700', icon: Package }
                                                const StatusIcon = config.icon

                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="h-10 w-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                                {imageUrl ? (
                                                                    <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                                        <Package className="w-5 h-5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500 font-mono">{item.equipment_number}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {type ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-200">
                                                                    <span>{type.icon}</span>
                                                                    <span>{type.name}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{item.brand || '-'}</div>
                                                            {item.model && <div className="text-xs text-gray-500">{item.model}</div>}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {config.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                                    {filteredEquipment.map((item) => {
                                        const type = data?.equipmentTypes?.find(t => t.id === item.equipment_type_id)
                                        const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null

                                        const statusMap: Record<string, { label: string, color: string, icon: any }> = {
                                            'ready': { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
                                            'active': { label: 'พร้อมใช้งาน', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
                                            'borrowed': { label: 'ถูกใช้งาน', color: 'bg-blue-100 text-blue-700', icon: Clock },
                                            'maintenance': { label: 'ซ่อมบำรุง', color: 'bg-orange-100 text-orange-700', icon: Wrench },
                                            'retired': { label: 'เลิกใช้งาน', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
                                        }
                                        const config = statusMap[item.status] || { label: item.status, color: 'bg-gray-100 text-gray-700', icon: Package }
                                        const StatusIcon = config.icon

                                        return (
                                            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                            <Package className="w-12 h-12" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm bg-white/90 ${config.color.replace('bg-', 'text-')}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('bg-', 'bg-').split(' ')[0].replace('100', '500')}`}></span>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h4 className="font-medium text-gray-900 line-clamp-2" title={item.name}>{item.name}</h4>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                                        <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{item.equipment_number}</span>
                                                        {type && <span>{type.name}</span>}
                                                    </div>
                                                    {(item.brand || item.model) && (
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {item.brand} {item.model}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div >
    )
}
