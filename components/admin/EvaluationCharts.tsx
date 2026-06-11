'use client'

import { useMemo } from 'react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts'
import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns'
import { th } from 'date-fns/locale'

interface EvaluationChartsProps {
    evaluations: any[]
    dateRange: { start: string; end: string }
}

export default function EvaluationCharts({ evaluations, dateRange }: EvaluationChartsProps) {
    // Process data for charts
    const chartData = useMemo(() => {
        if (!evaluations.length) return { trend: [], distribution: [] }

        // 1. Rating Distribution (1-5 Stars)
        const distribution = [
            { name: '1 ดาว', count: 0 },
            { name: '2 ดาว', count: 0 },
            { name: '3 ดาว', count: 0 },
            { name: '4 ดาว', count: 0 },
            { name: '5 ดาว', count: 0 },
        ]

        evaluations.forEach(ev => {
            const rating = Math.min(Math.max(ev.rating, 1), 5)
            if (distribution[rating - 1]) {
                distribution[rating - 1].count++
            }
        })

        // 2. Average Rating Trend (Daily)
        const startDate = startOfDay(parseISO(dateRange.start))
        const endDate = endOfDay(parseISO(dateRange.end))

        let daysInterval: Date[] = []
        try {
            daysInterval = eachDayOfInterval({ start: startDate, end: endDate })
        } catch (e) {
            // Fallback if date range is invalid
            daysInterval = []
        }

        const trend = daysInterval.map(day => {
            const dayEvals = evaluations.filter(ev => isSameDay(parseISO(ev.created_at), day))
            const avg = dayEvals.length > 0
                ? dayEvals.reduce((acc: number, curr: any) => acc + curr.rating, 0) / dayEvals.length
                : 0

            return {
                date: format(day, 'd MMM', { locale: th }),
                fullDate: format(day, 'd MMMM yyyy', { locale: th }),
                avg: avg > 0 ? Number(avg.toFixed(1)) : null,
                count: dayEvals.length
            }
        })

        return { distribution, trend }
    }, [evaluations, dateRange])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Rating Trend Area Chart - Premium Area Gradient */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    แนวโน้มคะแนนเฉลี่ยรายวัน
                </h3>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.trend} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.01}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={[0, 5]}
                                ticks={[0, 1, 2, 3, 4, 5]}
                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(229, 231, 235, 0.5)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                                }}
                                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                                formatter={(value: any) => [value, 'คะแนนเฉลี่ย']}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#4B5563' }} />
                            <Area
                                type="monotone"
                                dataKey="avg"
                                name="คะแนนเฉลี่ย"
                                stroke="#3B82F6"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorTrend)"
                                dot={{ r: 3.5, stroke: '#3B82F6', strokeWidth: 1.5, fill: '#FFF' }}
                                activeDot={{ r: 5.5, stroke: '#3B82F6', strokeWidth: 2, fill: '#FFF' }}
                                connectNulls
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Rating Distribution Bar Chart - Custom Cell Gradients */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    การกระจายตัวของระดับความพึงพอใจ
                </h3>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.distribution} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="grad-0" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#DC2626" stopOpacity={1}/>
                                </linearGradient>
                                <linearGradient id="grad-1" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#EA580C" stopOpacity={1}/>
                                </linearGradient>
                                <linearGradient id="grad-2" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#D97706" stopOpacity={1}/>
                                </linearGradient>
                                <linearGradient id="grad-3" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#84CC16" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#65A30D" stopOpacity={1}/>
                                </linearGradient>
                                <linearGradient id="grad-4" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fontSize: 11, fill: '#6B7280' }}
                                axisLine={false}
                                tickLine={false}
                                width={50}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(243, 244, 246, 0.2)' }}
                                contentStyle={{
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(229, 231, 235, 0.5)',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                                }}
                                formatter={(value: any) => [`${value} คน`, 'จำนวน']}
                            />
                            <Bar
                                dataKey="count"
                                radius={[0, 6, 6, 0]}
                                barSize={18}
                                name="จำนวนผู้ประเมิน"
                            >
                                {chartData.distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
