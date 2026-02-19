'use client'

import { useMemo } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
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
            { name: '1 ดาว', count: 0, fill: '#EF4444' }, // Red
            { name: '2 ดาว', count: 0, fill: '#F97316' }, // Orange
            { name: '3 ดาว', count: 0, fill: '#EAB308' }, // Yellow
            { name: '4 ดาว', count: 0, fill: '#84CC16' }, // Lime
            { name: '5 ดาว', count: 0, fill: '#22C55E' }, // Green
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
                : 0 // Or null if we want gaps

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
            {/* Rating Trend Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">แนวโน้มคะแนนเฉลี่ย</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.trend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={[0, 5]}
                                ticks={[0, 1, 2, 3, 4, 5]}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                                formatter={(value: any) => [value, 'คะแนนเฉลี่ย']}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="avg"
                                name="คะแนนเฉลี่ย"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Rating Distribution Chart */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">การกระจายตัวของคะแนน</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.distribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fontSize: 12 }}
                                width={50}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: any) => [`${value} คน`, 'จำนวน']}
                            />
                            <Bar
                                dataKey="count"
                                radius={[0, 4, 4, 0]}
                                barSize={32}
                                name="จำนวนผู้ประเมิน"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
