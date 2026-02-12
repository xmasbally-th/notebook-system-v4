'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'
import AdminLayout from '@/components/admin/AdminLayout'
import { useState, useMemo, Fragment } from 'react'
import {
    Star, MessageSquare, ChevronDown, ChevronUp,
    Search, AlertTriangle, Clock, CheckCircle, Info, Users
} from 'lucide-react'

type TabType = 'completed' | 'pending'

export default function EvaluationsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedRows, setExpandedRows] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('completed')
    const [showScoringInfo, setShowScoringInfo] = useState(false)

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

            // Get returned loans with evaluations to check
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

            // Filter only those WITHOUT evaluations
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

    const filteredPending = useMemo(() => {
        if (!pendingEvaluations) return []
        if (!searchTerm) return pendingEvaluations
        const searchLower = searchTerm.toLowerCase()
        return pendingEvaluations.filter((loan: any) =>
            loan.profiles?.first_name?.toLowerCase().includes(searchLower) ||
            loan.profiles?.last_name?.toLowerCase().includes(searchLower) ||
            loan.equipment?.name?.toLowerCase().includes(searchLower) ||
            loan.equipment?.equipment_number?.toLowerCase().includes(searchLower)
        )
    }, [pendingEvaluations, searchTerm])

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

    const pendingCount = pendingEvaluations?.length || 0

    return (
        <AdminLayout title="ผลการประเมินการใช้งาน" subtitle="ดูคะแนนความพึงพอใจและข้อเสนอแนะจากผู้ใช้">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-yellow-100 rounded-lg">
                            <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">คะแนนเฉลี่ยรวม</p>
                            <h3 className="text-xl font-bold text-gray-900">{stats.avg.toFixed(2)}/5.00</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">การประเมินทั้งหมด</p>
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
                            <p className="text-xs text-gray-500">รอการประเมิน</p>
                            <h3 className="text-xl font-bold text-orange-600">{pendingCount}</h3>
                            <p className="text-xs text-gray-400">คืนแล้ว ยังไม่ประเมิน</p>
                        </div>
                    </div>
                </div>
                {/* Breakdown Stats */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-sm">
                    <h4 className="font-semibold text-gray-700 mb-2 text-xs">คะแนนแยกตามด้าน</h4>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-xs">ระบบ (System)</span>
                            <span className="font-medium text-xs">
                                {stats.sectionAvgs?.system ? (stats.sectionAvgs.system.sum / stats.sectionAvgs.system.count).toFixed(1) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-xs">บริการ (Service)</span>
                            <span className="font-medium text-xs">
                                {stats.sectionAvgs?.service ? (stats.sectionAvgs.service.sum / stats.sectionAvgs.service.count).toFixed(1) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-xs">อุปกรณ์ (Equipment)</span>
                            <span className="font-medium text-xs">
                                {stats.sectionAvgs?.equipment ? (stats.sectionAvgs.equipment.sum / stats.sectionAvgs.equipment.count).toFixed(1) : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scoring Info Toggle */}
            <div className="mb-4">
                <button
                    onClick={() => setShowScoringInfo(!showScoringInfo)}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                    <Info className="w-4 h-4" />
                    {showScoringInfo ? 'ซ่อน' : 'ดู'}หลักการคำนวณคะแนน
                    {showScoringInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showScoringInfo && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm">
                        <h4 className="font-bold text-blue-900 mb-3">หลักการคำนวณคะแนนประเมิน</h4>
                        <div className="space-y-3 text-blue-800">
                            <div>
                                <p className="font-semibold mb-1">แบบประเมินแบ่งเป็น 3 ด้าน รวม 10 ข้อ:</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                                        <p className="font-semibold text-blue-900 mb-1">🖥 ด้านระบบ (System) — 3 ข้อ</p>
                                        <ul className="text-xs space-y-0.5 text-blue-700">
                                            <li>1. การออกแบบและใช้งาน (Usability)</li>
                                            <li>2. ข้อมูล (Information)</li>
                                            <li>3. เสถียรภาพ (Performance)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                                        <p className="font-semibold text-blue-900 mb-1">🤝 ด้านบริการ (Service) — 4 ข้อ</p>
                                        <ul className="text-xs space-y-0.5 text-blue-700">
                                            <li>1. ความรวดเร็ว (Speed)</li>
                                            <li>2. กฎระเบียบ (Rules)</li>
                                            <li>3. เจ้าหน้าที่ (Staff)</li>
                                            <li>4. การสื่อสาร (Communication)</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                                        <p className="font-semibold text-blue-900 mb-1">📦 ด้านอุปกรณ์ (Equipment) — 3 ข้อ</p>
                                        <ul className="text-xs space-y-0.5 text-blue-700">
                                            <li>1. กายภาพ (Physical)</li>
                                            <li>2. ประสิทธิภาพ (Performance)</li>
                                            <li>3. ปริมาณ (Quantity)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <p className="font-semibold text-blue-900 mb-1">📊 สูตรคำนวณ</p>
                                <p className="text-xs">
                                    แต่ละข้อให้คะแนน <strong>1-5 ดาว</strong> → คะแนนรวม = <strong>ค่าเฉลี่ยของ 10 ข้อ</strong> (ปัดเศษเป็นจำนวนเต็ม)
                                </p>
                                <p className="text-xs mt-1 text-blue-600">
                                    ตัวอย่าง: ถ้าให้ 5,4,4,3,5,4,4,5,3,4 → เฉลี่ย = 4.1 → คะแนน = <strong>4</strong>
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <p className="font-semibold text-blue-900 mb-1">📈 คะแนนเฉลี่ยรายด้าน (แสดงในสถิติ)</p>
                                <p className="text-xs">
                                    คำนวณจากค่าเฉลี่ยของทุกคะแนนในแต่ละด้าน รวมทุกการประเมิน เช่น ด้านระบบ = (ผลรวมคะแนน 3 ข้อ × จำนวนผู้ประเมิน) ÷ (3 × จำนวนผู้ประเมิน)
                                </p>
                            </div>
                        </div>
                    </div>
                )}
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
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'pending' ? 'bg-white/20' : pendingCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'
                        }`}>
                        {pendingCount}
                    </span>
                </button>
            </div>

            {/* Content */}
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
                    {activeTab === 'pending' && pendingCount > 0 && (
                        <span className="text-xs text-orange-600 font-medium">
                            ⚠️ ผู้ใช้เหล่านี้คืนอุปกรณ์แล้วแต่ยังไม่ได้ประเมิน
                        </span>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            กำลังโหลดข้อมูล...
                                        </td>
                                    </tr>
                                ) : filteredPending.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                            <p className="text-gray-500">ทุกคนประเมินเรียบร้อยแล้ว 🎉</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPending.map((loan: any) => {
                                        const daysSinceReturn = Math.floor(
                                            (Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                                        )
                                        const isOverdue = daysSinceReturn > 3

                                        return (
                                            <tr key={loan.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs mr-3">
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
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        รอประเมิน
                                                    </span>
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
