'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import AdminLayout from '@/components/admin/AdminLayout'
import { useState, useMemo, Fragment } from 'react'
import {
    Star, MessageSquare, ChevronDown, ChevronUp,
    Search, Filter, Calendar
} from 'lucide-react'

export default function EvaluationsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedRows, setExpandedRows] = useState<string[]>([])

    // Fetch evaluations
    const { data: evaluations, isLoading } = useQuery({
        queryKey: ['admin-evaluations'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)

            // Get evaluations with related data using Supabase client
            const { data, error } = await client
                .from('evaluations')
                .select(`
                    *,
                    profiles!evaluations_user_id_fkey(first_name, last_name, email, avatar_url),
                    loanRequests:loan_id(
                        id,
                        equipment:equipment_id(name, equipment_number)
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching evaluations:', error)
                return []
            }

            return data || []
        }
    })

    // Compute Stats
    const stats = useMemo(() => {
        if (!evaluations || evaluations.length === 0) return { avg: 0, total: 0, comments: 0 }

        const total = evaluations.length
        const sum = evaluations.reduce((acc: number, curr: any) => acc + curr.rating, 0)
        const avg = sum / total
        const comments = evaluations.filter((e: any) => e.suggestions && e.suggestions.trim().length > 0).length

        // Section Averages
        const sectionAvgs = evaluations.reduce((acc: any, curr: any) => {
            const details = curr.details || {}
            // Helper to sum up nested values
            const addScores = (category: string) => {
                const cat = details[category] || {}
                Object.values(cat).forEach((score: any) => {
                    if (!acc[category]) acc[category] = { sum: 0, count: 0 }
                    acc[category].sum += score
                    acc[category].count++
                })
            }
            addScores('system')
            addScores('service')
            addScores('equipment')
            return acc
        }, {})

        return { avg, total, comments, sectionAvgs }
    }, [evaluations])

    const toggleExpand = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        )
    }

    const filteredEvaluations = useMemo(() => {
        if (!evaluations) return []
        return evaluations.filter((e: any) => {
            const searchLower = searchTerm.toLowerCase()
            return (
                e.profiles?.first_name?.toLowerCase().includes(searchLower) ||
                e.profiles?.last_name?.toLowerCase().includes(searchLower) ||
                e.loanRequests?.equipment?.name?.toLowerCase().includes(searchLower) ||
                e.loanRequests?.equipment?.equipment_number?.toLowerCase().includes(searchLower)
            )
        })
    }, [evaluations, searchTerm])

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <AdminLayout title="ผลการประเมินการใช้งาน" subtitle="ดูคะแนนความพึงพอใจและข้อเสนอแนะจากผู้ใช้">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">คะแนนเฉลี่ยรวม</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.avg.toFixed(2)}/5.00</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">ข้อเสนอแนะทั้งหมด</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.comments}</h3>
                            <p className="text-xs text-gray-400">จาก {stats.total} การประเมิน</p>
                        </div>
                    </div>
                </div>
                {/* Breakdown Stats */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-sm">
                    <h4 className="font-semibold text-gray-700 mb-2">คะแนนแยกตามด้าน</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">ระบบ (System)</span>
                            <span className="font-medium">
                                {stats.sectionAvgs?.system ? (stats.sectionAvgs.system.sum / stats.sectionAvgs.system.count).toFixed(1) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">บริการ (Service)</span>
                            <span className="font-medium">
                                {stats.sectionAvgs?.service ? (stats.sectionAvgs.service.sum / stats.sectionAvgs.service.count).toFixed(1) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">อุปกรณ์ (Equipment)</span>
                            <span className="font-medium">
                                {stats.sectionAvgs?.equipment ? (stats.sectionAvgs.equipment.sum / stats.sectionAvgs.equipment.count).toFixed(1) : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาผู้ใช้, อุปกรณ์..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้ประเมิน</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนน</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คอมเมนต์</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        กำลังโหลดข้อมูล...
                                    </td>
                                </tr>
                            ) : filteredEvaluations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        ไม่พบข้อมูลการประเมิน
                                    </td>
                                </tr>
                            ) : (
                                filteredEvaluations.map((item: any) => (
                                    <Fragment key={item.id}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                                        {item.profiles?.first_name?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.profiles?.first_name} {item.profiles?.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{item.profiles?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{item.loanRequests?.equipment?.name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{item.loanRequests?.equipment?.equipment_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Star className={`w-4 h-4 ${item.rating >= 4 ? 'text-green-500 fill-green-500' : item.rating >= 3 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500'}`} />
                                                    <span className="text-sm font-semibold text-gray-900">{item.rating}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.suggestions ? (
                                                    <p className="text-sm text-gray-600 truncate max-w-[200px]" title={item.suggestions}>
                                                        {item.suggestions}
                                                    </p>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                <button
                                                    onClick={() => toggleExpand(item.id)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                                >
                                                    {expandedRows.includes(item.id) ? (
                                                        <ChevronUp className="w-5 h-5" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRows.includes(item.id) && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        {Object.entries(item.details || {}).map(([category, scores]: [string, any]) => (
                                                            <div key={category} className="bg-white p-3 rounded-lg border border-gray-100">
                                                                <h5 className="font-semibold text-gray-700 mb-2 capitalize border-b border-gray-100 pb-1">
                                                                    {category === 'system' ? 'ระบบ (System)' : category === 'service' ? 'บริการ (Service)' : 'อุปกรณ์ (Equipment)'}
                                                                </h5>
                                                                <ul className="space-y-1">
                                                                    {Object.entries(scores).map(([key, score]: [string, any]) => (
                                                                        <li key={key} className="flex justify-between text-gray-600">
                                                                            <span className="capitalize">{key}</span>
                                                                            <span className="font-medium flex items-center gap-1">
                                                                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                                                {score}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                        {item.suggestions && (
                                                            <div className="md:col-span-3 bg-white p-3 rounded-lg border border-gray-100 mt-2">
                                                                <h5 className="font-semibold text-gray-700 mb-1">ข้อเสนอแนะเพิ่มเติม</h5>
                                                                <p className="text-gray-600 italic">"{item.suggestions}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}
