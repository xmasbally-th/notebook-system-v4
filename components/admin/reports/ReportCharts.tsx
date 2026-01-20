'use client'

import { useMemo } from 'react'
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line
} from 'recharts'

// Color palette
const COLORS = {
    blue: '#3B82F6',
    green: '#22C55E',
    yellow: '#EAB308',
    red: '#EF4444',
    purple: '#8B5CF6',
    orange: '#F97316',
    gray: '#6B7280',
    cyan: '#06B6D4'
}

const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.yellow, COLORS.red, COLORS.purple, COLORS.gray]

interface LoanStatusChartProps {
    data: {
        pending: number
        approved: number
        returned: number
        rejected: number
    }
}

export function LoanStatusPieChart({ data }: LoanStatusChartProps) {
    const chartData = useMemo(() => [
        { name: 'รอดำเนินการ', value: data.pending, color: COLORS.yellow },
        { name: 'อนุมัติแล้ว', value: data.approved, color: COLORS.blue },
        { name: 'คืนแล้ว', value: data.returned, color: COLORS.green },
        { name: 'ปฏิเสธ', value: data.rejected, color: COLORS.red }
    ].filter(d => d.value > 0), [data])

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-gray-400">
                ไม่มีข้อมูล
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [value ?? 0, 'จำนวน']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

interface ReservationStatusChartProps {
    data: {
        pending: number
        approved: number
        completed: number
        cancelled: number
        rejected: number
    }
}

export function ReservationStatusPieChart({ data }: ReservationStatusChartProps) {
    const chartData = useMemo(() => [
        { name: 'รอดำเนินการ', value: data.pending, color: COLORS.yellow },
        { name: 'อนุมัติแล้ว', value: data.approved, color: COLORS.blue },
        { name: 'เสร็จสิ้น', value: data.completed, color: COLORS.green },
        { name: 'ยกเลิก', value: data.cancelled, color: COLORS.gray },
        { name: 'ปฏิเสธ', value: data.rejected, color: COLORS.red }
    ].filter(d => d.value > 0), [data])

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-gray-400">
                ไม่มีข้อมูล
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [value ?? 0, 'จำนวน']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

interface EquipmentStatusChartProps {
    data: {
        ready: number
        borrowed: number
        maintenance: number
    }
}

export function EquipmentStatusPieChart({ data }: EquipmentStatusChartProps) {
    const chartData = useMemo(() => [
        { name: 'พร้อมใช้งาน', value: data.ready, color: COLORS.green },
        { name: 'ถูกยืม', value: data.borrowed, color: COLORS.purple },
        { name: 'ซ่อมบำรุง', value: data.maintenance, color: COLORS.orange }
    ].filter(d => d.value > 0), [data])

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-gray-400">
                ไม่มีข้อมูล
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value) => [value ?? 0, 'ชิ้น']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    )
}

interface ActivityBarChartProps {
    data: {
        name: string
        count: number
    }[]
}

export function ActivityBarChart({ data }: ActivityBarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
                ไม่มีข้อมูลกิจกรรม
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    formatter={(value) => [value ?? 0, 'ครั้ง']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Bar dataKey="count" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}

interface MonthlyTrendChartProps {
    data: {
        month: string
        loans: number
        reservations: number
    }[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
                ไม่มีข้อมูล
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="loans"
                    name="การยืม"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    dot={{ fill: COLORS.blue, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                />
                <Line
                    type="monotone"
                    dataKey="reservations"
                    name="การจอง"
                    stroke={COLORS.purple}
                    strokeWidth={2}
                    dot={{ fill: COLORS.purple, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}

interface StaffActivityBarChartProps {
    data: {
        name: string
        approve: number
        reject: number
        return: number
    }[]
}

export function StaffActivityBarChart({ data }: StaffActivityBarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
                ไม่มีข้อมูลกิจกรรม
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Legend />
                <Bar dataKey="approve" name="อนุมัติ" fill={COLORS.green} stackId="a" />
                <Bar dataKey="reject" name="ปฏิเสธ" fill={COLORS.red} stackId="a" />
                <Bar dataKey="return" name="บันทึกคืน" fill={COLORS.blue} stackId="a" />
            </BarChart>
        </ResponsiveContainer>
    )
}

interface DailyActivityChartProps {
    data: {
        date: string
        count: number
    }[]
}

export function DailyActivityChart({ data }: DailyActivityChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
                ไม่มีข้อมูล
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                />
                <YAxis tick={{ fontSize: 11 }} width={30} />
                <Tooltip
                    formatter={(value) => [value ?? 0, 'กิจกรรม']}
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                />
                <Bar dataKey="count" fill={COLORS.blue} radius={[2, 2, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
