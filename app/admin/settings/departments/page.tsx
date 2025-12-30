'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import {
    Plus,
    Loader2,
    Trash2,
    Building2,
    CheckCircle,
    Ban,
    X
} from 'lucide-react'

type Department = {
    id: string
    name: string
    code: string | null
    is_active: boolean
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [isAdding, setIsAdding] = useState(false)
    const [newDeptName, setNewDeptName] = useState('')
    const [newDeptCode, setNewDeptCode] = useState('')

    const fetchDepartments = async () => {
        setIsLoading(true)
        const { data, error } = await (supabase as any)
            .from('departments')
            .select('*')
            .order('name')

        if (error) {
            console.error('Error fetching departments:', error)
            setError(error.message)
        } else {
            setDepartments(data || [])
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchDepartments()
    }, [])

    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) return

        setIsSaving(true)
        const { error } = await (supabase as any)
            .from('departments')
            .insert([{ name: newDeptName.trim(), code: newDeptCode.trim() || null }])
            .select()

        if (error) {
            alert(`Error: ${error.message}`)
        } else {
            setNewDeptName('')
            setNewDeptCode('')
            setIsAdding(false)
            fetchDepartments()
        }
        setIsSaving(false)
    }

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await (supabase as any)
            .from('departments')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (error) {
            alert('Failed to update status')
        } else {
            setDepartments(prev =>
                prev.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d)
            )
        }
    }

    const deleteDepartment = async (id: string) => {
        if (!confirm('ต้องการลบหน่วยงานนี้หรือไม่? การดำเนินการนี้อาจล้มเหลวหากมีผู้ใช้อยู่ในหน่วยงานนี้')) return

        const { error } = await (supabase as any)
            .from('departments')
            .delete()
            .eq('id', id)

        if (error) {
            alert(`ไม่สามารถลบได้: ${error.message}`)
        } else {
            setDepartments(prev => prev.filter(d => d.id !== id))
        }
    }

    const activeCount = departments.filter(d => d.is_active).length
    const inactiveCount = departments.filter(d => !d.is_active).length

    return (
        <AdminLayout title="จัดการหน่วยงาน" subtitle="เพิ่ม แก้ไข หรือลบหน่วยงาน/ภาควิชา">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                            <p className="text-xs text-gray-500">เปิดใช้งาน</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Ban className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
                            <p className="text-xs text-gray-500">ปิดใช้งาน</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl">
                {/* Add Button */}
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm mb-6"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มหน่วยงาน
                    </button>
                )}

                {/* Add Form */}
                {isAdding && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            เพิ่มหน่วยงานใหม่
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อหน่วยงาน *</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    placeholder="เช่น สาขาวิชาการบัญชี"
                                    value={newDeptName}
                                    onChange={e => setNewDeptName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัส (ไม่บังคับ)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    placeholder="เช่น ACC"
                                    value={newDeptCode}
                                    onChange={e => setNewDeptCode(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAddDepartment}
                                disabled={!newDeptName.trim() || isSaving}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                            >
                                {isSaving ? 'กำลังบันทึก...' : 'สร้างหน่วยงาน'}
                            </button>
                            <button
                                onClick={() => { setIsAdding(false); setNewDeptName(''); setNewDeptCode('') }}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                )}

                {/* Department List */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500">หน่วยงาน</th>
                                <th className="px-6 py-4 font-medium text-gray-500">รหัส</th>
                                <th className="px-6 py-4 font-medium text-gray-500">สถานะ</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : departments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                        <p>ยังไม่มีหน่วยงาน</p>
                                        <p className="text-sm">คลิก "เพิ่มหน่วยงาน" เพื่อเริ่มต้น</p>
                                    </td>
                                </tr>
                            ) : (
                                departments.map(dept => (
                                    <tr key={dept.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${dept.is_active ? 'bg-blue-50' : 'bg-gray-100'}`}>
                                                    <Building2 className={`w-4 h-4 ${dept.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                                                </div>
                                                <span className="font-medium text-gray-900">{dept.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {dept.code ? (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-mono">
                                                    {dept.code}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(dept.id, dept.is_active)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${dept.is_active
                                                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {dept.is_active ? (
                                                    <>
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        เปิดใช้งาน
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ban className="w-3.5 h-3.5" />
                                                        ปิดใช้งาน
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteDepartment(dept.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="ลบ"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}
