'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Loader2, Trash2, Save, X, Settings, CheckCircle, Ban } from 'lucide-react'
import Link from 'next/link'

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
        const { data, error } = await supabase
            .from('departments' as any)
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
        const { error } = await supabase
            .from('departments' as any)
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
        const { error } = await supabase
            .from('departments' as any)
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
        if (!confirm('Are you sure you want to delete this department? This might fail if users are linked to it.')) return

        const { error } = await supabase
            .from('departments' as any)
            .delete()
            .eq('id', id)

        if (error) {
            alert(`Failed to delete: ${error.message}`)
        } else {
            setDepartments(prev => prev.filter(d => d.id !== id))
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin/settings" className="text-sm text-gray-500 hover:text-gray-900">Settings</Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-sm font-medium text-gray-900">Departments</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Departments</h1>
                    <p className="text-gray-500">Add or edit academic departments available for user registration.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Department
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm bg-indigo-50/50 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold text-gray-900 mb-4">New Department</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. Computer Science"
                                value={newDeptName}
                                onChange={e => setNewDeptName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. CS"
                                value={newDeptCode}
                                onChange={e => setNewDeptCode(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddDepartment}
                            disabled={!newDeptName.trim() || isSaving}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                        >
                            {isSaving ? 'Saving...' : 'Create Department'}
                        </button>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Code</th>
                            <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                            <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Loading data...
                                </td>
                            </tr>
                        ) : departments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No departments found. Click "Add Department" to create one.
                                </td>
                            </tr>
                        ) : (
                            departments.map(dept => (
                                <tr key={dept.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 font-medium text-gray-900">{dept.name}</td>
                                    <td className="px-6 py-4 text-gray-500 font-mono">{dept.code || '-'}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleStatus(dept.id, dept.is_active)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${dept.is_active
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                }`}
                                        >
                                            {dept.is_active ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <Ban className="w-3 h-3" />
                                                    Inactive
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => deleteDepartment(dept.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
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
    )
}
