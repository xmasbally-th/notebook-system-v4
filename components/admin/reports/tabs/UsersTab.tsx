'use client'

import { useState, useMemo } from 'react'
import { ReportData, UserStats } from '@/hooks/useReportData'
import { exportToCSV } from '@/lib/reports'
import { User } from 'lucide-react'

type UserSortKey = 'name' | 'department' | 'loan_count' | 'total_activity' | 'overdue_count'

interface UsersTabProps {
    data: ReportData | undefined
    isLoading: boolean
}

export default function UsersTab({ data, isLoading }: UsersTabProps) {
    const [userDeptFilter, setUserDeptFilter] = useState<string>('all')
    const [userSortKey, setUserSortKey] = useState<UserSortKey>('loan_count')
    const [userSortAsc, setUserSortAsc] = useState<boolean>(false)

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        let users = data?.userStats ?? []

        // Filter by department
        if (userDeptFilter !== 'all') {
            users = users.filter(u => u.department === userDeptFilter)
        }

        // Sort
        return [...users].sort((a, b) => {
            let aVal: string | number = ''
            let bVal: string | number = ''

            switch (userSortKey) {
                case 'name':
                    aVal = `${a.first_name} ${a.last_name}`
                    bVal = `${b.first_name} ${b.last_name}`
                    break
                case 'department':
                    aVal = a.department
                    bVal = b.department
                    break
                case 'loan_count':
                    aVal = a.loan_count
                    bVal = b.loan_count
                    break
                case 'total_activity':
                    aVal = a.total_activity
                    bVal = b.total_activity
                    break
                case 'overdue_count':
                    aVal = a.overdue_count
                    bVal = b.overdue_count
                    break
            }

            if (typeof aVal === 'string') {
                return userSortAsc
                    ? aVal.localeCompare(bVal as string, 'th')
                    : (bVal as string).localeCompare(aVal, 'th')
            }
            return userSortAsc ? aVal - (bVal as number) : (bVal as number) - aVal
        })
    }, [data?.userStats, userDeptFilter, userSortKey, userSortAsc])

    // Export user stats to CSV
    const exportUserStatsCSV = () => {
        if (!filteredUsers.length) return
        exportToCSV({
            filename: 'รายงานผู้ใช้',
            headers: ['ลำดับ', 'ชื่อ-สกุล', 'อีเมล', 'สาขาวิชา', 'จำนวนครั้งที่ยืม', 'จำนวนครั้งที่จอง', 'รวมกิจกรรม', 'เกินกำหนด'],
            rows: filteredUsers.map((user, index) => [
                index + 1,
                `${user.first_name} ${user.last_name}`.trim() || '-',
                user.email,
                user.department,
                user.loan_count,
                user.reservation_count,
                user.total_activity,
                user.overdue_count
            ])
        })
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                {/* Department Filter */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">สาขาวิชา:</label>
                    <select
                        value={userDeptFilter}
                        onChange={(e) => setUserDeptFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">ทั้งหมด</option>
                        {(data?.departments ?? []).map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">เรียงตาม:</label>
                    <select
                        value={userSortKey}
                        onChange={(e) => setUserSortKey(e.target.value as UserSortKey)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="loan_count">จำนวนครั้งที่ยืม</option>
                        <option value="total_activity">รวมกิจกรรม</option>
                        <option value="overdue_count">เกินกำหนด</option>
                        <option value="name">ชื่อ</option>
                        <option value="department">สาขาวิชา</option>
                    </select>
                    <button
                        onClick={() => setUserSortAsc(!userSortAsc)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                        {userSortAsc ? '↑ น้อย-มาก' : '↓ มาก-น้อย'}
                    </button>
                </div>
            </div>

            {/* Summary by Department */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{filteredUsers.length}</p>
                    <p className="text-sm text-blue-700">ผู้ใช้ทั้งหมด</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {filteredUsers.reduce((sum, u) => sum + u.loan_count, 0)}
                    </p>
                    <p className="text-sm text-green-700">ยืมทั้งหมด</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                        {filteredUsers.reduce((sum, u) => sum + u.reservation_count, 0)}
                    </p>
                    <p className="text-sm text-purple-700">จองทั้งหมด</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                        {filteredUsers.filter(u => u.overdue_count > 0).length}
                    </p>
                    <p className="text-sm text-red-700">คืนล่าช้า</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">
                        รายชื่อผู้ใช้ ({filteredUsers.length} คน)
                    </h3>
                    <button
                        onClick={exportUserStatsCSV}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลำดับ</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ชื่อ-สกุล</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">อีเมล</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สาขาวิชา</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">ยืม</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">จอง</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">เกินกำหนด</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        ไม่มีข้อมูลผู้ใช้
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-700">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt="" className="w-8 h-8 object-cover" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                {`${user.first_name} ${user.last_name}`.trim() || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {user.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-green-600">{user.loan_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-semibold text-purple-600">{user.reservation_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.overdue_count > 0 ? (
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    {user.overdue_count} ครั้ง
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
