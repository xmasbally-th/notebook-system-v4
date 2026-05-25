'use client'

import { useState, useCallback } from 'react'
import { Trash2, AlertTriangle, FileSpreadsheet, Calendar, Package, Archive, CheckCircle, Bell, Star, MessageSquare } from 'lucide-react'
import ReportDateRangePicker from '@/components/admin/reports/ReportDateRangePicker'
import {
    DataType,
    DateRange,
    fetchDeletePreview,
    softDeleteData,
    getStatusOptions,
    PreviewData,
    DeleteResult,
    RATE_LIMITS,
    fetchNotificationsPreview,
    hardDeleteNotifications,
    getNotificationTypeOptions,
    NotificationDeleteResult
} from '@/lib/dataManagement'
import { logStaffActivity } from '@/lib/staffActivityLog'

interface DeleteTabProps {
    userId: string
}

export default function DeleteTab({ userId }: DeleteTabProps) {
    const [dataType, setDataType] = useState<DataType>('loans')
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const to = new Date()
        to.setHours(23, 59, 59, 999)
        const from = new Date()
        from.setFullYear(from.getFullYear() - 1)
        from.setHours(0, 0, 0, 0)
        return { from, to }
    })
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['returned', 'cancelled'])
    const [preview, setPreview] = useState<PreviewData | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [deleteResult, setDeleteResult] = useState<DeleteResult | NotificationDeleteResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedNotificationTypes, setSelectedNotificationTypes] = useState<string[]>([])

    const dataTypeOptions = [
        { value: 'loans' as DataType, label: 'รายการยืม-คืน', icon: FileSpreadsheet },
        { value: 'reservations' as DataType, label: 'รายการจอง', icon: Calendar },
        { value: 'equipment' as DataType, label: 'ข้อมูลอุปกรณ์', icon: Package },
        { value: 'notifications' as DataType, label: 'การแจ้งเตือน', icon: Bell },
        { value: 'evaluations' as DataType, label: 'ข้อมูลการประเมิน', icon: Star }
    ]

    const statusOptions = dataType === 'notifications'
        ? getStatusOptions(dataType)
        : getStatusOptions(dataType).filter(s =>
            ['returned', 'cancelled', 'rejected', 'completed', 'expired', 'retired', 'read', 'unread'].includes(s.value)
        )

    const notificationTypeOptions = getNotificationTypeOptions()

    const handlePreview = useCallback(async () => {
        if (dataType !== 'notifications' && dataType !== 'evaluations' && selectedStatuses.length === 0) {
            setError('กรุณาเลือกสถานะอย่างน้อย 1 รายการ')
            return
        }

        setIsLoading(true)
        setError(null)
        setDeleteResult(null)

        try {
            let data: PreviewData
            if (dataType === 'notifications') {
                data = await fetchNotificationsPreview(dateRange, selectedStatuses, selectedNotificationTypes)
            } else {
                data = await fetchDeletePreview(dataType, dateRange, selectedStatuses)
            }
            setPreview(data)
            // Auto-select all
            if (data.sample) {
                setSelectedIds(data.sample.map((item: any) => item.id))
            }
        } catch (err) {
            setError((err as Error).message)
            setPreview(null)
        } finally {
            setIsLoading(false)
        }
    }, [dataType, dateRange, selectedStatuses, selectedNotificationTypes])

    const handleDelete = useCallback(async () => {
        if (selectedIds.length === 0) return

        setIsDeleting(true)
        setError(null)

        try {
            let result: DeleteResult | NotificationDeleteResult

            if (dataType === 'notifications') {
                // Hard delete for notifications (no backup)
                result = await hardDeleteNotifications(selectedIds)
            } else {
                // Soft delete for other data types
                result = await softDeleteData(selectedIds, dataType)
            }

            setDeleteResult(result)
            setShowConfirm(false)

            // Log activity
            await logStaffActivity({
                staffId: userId,
                staffRole: 'admin',
                actionType: dataType === 'notifications' ? 'hard_delete_notifications' : 'soft_delete_data',
                targetType: dataType === 'notifications' ? 'notification' : (dataType === 'evaluations' ? 'evaluation' : 'loan'),
                targetId: 'bulk',
                details: {
                    dataType,
                    deletedCount: result.deleted,
                    backedUpCount: 'backedUp' in result ? result.backedUp : 0,
                    dateRange: {
                        from: dateRange.from.toISOString(),
                        to: dateRange.to.toISOString()
                    },
                    statuses: selectedStatuses,
                    notificationTypes: selectedNotificationTypes
                }
            })

            // Clear preview after successful delete
            if (result.deleted > 0) {
                setPreview(null)
                setSelectedIds([])
            }
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setIsDeleting(false)
        }
    }, [selectedIds, dataType, userId, dateRange, selectedStatuses, selectedNotificationTypes])

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        )
        setPreview(null)
    }

    const toggleSelectAll = () => {
        if (preview?.sample) {
            const allIds = preview.sample.map((item: any) => item.id)
            if (selectedIds.length === allIds.length) {
                setSelectedIds([])
            } else {
                setSelectedIds(allIds)
            }
        }
    }

    const toggleSelectItem = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    return (
        <div className="space-y-6">
            {/* Warning */}
            <div className={`rounded-xl p-4 ${dataType === 'notifications' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${dataType === 'notifications' ? 'text-red-600' : 'text-yellow-600'}`} />
                    <div>
                        {dataType === 'notifications' ? (
                            <>
                                <h3 className="font-semibold text-red-900 mb-1">🔔 การลบการแจ้งเตือน (Hard Delete)</h3>
                                <p className="text-sm text-red-700">
                                    การแจ้งเตือนจะถูกลบถาวร ไม่สามารถกู้คืนได้
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 className="font-semibold text-yellow-900 mb-1">⚠️ การลบข้อมูล (Soft Delete)</h3>
                                <p className="text-sm text-yellow-700">
                                    ข้อมูลที่ลบจะถูกเก็บ backup ไว้ 30 วัน สามารถกู้คืนได้ภายหลัง
                                </p>
                            </>
                        )}
                        <p className={`text-xs mt-1 ${dataType === 'notifications' ? 'text-red-600' : 'text-yellow-600'}`}>
                            จำกัด {RATE_LIMITS.delete.maxRecords} รายการต่อครั้ง
                        </p>
                    </div>
                </div>
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
                                    if (option.value === 'evaluations') {
                                        setSelectedStatuses([])
                                    } else if (option.value === 'notifications') {
                                        setSelectedStatuses(['read'])
                                    } else {
                                        setSelectedStatuses(['returned', 'cancelled'])
                                    }
                                    setSelectedNotificationTypes([])
                                    setPreview(null)
                                    setDeleteResult(null)
                                }}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSelected
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} />
                                <span className="font-medium">{option.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Status Filter */}
            {dataType !== 'equipment' && statusOptions.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        {dataType === 'notifications' ? 'เลือกสถานะการอ่าน' : 'เลือกสถานะที่ต้องการลบ'} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map(status => (
                            <button
                                key={status.value}
                                onClick={() => toggleStatus(status.value)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedStatuses.includes(status.value)
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Notification Type Filter */}
            {dataType === 'notifications' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        กรองตามประเภทการแจ้งเตือน <span className="text-gray-400">(ไม่เลือก = ทุกประเภท)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {notificationTypeOptions.map(type => (
                            <button
                                key={type.value}
                                onClick={() => {
                                    setSelectedNotificationTypes(prev =>
                                        prev.includes(type.value)
                                            ? prev.filter(t => t !== type.value)
                                            : [...prev, type.value]
                                    )
                                    setPreview(null)
                                }}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedNotificationTypes.includes(type.value)
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Date Range */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">ช่วงวันที่ (ข้อมูลที่สร้างในช่วงนี้)</label>
                <ReportDateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-medium">เกิดข้อผิดพลาด</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Delete Result */}
            {deleteResult && (
                <div className={`rounded-xl p-4 ${deleteResult.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-2 font-medium mb-2">
                        {deleteResult.errors.length === 0 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        )}
                        <span className={deleteResult.errors.length === 0 ? 'text-green-700' : 'text-yellow-700'}>
                            ผลการลบข้อมูล
                        </span>
                    </div>
                    <div className="text-sm space-y-1">
                        <p className="text-green-700">✓ ลบสำเร็จ: {deleteResult.deleted} รายการ</p>
                        {'backedUp' in deleteResult && (
                            <p className="text-blue-700">📦 สร้าง Backup: {deleteResult.backedUp} รายการ</p>
                        )}
                    </div>
                    {deleteResult.errors.length > 0 && (
                        <ul className="text-xs text-red-600 mt-2">
                            {deleteResult.errors.slice(0, 3).map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Preview */}
            {preview && preview.total > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">ข้อมูลที่พบ</h4>
                        <div className="flex items-center gap-3">
                            <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                                {preview.total.toLocaleString()} รายการ
                            </span>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === preview.sample.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                เลือกทั้งหมด
                            </label>
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left w-10"></th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">ID</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">สถานะ</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">วันที่สร้าง</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {preview.sample.map((item: any) => (
                                    <tr key={item.id} className={selectedIds.includes(item.id) ? 'bg-red-50' : ''}>
                                        <td className="px-3 py-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={() => toggleSelectItem(item.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-gray-700 font-mono text-xs">
                                            {item.id.substring(0, 8)}...
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                                {item.status || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 text-xs">
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {preview.total > 10 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                            แสดง 10 รายการแรก (จะลบเฉพาะรายการที่เลือก สูงสุด {RATE_LIMITS.delete.maxRecords} รายการ)
                        </p>
                    )}
                </div>
            )}

            {preview && preview.total === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                    <Archive className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={handlePreview}
                    disabled={isLoading || (dataType !== 'notifications' && dataType !== 'evaluations' && selectedStatuses.length === 0)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Archive className="w-5 h-5" />
                    )}
                    ค้นหาข้อมูล
                </button>
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={selectedIds.length === 0 || deleteResult !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-5 h-5" />
                    ลบ {selectedIds.length} รายการ
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการลบข้อมูล</h3>
                            <p className="text-gray-600">
                                คุณกำลังจะลบข้อมูล <span className="font-bold text-red-600">{selectedIds.length}</span> รายการ
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                {dataType === 'notifications'
                                    ? '⚠️ การแจ้งเตือนจะถูกลบถาวร ไม่สามารถกู้คืนได้'
                                    : 'ข้อมูลจะถูกเก็บ backup ไว้ 30 วัน'
                                }
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-5 h-5" />
                                )}
                                ยืนยันลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Transaction Processing Overlay */}
            {isDeleting && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">กำลังดำเนินการลบข้อมูล...</h3>
                        <p className="text-sm text-gray-500">
                            ระบบกำลังสร้างไฟล์สำรอง (Backup) และทำการลบข้อมูลจากฐานข้อมูลอย่างปลอดภัย กรุณาอย่าปิดหน้านี้
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
