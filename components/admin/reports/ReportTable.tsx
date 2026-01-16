'use client'

import { Download } from 'lucide-react'
import { getStatusLabel, getStatusColor } from '@/lib/reports'
import { formatThaiDate } from '@/lib/formatThaiDate'

interface Column {
    key: string
    label: string
    render?: (value: any, row: any) => React.ReactNode
}

interface ReportTableProps {
    title: string
    columns: Column[]
    data: any[]
    loading?: boolean
    emptyMessage?: string
    onExport?: () => void
}

export default function ReportTable({
    title,
    columns,
    data,
    loading = false,
    emptyMessage = 'ไม่มีข้อมูล',
    onExport
}: ReportTableProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            // Loading skeleton
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            // Empty state
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            // Data rows
                            data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-6 py-4 text-sm text-gray-700">
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {!loading && data.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
                    แสดง {data.length} รายการ
                </div>
            )}
        </div>
    )
}

// Pre-built column renderers
export const columnRenderers = {
    status: (value: string) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {getStatusLabel(value)}
        </span>
    ),
    date: (value: string) => formatThaiDate(value),
    number: (value: number) => value.toLocaleString(),
    daysOverdue: (value: number) => (
        <span className={`font-medium ${value > 7 ? 'text-red-600' : value > 3 ? 'text-orange-600' : 'text-yellow-600'}`}>
            {value} วัน
        </span>
    )
}
