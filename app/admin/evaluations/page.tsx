'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials, getSupabaseBrowserClient } from '@/lib/supabase-helpers'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { useState, useMemo, Fragment, useEffect } from 'react'
import {
    Star, MessageSquare, ChevronDown, ChevronUp,
    Search, AlertTriangle, Clock, CheckCircle, Info, Archive,
    Calendar, Download, SlidersHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfDay, startOfDay, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import dynamic from 'next/dynamic'

const EvaluationCharts = dynamic(() => import('@/components/admin/EvaluationCharts'), {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-gray-100/50 rounded-xl mb-6 border border-gray-200/50 backdrop-blur-sm" />,
})

type TabType = 'completed' | 'pending'
type PendingFilter = 'mandatory' | 'all'
type RatingFilter = 'all' | 'high' | 'medium' | 'low'

export default function EvaluationsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedRows, setExpandedRows] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('completed')
    const [showScoringInfo, setShowScoringInfo] = useState(false)
    const [pendingFilter, setPendingFilter] = useState<PendingFilter>('mandatory')
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Reset pagination when filter states change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, ratingFilter, dateRange, activeTab, pendingFilter])

    // Fetch system config for cutoff date
    const { data: systemConfig } = useQuery({
        queryKey: ['admin-eval-config'],
        queryFn: async () => {
            const client = getSupabaseBrowserClient()
            if (!client) return null

            const { data } = await client
                .from('system_config')
                .select('evaluation_cutoff_date')
                .single()

            return data
        }
    })

    const cutoffDate = (systemConfig as any)?.evaluation_cutoff_date || new Date().toISOString().split('T')[0]

    // Fetch completed evaluations within date range (optimized database-level query)
    const { data: evaluations, isLoading } = useQuery({
        queryKey: ['admin-evaluations', dateRange.start, dateRange.end],
        queryFn: async () => {
            const client = getSupabaseBrowserClient()
            if (!client) return []

            const startDate = startOfDay(parseISO(dateRange.start)).toISOString()
            const endDate = endOfDay(parseISO(dateRange.end)).toISOString()

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
                .gte('created_at', startDate)
                .lte('created_at', endDate)
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
            const client = getSupabaseBrowserClient()
            if (!client) return []

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

    // Compute Stats from current fetched date range
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

    // Client-side quick filter presets
    const handleSetDateRangePreset = (preset: '7days' | '30days' | 'thisMonth' | 'allTime') => {
        const end = new Date()
        let start = new Date()
        if (preset === '7days') {
            start = subDays(end, 7)
        } else if (preset === '30days') {
            start = subDays(end, 30)
        } else if (preset === 'thisMonth') {
            start = startOfMonth(end)
        } else if (preset === 'allTime') {
            start = new Date('2020-01-01')
        }

        setDateRange({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        })
    }

    // Local filter search & score filter
    const filteredEvaluations = useMemo(() => {
        if (!evaluations) return []

        return evaluations.filter((e: any) => {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm || (
                e.profiles?.first_name?.toLowerCase().includes(searchLower) ||
                e.profiles?.last_name?.toLowerCase().includes(searchLower) ||
                e.profiles?.email?.toLowerCase().includes(searchLower) ||
                e.loanRequests?.equipment?.name?.toLowerCase().includes(searchLower) ||
                e.loanRequests?.equipment?.equipment_number?.toLowerCase().includes(searchLower)
            )

            let matchesRating = true
            if (ratingFilter === 'high') {
                matchesRating = e.rating >= 4
            } else if (ratingFilter === 'medium') {
                matchesRating = e.rating === 3
            } else if (ratingFilter === 'low') {
                matchesRating = e.rating <= 2
            }

            return matchesSearch && matchesRating
        })
    }, [evaluations, searchTerm, ratingFilter])

    // Sanitization logic to prevent CSV formula injection (CWE-1236)
    const sanitizeCSVField = (val: any) => {
        if (val === null || val === undefined) return ''
        const str = String(val).trim()
        if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
            return `'${str}`
        }
        return str
    }

    const handleExportCSV = () => {
        if (!filteredEvaluations.length) return

        const headers = ['วันที่', 'ผู้ประเมิน', 'อีเมล', 'อุปกรณ์', 'รหัสครุภัณฑ์', 'คะแนนรวม', 'ข้อเสนอแนะ']
        const csvContent = [
            headers.join(','),
            ...filteredEvaluations.map((item: any) => [
                `"${format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm')}"`,
                `"${sanitizeCSVField(`${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`).replace(/"/g, '""')}"`,
                `"${sanitizeCSVField(item.profiles?.email || '').replace(/"/g, '""')}"`,
                `"${sanitizeCSVField(item.loanRequests?.equipment?.name || '').replace(/"/g, '""')}"`,
                `"${sanitizeCSVField(item.loanRequests?.equipment?.equipment_number || '').replace(/"/g, '""')}"`,
                item.rating,
                `"${sanitizeCSVField(item.suggestions || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n')

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `evaluations_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const displayedPending = useMemo(() => {
        const source = pendingFilter === 'mandatory' ? mandatoryPending : (pendingEvaluations || [])
        const searchLower = searchTerm.toLowerCase()
        return source.filter((loan: any) =>
            !searchTerm || (
                loan.profiles?.first_name?.toLowerCase().includes(searchLower) ||
                loan.profiles?.last_name?.toLowerCase().includes(searchLower) ||
                loan.profiles?.email?.toLowerCase().includes(searchLower) ||
                loan.equipment?.name?.toLowerCase().includes(searchLower) ||
                loan.equipment?.equipment_number?.toLowerCase().includes(searchLower)
            )
        )
    }, [pendingEvaluations, mandatoryPending, pendingFilter, searchTerm])

    // Pagination calculations
    const paginatedEvaluations = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return filteredEvaluations.slice(startIndex, startIndex + pageSize)
    }, [filteredEvaluations, currentPage, pageSize])

    const totalPages = Math.ceil(filteredEvaluations.length / pageSize)

    const paginatedPending = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return displayedPending.slice(startIndex, startIndex + pageSize)
    }, [displayedPending, currentPage, pageSize])

    const pendingTotalPages = Math.ceil(displayedPending.length / pageSize)

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
        <div className="space-y-6 animate-in fade-in duration-300">
            <AdminPageHeader title="ผลการประเมินการใช้งาน" subtitle="ดูคะแนนความพึงพอใจและข้อเสนอแนะจากผู้ใช้ระบบ"/>

            {/* Stats Cards - Upgraded Premium Aesthetic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl shadow-md border border-amber-400 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-amber-50/80">คะแนนเฉลี่ยรวม</p>
                        <Star className="w-5 h-5 fill-white text-white opacity-80" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold">{stats.avg > 0 ? stats.avg.toFixed(2) : '0.00'}<span className="text-lg font-medium text-amber-100"> / 5</span></h3>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-md border border-blue-400 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-50/80">ประเมินแล้ว</p>
                        <MessageSquare className="w-5 h-5 text-white opacity-80" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold">{stats.total}</h3>
                        <p className="text-xs text-blue-100/70">{stats.comments} ข้อเสนอแนะเพิ่มเติม</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-2xl shadow-md border border-orange-400 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-orange-50/80">รอประเมิน (บังคับ)</p>
                        <AlertTriangle className="w-5 h-5 text-white opacity-80" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold">{mandatoryPending.length}</h3>
                        <p className="text-xs text-orange-100/70">คืนหลัง {formatDateShort(cutoffDate)}</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-5 rounded-2xl shadow-md border border-slate-500 text-white transform hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between h-[110px]">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-50/80">ข้อมูลเก่า (ไม่บังคับ)</p>
                        <Archive className="w-5 h-5 text-white opacity-80" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-extrabold">{oldPending.length}</h3>
                        <p className="text-xs text-slate-200/70">คืนก่อน {formatDateShort(cutoffDate)}</p>
                    </div>
                </div>
            </div>

            {/* Date Preset Selector & Controls */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold">ช่วงเวลาผลลัพธ์:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        />
                        <span className="text-gray-400 text-sm">ถึง</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {[
                            { label: '7 วัน', value: '7days' },
                            { label: '30 วัน', value: '30days' },
                            { label: 'เดือนนี้', value: 'thisMonth' },
                            { label: 'ทั้งหมด', value: 'allTime' }
                        ].map((btn) => (
                            <button
                                key={btn.value}
                                onClick={() => handleSetDateRangePreset(btn.value as any)}
                                className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors font-medium text-gray-600 bg-white"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={filteredEvaluations.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow"
                >
                    <Download className="w-4 h-4" />
                    ส่งออกข้อมูล CSV
                </button>
            </div>

            {/* Charts Section */}
            {activeTab === 'completed' && filteredEvaluations.length > 0 && (
                <EvaluationCharts
                    evaluations={filteredEvaluations}
                    dateRange={dateRange}
                />
            )}

            {/* Section Averages + Scoring Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-500" />
                        คะแนนเฉลี่ยแยกตามด้าน
                    </h4>
                    <div className="space-y-3.5">
                        {[
                            { key: 'system', label: 'ด้านระบบปฏิบัติการ (System)' },
                            { key: 'service', label: 'ด้านการให้บริการ (Service)' },
                            { key: 'equipment', label: 'ด้านอุปกรณ์ (Equipment)' },
                        ].map(({ key, label }) => {
                            const avg = stats.sectionAvgs?.[key]
                                ? (stats.sectionAvgs[key].sum / stats.sectionAvgs[key].count)
                                : 0
                            return (
                                <div key={key} className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                                        <span>{label}</span>
                                        <span className="text-gray-900 bg-amber-50 px-2 py-0.5 rounded text-amber-700 font-bold border border-amber-100">
                                            {avg ? avg.toFixed(2) : '-'} / 5.0
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/20">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
                                            style={{ width: `${(avg / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Scoring Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <button
                        onClick={() => setShowScoringInfo(!showScoringInfo)}
                        className="w-full p-5 flex items-center justify-between text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/30"
                    >
                        <div className="flex items-center gap-2">
                            <Info className="w-4.5 h-4.5 text-blue-500" />
                            หลักการคำนวณและรายละเอียดข้อคําถาม
                        </div>
                        {showScoringInfo ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                    </button>
                    {showScoringInfo && (
                        <div className="p-5 text-xs text-slate-600 space-y-3 border-t border-blue-50/50 bg-white">
                            <p>แบบประเมินมี <strong>3 ด้าน รวมทั้งหมด 10 ข้อคําถาม</strong> (คะแนน 1-5 ⭐ ในแต่ละข้อ):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <p className="font-semibold text-slate-800 mb-1">🖥 ระบบ (3 ข้อ)</p>
                                    <ul className="list-disc pl-3.5 space-y-0.5 text-slate-500">
                                        <li>ออกแบบและใช้งานง่าย</li>
                                        <li>ความครบถ้วนข้อมูล</li>
                                        <li>เสถียรภาพและรวดเร็ว</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <p className="font-semibold text-slate-800 mb-1">🤝 บริการ (4 ข้อ)</p>
                                    <ul className="list-disc pl-3.5 space-y-0.5 text-slate-500">
                                        <li>ความเร็วรับ-คืน</li>
                                        <li>ความชัดเจนของกฎ</li>
                                        <li>ความสุภาพเจ้าหน้าที่</li>
                                        <li>การแจ้งเตือนและการติดต่อ</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <p className="font-semibold text-slate-800 mb-1">📦 อุปกรณ์ (3 ข้อ)</p>
                                    <ul className="list-disc pl-3.5 space-y-0.5 text-slate-500">
                                        <li>ความสะอาดภายนอก</li>
                                        <li>ความพร้อมใช้งาน</li>
                                        <li>ความหลากหลาย</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100/50 text-blue-900 flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong>หลักการปัดเศษ:</strong> คะแนนเฉลี่ยรวมในแต่ละรายการ คำนวณจากค่าเฉลี่ยของทั้ง 10 ข้อ จากนั้นจะถูกปัดเศษตามหลักทศนิยมทางสถิติออกมาเป็นจํานวนเต็ม (1-5) เพื่อแสดงผลหน้าดาวรวม
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200/30">
                <button
                    onClick={() => { setActiveTab('completed'); setSearchTerm('') }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'completed'
                        ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                        }`}
                >
                    <CheckCircle className="w-4 h-4" />
                    ประเมินแล้ว
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                        {filteredEvaluations.length}
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab('pending'); setSearchTerm('') }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'pending'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    รอการประเมิน
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'pending' ? 'bg-white/20 text-white' : totalPending > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'}`}>
                        {displayedPending.length}
                    </span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Filters Ribbon */}
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาผู้ใช้, อีเมล, ชื่ออุปกรณ์, รหัสครุภัณฑ์..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {activeTab === 'completed' && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">ตัวกรองคะแนน:</span>
                                <select
                                    value={ratingFilter}
                                    onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
                                    className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                                >
                                    <option value="all">คะแนนทั้งหมด</option>
                                    <option value="high">ดีเยี่ยม (4-5 ดาว)</option>
                                    <option value="medium">ปานกลาง (3 ดาว)</option>
                                    <option value="low">ปรับปรุง (1-2 ดาว)</option>
                                </select>
                            </div>
                        )}

                        {activeTab === 'pending' && (
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200">
                                <button
                                    onClick={() => setPendingFilter('mandatory')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pendingFilter === 'mandatory'
                                        ? 'bg-orange-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    บังคับ ({mandatoryPending.length})
                                </button>
                                <button
                                    onClick={() => setPendingFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${pendingFilter === 'all'
                                        ? 'bg-gray-100 text-gray-700'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    ทั้งหมด ({totalPending})
                                </button>
                            </div>
                        )}

                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">แสดงหน้าละ:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                            >
                                <option value={10}>10 รายการ</option>
                                <option value={25}>25 รายการ</option>
                                <option value={50}>50 รายการ</option>
                            </select>
                        </div>
                    </div>
                </div>

                {activeTab === 'completed' ? (
                    /* ========== COMPLETED EVALUATIONS TAB ========== */
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/80">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ประเมิน</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ผู้ประเมิน</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">คะแนนเฉลี่ย</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ข้อเสนอแนะเพิ่มเติม</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[50px]"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                <span>กำลังโหลดข้อมูลการประเมิน...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredEvaluations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-450 italic">
                                            ไม่พบข้อมูลการประเมินในช่วงเวลานี้
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEvaluations.map((item: any) => (
                                        <Fragment key={item.id}>
                                            <tr className={`hover:bg-blue-50/20 transition-colors ${expandedRows.includes(item.id) ? 'bg-blue-50/10' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                                    {formatDate(item.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm mr-3">
                                                            {item.profiles?.first_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900 leading-4">
                                                                {item.profiles?.first_name} {item.profiles?.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">{item.profiles?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-800">{item.loanRequests?.equipment?.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-1">#{item.loanRequests?.equipment?.equipment_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-xl border border-gray-200">
                                                            <Star className={`w-4.5 h-4.5 mr-1 ${item.rating >= 4 ? 'text-emerald-500 fill-emerald-500' : item.rating >= 3 ? 'text-amber-500 fill-amber-500' : 'text-rose-500 fill-rose-500'}`} />
                                                            <span className="text-sm font-bold text-gray-800">{item.rating}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-[240px]">
                                                    {item.suggestions ? (
                                                        <p className="text-sm text-slate-600 truncate italic" title={item.suggestions}>
                                                            "{item.suggestions}"
                                                        </p>
                                                    ) : (
                                                        <span className="text-sm text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => toggleExpand(item.id)}
                                                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100/50 transition-colors"
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
                                                <tr className="bg-slate-50/50 border-l-4 border-blue-500">
                                                    <td colSpan={6} className="px-6 py-5">
                                                        <div className="space-y-4">
                                                            {/* Criteria Details Cards */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {[
                                                                    { category: 'system', title: 'ระบบปฏิบัติการ (System)', color: 'from-blue-500 to-indigo-500' },
                                                                    { category: 'service', title: 'การให้บริการ (Service)', color: 'from-amber-500 to-yellow-500' },
                                                                    { category: 'equipment', title: 'อุปกรณ์ที่ให้บริการ (Equipment)', color: 'from-emerald-500 to-teal-500' }
                                                                ].map((section) => {
                                                                    const scores = item.details?.[section.category] || {}
                                                                    return (
                                                                        <div key={section.category} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3.5">
                                                                            <h5 className={`font-bold text-xs text-gray-800 pb-1.5 border-b border-gray-100 flex items-center gap-2`}>
                                                                                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${section.color}`} />
                                                                                {section.title}
                                                                            </h5>
                                                                            <ul className="space-y-2.5">
                                                                                {Object.entries(scores).map(([k, score]: [string, any]) => (
                                                                                    <li key={k} className="flex justify-between items-center text-xs text-gray-600">
                                                                                        <span className="capitalize">{k}</span>
                                                                                        <div className="flex items-center gap-1 font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                                                            {score}
                                                                                        </div>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                            
                                                            {/* Additional Suggestions */}
                                                            {item.suggestions && (
                                                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                                    <h5 className="font-bold text-xs text-gray-800 mb-1">ข้อเสนอแนะเพิ่มเติมเพื่อปรับปรุงระบบ</h5>
                                                                    <p className="text-sm text-slate-600 italic">"{item.suggestions}"</p>
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

                        {/* Completed Evaluations Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-250">
                                <div className="text-xs font-semibold text-gray-500">
                                    แสดง {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredEvaluations.length)} จาก {filteredEvaluations.length} รายการ
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: totalPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentPage(idx + 1)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === idx + 1
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ========== PENDING EVALUATIONS TAB ========== */
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-orange-50/50">
                                <tr>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">ผู้ยืม</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">อุปกรณ์</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">วันที่ยืม</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">วันที่คืน</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">เกินกำหนด</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-orange-800 uppercase tracking-wider">สถานะข้อกำหนด</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                                <span>กำลังโหลดข้อมูลค้างประเมิน...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : displayedPending.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-14 text-center">
                                            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2.5" />
                                            <p className="text-sm font-semibold text-gray-600">
                                                {pendingFilter === 'mandatory'
                                                    ? 'ไม่มีรายการบังคับประเมินคงค้างแล้ว 🎉'
                                                    : 'ผู้ใช้ทุกคนประเมินผลการใช้งานครบถ้วนแล้ว 🎉'
                                                }
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPending.map((loan: any) => {
                                        const daysSinceReturn = Math.floor(
                                            (Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                                        )
                                        const returnedDate = loan.updated_at?.split('T')[0] || ''
                                        const isMandatory = returnedDate >= cutoffDate
                                        const isOverdue = isMandatory && daysSinceReturn > 3

                                        return (
                                            <tr key={loan.id} className={`hover:bg-orange-50/10 transition-colors ${isOverdue ? 'bg-rose-50/30' : !isMandatory ? 'bg-gray-50/20' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm mr-3 ${isMandatory ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {loan.profiles?.first_name?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900 leading-4">
                                                                {loan.profiles?.first_name} {loan.profiles?.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">{loan.profiles?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-800">{loan.equipment?.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-1">#{loan.equipment?.equipment_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                                    {formatDateShort(loan.start_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                                                    {formatDateShort(loan.updated_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isOverdue
                                                        ? 'bg-rose-100 text-rose-700 border border-rose-200/50'
                                                        : daysSinceReturn >= 1
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                                                        }`}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {daysSinceReturn === 0 ? 'วันนี้' : `${daysSinceReturn} วัน`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isMandatory ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200/40">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            บังคับก่อนทำรายการใหม่
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200/40">
                                                            <Archive className="w-3.5 h-3.5" />
                                                            ข้อมูลย้อนหลัง (ไม่บังคับ)
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* Pending Pagination */}
                        {!pendingLoading && pendingTotalPages > 1 && (
                            <div className="bg-white px-6 py-4 flex items-center justify-between border-t border-gray-250">
                                <div className="text-xs font-semibold text-gray-500">
                                    แสดง {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, displayedPending.length)} จาก {displayedPending.length} รายการ
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: pendingTotalPages }).map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentPage(idx + 1)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${currentPage === idx + 1
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pendingTotalPages))}
                                        disabled={currentPage === pendingTotalPages}
                                        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
