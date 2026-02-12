'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import AdminLayout from '@/components/admin/AdminLayout'
import { useState, useMemo, Fragment } from 'react'
import {
    Star, MessageSquare, ChevronDown, ChevronUp,
    Search, AlertTriangle, Clock, CheckCircle, Info, Archive
} from 'lucide-react'

type TabType = 'completed' | 'pending'
type PendingFilter = 'mandatory' | 'all'

export default function EvaluationsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedRows, setExpandedRows] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('completed')
    const [showScoringInfo, setShowScoringInfo] = useState(false)
    const [pendingFilter, setPendingFilter] = useState<PendingFilter>('mandatory')

    // Fetch system config for cutoff date
    const { data: systemConfig } = useQuery({
        queryKey: ['admin-eval-config'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return null

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)

            const { data } = await client
                .from('system_config')
                .select('evaluation_cutoff_date')
                .single()

            return data
        }
    })

    const cutoffDate = (systemConfig as any)?.evaluation_cutoff_date || new Date().toISOString().split('T')[0]

    // Fetch completed evaluations
    const { data: evaluations, isLoading } = useQuery({
        queryKey: ['admin-evaluations'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)

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

    // Fetch pending evaluations (returned loans without evaluation)
    const { data: pendingEvaluations, isLoading: pendingLoading } = useQuery({
        queryKey: ['admin-pending-evaluations'],
        queryFn: async () => {
            const { url, key } = getSupabaseCredentials()
            if (!url || !key) return []

            const { createBrowserClient } = await import('@supabase/ssr')
            const client = createBrowserClient(url, key)

            const { data, error } = await client
                .from('loanRequests')
                .select(`
                    id,
                    created_at,
                    updated_at,
                    start_date,
                    end_date,
                    return_time,
                    profiles:user_id(id, first_name, last_name, email, avatar_url, user_type),
                    equipment:equipment_id(name, equipment_number),
                    evaluations(id)
                `)
                .eq('status', 'returned')
                .order('updated_at', { ascending: false })

            if (error) {
                console.error('Error fetching pending evaluations:', error)
                return []
            }

            return (data || []).filter(
                (loan: any) => !loan.evaluations || loan.evaluations.length === 0
            )
        }
    })

    // Compute Stats
    const stats = useMemo(() => {
        if (!evaluations || evaluations.length === 0) return { avg: 0, total: 0, comments: 0, sectionAvgs: {} as any }

        const total = evaluations.length
        const sum = evaluations.reduce((acc: number, curr: any) => acc + curr.rating, 0)
        const avg = sum / total
        const comments = evaluations.filter((e: any) => e.suggestions && e.suggestions.trim().length > 0).length

        const sectionAvgs = evaluations.reduce((acc: any, curr: any) => {
            const details = curr.details || {}
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

    // Split pending into mandatory (after cutoff) and old (before cutoff)
    const { mandatoryPending, oldPending } = useMemo(() => {
        if (!pendingEvaluations) return { mandatoryPending: [], oldPending: [] }
        const mandatory: any[] = []
        const old: any[] = []
        pendingEvaluations.forEach((loan: any) => {
            const returnedDate = loan.updated_at?.split('T')[0] || ''
            if (returnedDate >= cutoffDate) {
                mandatory.push(loan)
            } else {
                old.push(loan)
            }
        })
        return { mandatoryPending: mandatory, oldPending: old }
    }, [pendingEvaluations, cutoffDate])

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

    const displayedPending = useMemo(() => {
        const source = pendingFilter === 'mandatory' ? mandatoryPending : (pendingEvaluations || [])
        if (!searchTerm) return source
        const searchLower = searchTerm.toLowerCase()
        return source.filter((loan: any) =>
            loan.profiles?.first_name?.toLowerCase().includes(searchLower) ||
            loan.profiles?.last_name?.toLowerCase().includes(searchLower) ||
            loan.equipment?.name?.toLowerCase().includes(searchLower) ||
            loan.equipment?.equipment_number?.toLowerCase().includes(searchLower)
        )
    }, [pendingEvaluations, mandatoryPending, pendingFilter, searchTerm])

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const formatDateShort = (date: string) => {
        return new Date(date).toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }

    const totalPending = pendingEvaluations?.length || 0

    return (
        <AdminLayout title="ผลการประเมินการใช้งาน" subtitle="ดูคะแนนความพึงพอใจและข้อเสนอแนะจากผู้ใช้">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-yellow-100 rounded-lg">
                            <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">คะแนนเฉลี่ยรวม</p>
                            <h3 className="text-xl font-bold text-gray-900">{stats.avg.toFixed(2)}/5</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ประเมินแล้ว</p>
                            <h3 className="text-xl font-bold text-gray-900">{stats.total}</h3>
                            <p className="text-xs text-gray-400">{stats.comments} มีคอมเมนต์</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">รอประเมิน (บังคับ)</p>
                            <h3 className="text-xl font-bold text-orange-600">{mandatoryPending.length}</h3>
                            <p className="text-xs text-gray-400">หลัง {formatDateShort(cutoffDate)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-100 rounded-lg">
                            <Archive className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">ข้อมูลเก่า (ไม่บังคับ)</p>
                            <h3 className="text-xl font-bold text-gray-500">{oldPending.length}</h3>
                            <p className="text-xs text-gray-400">ก่อน {formatDateShort(cutoffDate)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Averages + Scoring Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-sm">
                    <h4 className="font-semibold text-gray-700 mb-2 text-xs">คะแนนแยกตามด้าน</h4>
                    <div className="space-y-1.5">
                        {[
                            { key: 'system', label: 'ระบบ (System)' },
                            { key: 'service', label: 'บริการ (Service)' },
                            { key: 'equipment', label: 'อุปกรณ์ (Equipment)' },
                        ].map(({ key, label }) => {
                            const avg = stats.sectionAvgs?.[key]
                                ? (stats.sectionAvgs[key].sum / stats.sectionAvgs[key].count)
                                : 0
                            return (
                                <div key={key} className="flex justify-between items-center">
                                    <span className="text-gray-500 text-xs">{label}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 rounded-full transition-all"
                                                style={{ width: `${(avg / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="font-medium text-xs w-6 text-right">
                                            {avg ? avg.toFixed(1) : '-'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Scoring Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <button
                        onClick={() => setShowScoringInfo(!showScoringInfo)}
                        className="w-full p-4 flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <div className="flex items-center gap-1.5">
                            <Info className="w-4 h-4" />
                            หลักการคำนวณคะแนน
                        </div>
                        {showScoringInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showScoringInfo && (
                        <div className="px-4 pb-4 text-xs text-blue-800 space-y-2 border-t border-blue-50 pt-3">
                            <p><strong>3 ด้าน รวม 10 ข้อ</strong> (แต่ละข้อ 1-5 ⭐):</p>
                            <ul className="space-y-0.5 ml-3">
                                <li>🖥 ระบบ (3 ข้อ): Usability, Information, Performance</li>
                                <li>🤝 บริการ (4 ข้อ): Speed, Rules, Staff, Communication</li>
                                <li>📦 อุปกรณ์ (3 ข้อ): Physical, Performance, Quantity</li>
                            </ul>
                            <p className="bg-blue-50 p-2 rounded-lg">
                                <strong>สูตร:</strong> คะแนนรวม = ค่าเฉลี่ยของ 10 ข้อ (ปัดเศษ) → 1-5
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-1 mb-6">
                <button
                    onClick={() => { setActiveTab('completed'); setSearchTerm('') }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'completed'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <CheckCircle className="w-4 h-4" />
                    ประเมินแล้ว
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'completed' ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                        {evaluations?.length || 0}
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab('pending'); setSearchTerm('') }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'pending'
                            ? 'bg-orange-500 text-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    รอการประเมิน
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'pending' ? 'bg-white/20' : totalPending > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'
                        }`}>
                        {totalPending}
                    </span>
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 justify-between items-center">
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
                    {activeTab === 'pending' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPendingFilter('mandatory')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${pendingFilter === 'mandatory'
                                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                บังคับ ({mandatoryPending.length})
                            </button>
                            <button
                                onClick={() => setPendingFilter('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${pendingFilter === 'all'
                                        ? 'bg-gray-200 text-gray-700 border border-gray-300'
                                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                ทั้งหมด ({totalPending})
                            </button>
                        </div>
                    )}
                </div>

                {activeTab === 'completed' ? (
                    /* ========== COMPLETED EVALUATIONS TAB ========== */
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
                ) : (
                    /* ========== PENDING EVALUATIONS TAB ========== */
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-orange-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">ผู้ใช้</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">อุปกรณ์</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">วันที่ยืม</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">วันที่คืน</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">ผ่านมาแล้ว</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">ประเภท</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : displayedPending.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-gray-500">
                                                {pendingFilter === 'mandatory'
                                                    ? 'ไม่มีรายการบังคับประเมินที่ค้างอยู่ 🎉'
                                                    : 'ทุกคนประเมินเรียบร้อยแล้ว 🎉'
                                                }
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    displayedPending.map((loan: any) => {
                                        const daysSinceReturn = Math.floor(
                                            (Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                                        )
                                        const returnedDate = loan.updated_at?.split('T')[0] || ''
                                        const isMandatory = returnedDate >= cutoffDate
                                        const isOverdue = isMandatory && daysSinceReturn > 3

                                        return (
                                            <tr key={loan.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/50' : !isMandatory ? 'bg-gray-50/50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${isMandatory ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {loan.profiles?.first_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {loan.profiles?.first_name} {loan.profiles?.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{loan.profiles?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{loan.equipment?.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">#{loan.equipment?.equipment_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateShort(loan.start_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDateShort(loan.updated_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isOverdue
                                                            ? 'bg-red-100 text-red-700'
                                                            : daysSinceReturn >= 1
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        <Clock className="w-3 h-3" />
                                                        {daysSinceReturn === 0 ? 'วันนี้' : `${daysSinceReturn} วัน`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isMandatory ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            บังคับ
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                                                            <Archive className="w-3 h-3" />
                                                            ข้อมูลเก่า
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
