'use client'

import { useState, useCallback } from 'react'
import { Download, FileSpreadsheet, FileJson, Calendar, Users, Package, Star } from 'lucide-react'
import ReportDateRangePicker from '@/components/admin/reports/ReportDateRangePicker'
import {
    DataType,
    ExportFormat,
    DateRange,
    ExportOptions,
    fetchExportData,
    exportData,
    downloadBlob,
    generateExportFilename,
    getStatusOptions,
    PreviewData
} from '@/lib/dataManagement'
import { logStaffActivity } from '@/lib/staffActivityLog'

interface ExportTabProps {
    userId: string
}

export default function ExportTab({ userId }: ExportTabProps) {
    const [dataType, setDataType] = useState<DataType>('loans')
    const [format, setFormat] = useState<ExportFormat>('csv')
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const to = new Date()
        to.setHours(23, 59, 59, 999)
        const from = new Date()
        from.setDate(from.getDate() - 29)
        from.setHours(0, 0, 0, 0)
        return { from, to }
    })
    const [includeRelated, setIncludeRelated] = useState(true)
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [preview, setPreview] = useState<PreviewData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const dataTypeOptions = [
        { value: 'loans' as DataType, label: 'รายการยืม-คืน', icon: FileSpreadsheet },
        { value: 'reservations' as DataType, label: 'รายการจอง', icon: Calendar },
        { value: 'equipment' as DataType, label: 'ข้อมูลอุปกรณ์', icon: Package },
        { value: 'evaluations' as DataType, label: 'ข้อมูลการประเมิน', icon: Star }
    ]

    const statusOptions = getStatusOptions(dataType)

    const handlePreview = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const options: ExportOptions = {
                dataType,
                format,
                dateRange,
                includeRelated,
                statusFilter: selectedStatuses.length > 0 ? selectedStatuses : undefined
            }
            const data = await fetchExportData(options)
            setPreview(data)
        } catch (err) {
            setError((err as Error).message)
            setPreview(null)
        } finally {
            setIsLoading(false)
        }
    }, [dataType, format, dateRange, includeRelated, selectedStatuses])

    const handleExport = useCallback(async () => {
        setIsExporting(true)
        setError(null)
        try {
            const options: ExportOptions = {
                dataType,
                format,
                dateRange,
                includeRelated,
                statusFilter: selectedStatuses.length > 0 ? selectedStatuses : undefined
            }
            const blob = await exportData(options)
            const filename = generateExportFilename(dataType, format)
            downloadBlob(blob, filename)

            // Log activity
            await logStaffActivity({
                staffId: userId,
                staffRole: 'admin',
                actionType: 'export_data',
                targetType: 'loan',
                targetId: 'bulk',
                details: {
                    dataType,
                    format,
                    recordCount: preview?.total || 0,
                    dateRange: {
                        from: dateRange.from.toISOString(),
                        to: dateRange.to.toISOString()
                    }
                }
            })
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setIsExporting(false)
        }
    }, [dataType, format, dateRange, includeRelated, selectedStatuses, userId, preview])

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        )
    }

    return (
        <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-1">📤 ส่งออกข้อมูล</h3>
                <p className="text-sm text-blue-700">
                    เลือกประเภทข้อมูล, รูปแบบไฟล์, และช่วงวันที่ที่ต้องการ แล้วกด "ดูตัวอย่าง" เพื่อดูจำนวนข้อมูล
                </p>
            </div>

            {/* Data Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">ประเภทข้อมูล</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {dataTypeOptions.map(option => {
                        const Icon = option.icon
                        const isSelected = dataType === option.value
                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setDataType(option.value)
                                    setSelectedStatuses([])
                                    setPreview(null)
                                }}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="font-medium">{option.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Format Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">รูปแบบไฟล์</label>
                <div className="flex gap-3">
                    <button
                        onClick={() => setFormat('csv')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all ${format === 'csv'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="font-medium">CSV</span>
                        <span className="text-xs text-gray-500">(Excel)</span>
                    </button>
                    <button
                        onClick={() => setFormat('json')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all ${format === 'json'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FileJson className={`w-5 h-5 ${format === 'json' ? 'text-purple-600' : 'text-gray-400'}`} />
                        <span className="font-medium">JSON</span>
                    </button>
                </div>
            </div>

            {/* Date Range */}
            {dataType !== 'equipment' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">ช่วงวันที่</label>
                    <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
                </div>
            )}

            {/* Status Filter */}
            {dataType !== 'equipment' && statusOptions.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">กรองตามสถานะ (ไม่เลือก = ทั้งหมด)</label>
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map(status => (
                            <button
                                key={status.value}
                                onClick={() => toggleStatus(status.value)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedStatuses.includes(status.value)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Options */}
            {dataType !== 'equipment' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">ตัวเลือกเพิ่มเติม</label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeRelated}
                            onChange={(e) => setIncludeRelated(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">รวมข้อมูลผู้ยืมและอุปกรณ์</span>
                    </label>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">เกิดข้อผิดพลาด</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">ตัวอย่างข้อมูล</h4>
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {preview.total.toLocaleString()} รายการ
                        </span>
                    </div>
                    {preview.total > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        {preview.columns.slice(0, 5).map(col => (
                                            <th key={col} className="px-3 py-2 text-left font-medium text-gray-600">
                                                {col}
                                            </th>
                                        ))}
                                        {preview.columns.length > 5 && (
                                            <th className="px-3 py-2 text-left font-medium text-gray-400">
                                                +{preview.columns.length - 5} คอลัมน์
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {preview.sample.slice(0, 3).map((row, i) => (
                                        <tr key={i}>
                                            {preview.columns.slice(0, 5).map(col => (
                                                <td key={col} className="px-3 py-2 text-gray-700 max-w-[150px] truncate">
                                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                                                </td>
                                            ))}
                                            {preview.columns.length > 5 && (
                                                <td className="px-3 py-2 text-gray-400">...</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {preview.total > 3 && (
                                <p className="text-sm text-gray-500 mt-2 text-center">
                                    แสดง 3 รายการแรกจากทั้งหมด {preview.total.toLocaleString()} รายการ
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">ไม่พบข้อมูลในช่วงที่เลือก</p>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={handlePreview}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Users className="w-5 h-5" />
                    )}
                    ดูตัวอย่าง
                </button>
                <button
                    onClick={handleExport}
                    disabled={isExporting || !preview || preview.total === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isExporting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                    ดาวน์โหลด {format.toUpperCase()}
                </button>
            </div>
        </div>
    )
}
