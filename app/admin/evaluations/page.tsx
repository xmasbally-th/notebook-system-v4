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
                    profiles!fk_loanrequests_profiles(id, first_name, last_name, email, avatar_url, user_type),
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
            if (details.system_overall !== undefined) {
                // New flat format (5 questions)
                const addScore = (category: string, score: number) => {
                    if (!acc[category]) acc[category] = { sum: 0, count: 0 }
                    if (score > 0) {
                        acc[category].sum += score
                        acc[category].count++
                    }
                }
                addScore('system', details.system_overall || 0)
                
                // service combines speed and staff
                addScore('service', details.service_speed || 0)
                addScore('service', details.service_staff || 0)
                
                addScore('equipment', details.equipment_quality || 0)
            } else {
                // Old nested format (10 questions)
                const addScores = (category: string) => {
                    const cat = details[category] || {}
                    Object.values(cat).forEach((score: any) => {
                        if (!acc[category]) acc[category] = { sum: 0, count: 0 }
                        if (score > 0) {
                            acc[category].sum += score
                            acc[category].count++
                        }
                    })
                }
                addScores('system')
                addScores('service')
                addScores('equipment')
            }
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

    // Compute star distribution counts
    const starDistribution = useMemo(() => {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        filteredEvaluations.forEach((e: any) => {
            const r = Math.min(Math.max(Math.round(e.rating), 1), 5) as 1 | 2 | 3 | 4 | 5
            counts[r]++
        })
        return counts
    }, [filteredEvaluations])

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

            {/* Section Averages + Star Distribution + Scoring Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. คะแนนเฉลี่ยแยกตามด้าน */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
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
                </div>

                {/* 2. การกระจายตัวของระดับดาว (Amazon-style Review Bars) */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            การกระจายตัวของระดับดาว
                        </h4>
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const count = starDistribution[stars as 1|2|3|4|5] || 0
                                const total = filteredEvaluations.length || 1
                                const percentage = (count / total) * 100
                                return (
                                    <div key={stars} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                                        <span className="w-10 whitespace-nowrap">{stars} ดาว</span>
                                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/20">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                                    stars === 5 ? 'from-emerald-400 to-green-500' :
                                                    stars === 4 ? 'from-green-400 to-lime-500' :
                                                    stars === 3 ? 'from-yellow-400 to-amber-500' :
                                                    stars === 2 ? 'from-orange-400 to-orange-500' :
                                                    'from-red-400 to-rose-500'
                                                }`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="w-12 text-right text-gray-400">{count} รีวิว</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. หลักการคำนวณและรายละเอียดข้อคําถาม */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between">
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
                    <div className="flex-1 p-5 text-xs text-slate-650 space-y-3 bg-white overflow-y-auto max-h-[160px] scrollbar-thin">
                        {showScoringInfo ? (
                            <>
                                <p>แบบประเมินมี <strong>รวมทั้งหมด 5 ข้อคําถามหลัก</strong> (คะแนน 1-5 ⭐):</p>
                                <div className="space-y-2">
                                    <div>
                                        <p className="font-bold text-slate-800">🖥 ระบบ:</p>
                                        <p className="text-slate-500 pl-2">ความง่าย ความเสถียร และความครบถ้วนของข้อมูล</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">🤝 บริการ:</p>
                                        <p className="text-slate-500 pl-2">ความรวดเร็วในการรับ-คืน, การให้บริการของเจ้าหน้าที่</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">📦 อุปกรณ์:</p>
                                        <p className="text-slate-500 pl-2">สภาพและคุณภาพความพร้อมใช้งานของอุปกรณ์</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">⭐ ภาพรวม:</p>
                                        <p className="text-slate-500 pl-2">ความพึงพอใจโดยรวม</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100/50 text-blue-900 flex items-start gap-2 h-full">
                                <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                                <div className="text-[11px] leading-relaxed">
                                    <strong>หลักการปัดเศษ:</strong> คะแนนเฉลี่ยรวมในแต่ละรายการ คำนวณจากค่าเฉลี่ยของทุกข้อ จากนั้นจะถูกปัดเศษตามหลักทศนิยมทางสถิติออกมาเป็นดาวรวม
                                </div>
                            </div>
                        )}
                    </div>
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
                    /* ========== COMPLETED EVALUATIONS TAB (PREMIUM REVIEW CARDS) ========== */
                    <div className="space-y-4 p-4 md:p-6 bg-gray-50/30">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                                                <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                                            </div>
                                            <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
                                        </div>
                                        <div className="h-12 bg-gray-50 rounded-xl"></div>
                                        <div className="flex justify-between items-center pt-2">
                                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                                            <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredEvaluations.length === 0 ? (
                            <div className="py-16 text-center bg-white rounded-2xl border border-gray-250/60 shadow-sm max-w-lg mx-auto my-8 w-full">
                                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20 duration-1000"></div>
                                    <div className="absolute inset-0 bg-blue-50 rounded-full"></div>
                                    <div className="absolute inset-2 bg-blue-100/40 rounded-full"></div>
                                    <MessageSquare className="w-9 h-9 text-blue-600 relative z-10 drop-shadow-sm" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">ไม่พบประวัติผลการประเมิน</h3>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                    ยังไม่มีข้อมูลหรือผลการประเมินความพึงพอใจในช่วงเวลาหรือตัวกรองที่เลือกในขณะนี้
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {paginatedEvaluations.map((item: any) => {
                                    const ratingBg = item.rating >= 4 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : item.rating >= 3 ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                                    const isExpanded = expandedRows.includes(item.id)

                                    return (
                                        <div 
                                            key={item.id} 
                                            className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between ${
                                                isExpanded ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/5' : 'border-gray-200'
                                            }`}
                                        >
                                            {/* Card Top: User Info & Date */}
                                            <div className="p-5 pb-3 flex justify-between items-start gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                                        {item.profiles?.first_name?.[0] || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-bold text-gray-900 leading-tight truncate">
                                                            {item.profiles?.first_name} {item.profiles?.last_name}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{item.profiles?.email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-gray-450 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 whitespace-nowrap">
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>

                                            {/* Card Middle: Equipment Info & Rating */}
                                            <div className="px-5 pb-3">
                                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">อุปกรณ์ที่ยืม</p>
                                                        <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{item.loanRequests?.equipment?.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{item.loanRequests?.equipment?.equipment_number}</p>
                                                    </div>
                                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-extrabold flex-shrink-0 ${ratingBg}`}>
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        <span>{item.rating}.0</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Suggestions */}
                                            {item.suggestions && (
                                                <div className="px-5 pb-4">
                                                    <div className="bg-slate-50/50 border border-slate-200/40 rounded-xl p-3">
                                                        <p className="text-[10px] font-semibold text-slate-400">ข้อเสนอแนะ:</p>
                                                        <p className="text-xs text-slate-600 italic mt-1 leading-relaxed">
                                                            "{item.suggestions}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Card Bottom: Toggle details & details view */}
                                            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex flex-col gap-3">
                                                <button
                                                    onClick={() => toggleExpand(item.id)}
                                                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                                >
                                                    <span>{isExpanded ? 'ซ่อนคะแนนประเมินรายข้อ' : 'แสดงคะแนนประเมินรายข้อ'}</span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { category: 'system', title: 'ระบบ (System)' },
                                                                { category: 'service', title: 'บริการ (Service)' },
                                                                { category: 'equipment', title: 'อุปกรณ์ (Equip)' }
                                                            ].map((section) => {
                                                                let categoryAvg = 0
                                                                
                                                                if (item.details?.system_overall !== undefined) {
                                                                    // New flat format
                                                                    if (section.category === 'system') {
                                                                        categoryAvg = item.details.system_overall || 0
                                                                    } else if (section.category === 'service') {
                                                                        const scores = [item.details.service_speed, item.details.service_staff].filter(s => s > 0)
                                                                        categoryAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
                                                                    } else if (section.category === 'equipment') {
                                                                        categoryAvg = item.details.equipment_quality || 0
                                                                    }
                                                                } else {
                                                                    // Old nested format
                                                                    const scores = item.details?.[section.category] || {}
                                                                    const values = Object.values(scores).filter((s: any) => typeof s === 'number' && s > 0) as number[]
                                                                    const categorySum = values.reduce((acc: number, cur: number) => acc + cur, 0)
                                                                    const categoryCount = values.length || 1
                                                                    categoryAvg = categorySum / categoryCount
                                                                }

                                                                return (
                                                                    <div key={section.category} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm space-y-1.5 text-center">
                                                                        <span className="text-[9px] font-bold text-gray-500 block truncate">{section.title}</span>
                                                                        <div className="flex items-center justify-center gap-1 font-extrabold text-xs text-gray-800 bg-gray-50 py-0.5 rounded-lg border border-gray-100">
                                                                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                                            {categoryAvg ? categoryAvg.toFixed(1) : '-'}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Completed Evaluations Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="bg-white px-6 py-4 flex items-center justify-between border border-gray-200 rounded-2xl shadow-sm mt-4">
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
                    <div>
                        {pendingLoading ? (
                            <>
                                {/* Desktop Skeleton Table */}
                                <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
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
                                            {[...Array(4)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                                                            <div className="space-y-1.5 flex-1">
                                                                <div className="h-4 w-28 bg-gray-200 rounded"></div>
                                                                <div className="h-3 w-36 bg-gray-200 rounded"></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="space-y-1.5">
                                                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                                            <div className="h-3 w-20 bg-gray-200 rounded text-xs font-mono"></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile Skeleton List */}
                                <div className="md:hidden space-y-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-150 shadow-sm space-y-3 animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0"></div>
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="h-4 w-28 bg-gray-200 rounded"></div>
                                                    <div className="h-3 w-36 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5">
                                                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                                                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                                                <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : displayedPending.length === 0 ? (
                            /* Premium Empty State Banner */
                            <div className="p-16 text-center bg-white rounded-2xl border border-gray-200/60 shadow-sm max-w-lg mx-auto my-8">
                                <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-emerald-50 rounded-full animate-ping opacity-20 duration-1000"></div>
                                    <div className="absolute inset-0 bg-emerald-50 rounded-full"></div>
                                    <div className="absolute inset-2 bg-emerald-100/40 rounded-full"></div>
                                    <CheckCircle className="w-9 h-9 text-emerald-600 relative z-10 drop-shadow-sm" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {pendingFilter === 'mandatory'
                                        ? 'ไม่มีรายการบังคับประเมินคงค้างแล้ว 🎉'
                                        : 'การประเมินเสร็จสมบูรณ์ครบถ้วน 🎉'
                                    }
                                </h3>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                                    {pendingFilter === 'mandatory'
                                        ? 'ผู้ใช้งานที่คืนเครื่องภายใน 7 วันทำการได้ส่งแบบประเมินครบถ้วนแล้ว'
                                        : 'ธุรกรรมการยืม-คืนอุปกรณ์โน้ตบุ๊คทั้งหมดได้รับการประเมินความพึงพอใจแล้ว'
                                    }
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
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
                                            {paginatedPending.map((loan: any) => {
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
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Cards List */}
                                <div className="md:hidden space-y-3">
                                    {paginatedPending.map((loan: any) => {
                                        const daysSinceReturn = Math.floor(
                                            (Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                                        )
                                        const returnedDate = loan.updated_at?.split('T')[0] || ''
                                        const isMandatory = returnedDate >= cutoffDate
                                        const isOverdue = isMandatory && daysSinceReturn > 3

                                        return (
                                            <div
                                                key={loan.id}
                                                className={`bg-white rounded-xl p-4 border shadow-sm space-y-3 transition-colors ${
                                                    isOverdue
                                                        ? 'border-red-200 bg-rose-50/20'
                                                        : !isMandatory
                                                            ? 'border-gray-150 bg-gray-50/20'
                                                            : 'border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm mr-3 flex-shrink-0 ${
                                                        isMandatory ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {loan.profiles?.first_name?.[0] || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                                            {loan.profiles?.first_name} {loan.profiles?.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-450 truncate mt-0.5">{loan.profiles?.email}</div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">อุปกรณ์ที่คืน</div>
                                                    <div className="text-sm font-semibold text-gray-800 truncate mt-0.5">{loan.equipment?.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono mt-0.5">#{loan.equipment?.equipment_number}</div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">วันที่ยืม</span>
                                                        <span>{formatDateShort(loan.start_date)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 block mb-0.5">วันที่คืน</span>
                                                        <span>{formatDateShort(loan.updated_at)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 gap-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                                        isOverdue
                                                            ? 'bg-rose-100 text-rose-700 border border-rose-200/50'
                                                            : daysSinceReturn >= 1
                                                                ? 'bg-amber-100 text-amber-700 border border-amber-200/50'
                                                                : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                                                    }`}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {daysSinceReturn === 0 ? 'วันนี้' : `${daysSinceReturn} วัน`}
                                                    </span>

                                                    {isMandatory ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200/40">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            บังคับก่อนเริ่มใหม่
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/40">
                                                            <Archive className="w-3.5 h-3.5" />
                                                            ไม่บังคับ
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        {/* Pending Pagination */}
                        {!pendingLoading && pendingTotalPages > 1 && (
                            <div className="bg-white px-6 py-4 flex items-center justify-between border border-gray-200 rounded-xl shadow-sm mt-4">
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
