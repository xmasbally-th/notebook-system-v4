'use client'

import { useState, useMemo, useEffect, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase-helpers'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { CheckCircle, Clock } from 'lucide-react'
import { format, subDays, startOfMonth, endOfDay, startOfDay, parseISO } from 'date-fns'
import dynamic from 'next/dynamic'

import type {
    TabType, PendingFilter, RatingFilter,
    EvaluationItem, PendingLoan, DateRange, EvaluationStats
} from './types'

import EvaluationStatsCards from './_components/EvaluationStatsCards'
import EvaluationSectionAverages from './_components/EvaluationSectionAverages'
import CompletedEvaluationsTab from './_components/CompletedEvaluationsTab'
import PendingEvaluationsTab from './_components/PendingEvaluationsTab'
import EvaluationFilterBar from './_components/EvaluationFilterBar'

const EvaluationCharts = dynamic(() => import('@/components/admin/EvaluationCharts'), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] animate-pulse bg-gray-100/50 rounded-xl mb-6 border border-gray-200/50 backdrop-blur-sm" />
    ),
})

export default function EvaluationsPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const deferredSearchTerm = useDeferredValue(searchTerm)
    const [expandedRows, setExpandedRows] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<TabType>('completed')
    const [showScoringInfo, setShowScoringInfo] = useState(false)
    const [pendingFilter, setPendingFilter] = useState<PendingFilter>('mandatory')
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
    const [dateRange, setDateRange] = useState<DateRange>({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Reset pagination when filter states change
    useEffect(() => {
        setCurrentPage(1)
    }, [deferredSearchTerm, ratingFilter, dateRange, activeTab, pendingFilter, pageSize])

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

    const cutoffDate = (systemConfig as any)?.evaluation_cutoff_date || '2026-05-01'

    // Fetch completed evaluations within date range
    const { data: evaluations = [], isLoading } = useQuery<EvaluationItem[]>({
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

            return (data || []) as EvaluationItem[]
        }
    })

    // Fetch pending evaluations (capped at 200 to prevent full table scan)
    const { data: pendingEvaluations = [], isLoading: pendingLoading } = useQuery<PendingLoan[]>({
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
                .limit(200)

            if (error) {
                console.error('Error fetching pending evaluations:', error)
                return []
            }

            return ((data || []) as any[]).filter(
                (loan) => !loan.evaluations || loan.evaluations.length === 0
            ) as PendingLoan[]
        }
    })

    // Compute Stats from current fetched date range
    const stats: EvaluationStats = useMemo(() => {
        if (!evaluations.length) {
            return { avg: 0, total: 0, comments: 0, sectionAvgs: {} }
        }

        const total = evaluations.length
        const sum = evaluations.reduce((acc, curr) => acc + (curr.rating || 0), 0)
        const avg = sum / total
        const comments = evaluations.filter(e => e.suggestions && e.suggestions.trim().length > 0).length

        const sectionAvgs = evaluations.reduce((acc: Record<string, { sum: number; count: number }>, curr) => {
            const details = curr.details || {}
            const addScore = (category: string, score: number) => {
                if (!acc[category]) acc[category] = { sum: 0, count: 0 }
                if (score > 0) {
                    acc[category].sum += score
                    acc[category].count++
                }
            }

            if (details.system_overall !== undefined) {
                addScore('system', details.system_overall || 0)
                addScore('service', details.service_speed || 0)
                addScore('service', details.service_staff || 0)
                addScore('equipment', details.equipment_quality || 0)
                addScore('overall', details.overall_satisfaction || 0)
            } else {
                const addScores = (category: string) => {
                    const cat = details[category] || {}
                    Object.values(cat).forEach((score: any) => {
                        if (!acc[category]) acc[category] = { sum: 0, count: 0 }
                        if (typeof score === 'number' && score > 0) {
                            acc[category].sum += score
                            acc[category].count++
                        }
                    })
                }
                addScores('system')
                addScores('service')
                addScores('equipment')
                if (curr.rating > 0) {
                    addScore('overall', curr.rating)
                }
            }
            return acc
        }, {})

        return { avg, total, comments, sectionAvgs }
    }, [evaluations])

    // Split pending into mandatory (after cutoff) and old (before cutoff)
    const { mandatoryPending, oldPending } = useMemo(() => {
        const mandatory: PendingLoan[] = []
        const old: PendingLoan[] = []
        pendingEvaluations.forEach((loan) => {
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
            start = new Date('2025-01-01')
        }

        setDateRange({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        })
    }

    // Filter evaluations by search term and score filter
    const filteredEvaluations = useMemo(() => {
        if (!evaluations.length) return []

        return evaluations.filter((e) => {
            const searchLower = deferredSearchTerm.toLowerCase()
            const matchesSearch = !deferredSearchTerm || (
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
    }, [evaluations, deferredSearchTerm, ratingFilter])

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

        const headers = [
            'วันที่',
            'ผู้ประเมิน',
            'อีเมล',
            'อุปกรณ์',
            'รหัสครุภัณฑ์',
            'คะแนนรวม',
            'ระบบออนไลน์ (1-5)',
            'ความเร็วรับ-คืน (1-5)',
            'การบริการเจ้าหน้าที่ (1-5)',
            'คุณภาพอุปกรณ์ (1-5)',
            'ความพึงพอใจภาพรวม (1-5)',
            'ข้อเสนอแนะ'
        ]
        const csvContent = [
            headers.join(','),
            ...filteredEvaluations.map((item) => {
                const d = item.details || {}
                const systemScore = d.system_overall ?? (d.system ? Object.values(d.system)[0] : '') ?? ''
                const speedScore = d.service_speed ?? ''
                const staffScore = d.service_staff ?? ''
                const equipScore = d.equipment_quality ?? (d.equipment ? Object.values(d.equipment)[0] : '') ?? ''
                const overallScore = d.overall_satisfaction ?? item.rating ?? ''

                return [
                    `"${format(parseISO(item.created_at), 'dd/MM/yyyy HH:mm')}"`,
                    `"${sanitizeCSVField(`${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`).replace(/"/g, '""')}"`,
                    `"${sanitizeCSVField(item.profiles?.email || '').replace(/"/g, '""')}"`,
                    `"${sanitizeCSVField(item.loanRequests?.equipment?.name || '').replace(/"/g, '""')}"`,
                    `"${sanitizeCSVField(item.loanRequests?.equipment?.equipment_number || '').replace(/"/g, '""')}"`,
                    item.rating,
                    systemScore,
                    speedScore,
                    staffScore,
                    equipScore,
                    overallScore,
                    `"${sanitizeCSVField(item.suggestions || '').replace(/"/g, '""')}"`
                ].join(',')
            })
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
        const source = pendingFilter === 'mandatory' ? mandatoryPending : pendingEvaluations
        const searchLower = deferredSearchTerm.toLowerCase()
        return source.filter((loan) =>
            !deferredSearchTerm || (
                loan.profiles?.first_name?.toLowerCase().includes(searchLower) ||
                loan.profiles?.last_name?.toLowerCase().includes(searchLower) ||
                loan.profiles?.email?.toLowerCase().includes(searchLower) ||
                loan.equipment?.name?.toLowerCase().includes(searchLower) ||
                loan.equipment?.equipment_number?.toLowerCase().includes(searchLower)
            )
        )
    }, [pendingEvaluations, mandatoryPending, pendingFilter, deferredSearchTerm])

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

    // Compute star distribution counts from all evaluations in date range
    const { starDistribution, starTotal } = useMemo(() => {
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        if (!evaluations.length) return { starDistribution: counts, starTotal: 0 }

        const baseEvaluations = deferredSearchTerm
            ? evaluations.filter((e) => {
                const searchLower = deferredSearchTerm.toLowerCase()
                return (
                    e.profiles?.first_name?.toLowerCase().includes(searchLower) ||
                    e.profiles?.last_name?.toLowerCase().includes(searchLower) ||
                    e.profiles?.email?.toLowerCase().includes(searchLower) ||
                    e.loanRequests?.equipment?.name?.toLowerCase().includes(searchLower) ||
                    e.loanRequests?.equipment?.equipment_number?.toLowerCase().includes(searchLower)
                )
            })
            : evaluations

        baseEvaluations.forEach((e) => {
            const r = Math.min(Math.max(Math.round(e.rating || 1), 1), 5)
            counts[r] = (counts[r] || 0) + 1
        })
        return { starDistribution: counts, starTotal: baseEvaluations.length }
    }, [evaluations, deferredSearchTerm])

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <AdminPageHeader
                title="ผลการประเมินการใช้งาน"
                subtitle="ดูคะแนนความพึงพอใจและข้อเสนอแนะจากผู้ใช้ระบบ"
            />

            {/* 1. Stats Cards */}
            <EvaluationStatsCards
                stats={stats}
                mandatoryCount={mandatoryPending.length}
                oldCount={oldPending.length}
                cutoffDate={cutoffDate}
                formatDateShort={formatDateShort}
            />

            {/* 2. Charts Section */}
            {activeTab === 'completed' && filteredEvaluations.length > 0 && (
                <EvaluationCharts
                    evaluations={filteredEvaluations}
                    dateRange={dateRange}
                />
            )}

            {/* 3. Section Averages + Star Distribution + Scoring Guide */}
            <EvaluationSectionAverages
                sectionAvgs={stats.sectionAvgs}
                starDistribution={starDistribution}
                starTotal={starTotal}
                showScoringInfo={showScoringInfo}
                setShowScoringInfo={setShowScoringInfo}
            />

            {/* 4. Navigation Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200/30">
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeTab === 'completed'
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                >
                    <CheckCircle className="w-4 h-4" />
                    ประเมินแล้ว
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                        {filteredEvaluations.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeTab === 'pending'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    รอการประเมิน
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === 'pending'
                            ? 'bg-white/20 text-white'
                            : pendingEvaluations.length > 0
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-200 text-gray-700'
                    }`}>
                        {displayedPending.length}
                    </span>
                </button>
            </div>

            {/* 5. Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Filters Ribbon */}
                <EvaluationFilterBar
                    activeTab={activeTab}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    handleSetDateRangePreset={handleSetDateRangePreset}
                    handleExportCSV={handleExportCSV}
                    hasCompletedEvaluations={filteredEvaluations.length > 0}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    ratingFilter={ratingFilter}
                    setRatingFilter={setRatingFilter}
                    pendingFilter={pendingFilter}
                    setPendingFilter={setPendingFilter}
                    mandatoryCount={mandatoryPending.length}
                    totalPendingCount={pendingEvaluations.length}
                    pageSize={pageSize}
                    setPageSize={setPageSize}
                />

                {/* Tab Views */}
                {activeTab === 'completed' ? (
                    <CompletedEvaluationsTab
                        evaluations={filteredEvaluations}
                        isLoading={isLoading}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        setCurrentPage={setCurrentPage}
                        expandedRows={expandedRows}
                        toggleExpand={toggleExpand}
                        formatDate={formatDate}
                    />
                ) : (
                    <PendingEvaluationsTab
                        pendingLoans={displayedPending}
                        isLoading={pendingLoading}
                        pendingFilter={pendingFilter}
                        cutoffDate={cutoffDate}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        setCurrentPage={setCurrentPage}
                        formatDateShort={formatDateShort}
                    />
                )}
            </div>
        </div>
    )
}
