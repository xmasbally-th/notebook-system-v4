'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useEquipmentTypes, useEquipmentTypeMutation } from '@/hooks/useEquipmentTypes'
import { Database } from '@/supabase/types'
import AdminLayout from '@/components/admin/AdminLayout'
import { Plus, Edit, Trash2, Tag, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'

type EquipmentType = Database['public']['Tables']['equipment_types']['Row']

export default function EquipmentTypesPage() {
    const { data: types, isLoading, error, refetch } = useEquipmentTypes()
    const mutations = useEquipmentTypeMutation()
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const typesList = Array.isArray(types) ? types : []

    // Stats
    const totalCount = typesList.length
    const activeCount = typesList.filter(t => t.is_active).length
    const inactiveCount = typesList.filter(t => !t.is_active).length

    const handleDelete = async (id: string) => {
        try {
            await mutations.delete.mutateAsync(id)
            setDeleteId(null)
        } catch (err: any) {
            alert('ไม่สามารถลบได้: ' + err.message)
        }
    }

    return (
        <AdminLayout title="จัดการประเภทอุปกรณ์" subtitle="เพิ่ม แก้ไข และลบประเภทอุปกรณ์">
            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">ไม่สามารถโหลดข้อมูลได้: {(error as Error).message}</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองใหม่
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Tag className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                            <p className="text-xs text-gray-500">ประเภททั้งหมด</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                            <p className="text-xs text-gray-500">เปิดใช้งาน</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-500">{inactiveCount}</p>
                            <p className="text-xs text-gray-500">ปิดใช้งาน</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header Actions */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">รายการประเภท</h2>
                <Link
                    href="/admin/equipment-types/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มประเภท
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
                ) : typesList.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Tag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>ยังไม่มีประเภทอุปกรณ์</p>
                        <Link href="/admin/equipment-types/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                            + เพิ่มประเภทแรก
                        </Link>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ไอคอน</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อประเภท</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คำอธิบาย</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {typesList.map((type) => (
                                <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-2xl">{type.icon}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-900">{type.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500 line-clamp-1">
                                            {type.description || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${type.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {type.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/equipment-types/${type.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(type.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">ยืนยันการลบ</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            คุณต้องการลบประเภทนี้หรือไม่? การดำเนินการนี้ไม่สามารถเลิกทำได้
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                disabled={mutations.delete.isPending}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {mutations.delete.isPending ? 'กำลังลบ...' : 'ลบ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
