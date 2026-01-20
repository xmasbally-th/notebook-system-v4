'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupabaseCredentials } from '@/lib/supabase-helpers'

// Get access token from session
async function getAccessToken(): Promise<string | null> {
    try {
        const { url, key } = getSupabaseCredentials()
        if (!url || !key) return null

        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(url, key)
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
    } catch {
        return null
    }
}

export interface DateRange {
    from: Date
    to: Date
}

export interface LoanStats {
    total: number
    pending: number
    approved: number
    returned: number
    rejected: number
    overdue: number
}

export interface ReservationStats {
    total: number
    pending: number
    approved: number
    completed: number
    cancelled: number
    rejected: number
}

export interface EquipmentStats {
    total: number
    ready: number
    borrowed: number
    maintenance: number
}

export interface PopularEquipment {
    id: string
    name: string
    equipment_number: string
    loan_count: number
    reservation_count: number
    total_usage: number
}

export interface OverdueItem {
    id: string
    user_name: string
    user_email: string
    equipment_name: string
    equipment_number: string
    end_date: string
    days_overdue: number
}

export interface UserStats {
    id: string
    email: string
    first_name: string
    last_name: string
    department: string
    user_type: string
    loan_count: number
    reservation_count: number
    total_activity: number
    overdue_count: number
}

export interface StaffActivityItem {
    id: string
    staff_id: string
    staff_name: string
    staff_role: string
    action_type: string
    target_type: string
    target_id: string
    created_at: string
    details: Record<string, any>
}

export interface StaffActivityStats {
    total: number
    byActionType: { name: string; count: number }[]
    byStaff: { name: string; approve: number; reject: number; return: number }[]
    recentActivities: StaffActivityItem[]
    dailyActivity: { date: string; count: number }[]
}

export interface MonthlyStats {
    month: string
    loans: number
    reservations: number
    returned: number
    overdue: number
}

export interface ReportData {
    loanStats: LoanStats
    reservationStats: ReservationStats
    equipmentStats: EquipmentStats
    popularEquipment: PopularEquipment[]
    overdueItems: OverdueItem[]
    todayLoans: number
    userStats: UserStats[]
    departments: string[]
    staffActivity: StaffActivityStats
    monthlyStats: MonthlyStats[]
}

export function useReportData(dateRange: DateRange) {
    return useQuery({
        queryKey: ['report-data', dateRange.from.toISOString(), dateRange.to.toISOString()],
        staleTime: 60000, // 1 minute
        queryFn: async (): Promise<ReportData> => {
            const { url, key } = getSupabaseCredentials()
            const token = await getAccessToken()

            if (!url || !key || !token) {
                throw new Error('Missing credentials')
            }

            const headers = {
                'apikey': key,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }

            const fromDate = dateRange.from.toISOString()
            const toDate = dateRange.to.toISOString()
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todayISO = today.toISOString()

            // Parallel fetch all data
            const [
                loansRes,
                reservationsRes,
                equipmentRes,
                overdueRes,
                profilesRes,
                staffActivityRes
            ] = await Promise.all([
                // Loans in date range
                fetch(`${url}/rest/v1/loanRequests?select=id,status,created_at,end_date,user_id,equipment_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`, { headers }),
                // Reservations in date range
                fetch(`${url}/rest/v1/reservations?select=id,status,created_at,user_id&created_at=gte.${fromDate}&created_at=lte.${toDate}`, { headers }),
                // All equipment
                fetch(`${url}/rest/v1/equipment?select=id,name,equipment_number,status`, { headers }),
                // Overdue loans (approved but past end_date)
                fetch(`${url}/rest/v1/loanRequests?select=id,end_date,user_id,equipment_id,profiles:user_id(first_name,last_name,email),equipment:equipment_id(name,equipment_number)&status=eq.approved&end_date=lt.${new Date().toISOString()}`, { headers }),
                // All profiles for user stats
                fetch(`${url}/rest/v1/profiles?status=eq.approved&select=id,email,first_name,last_name,department,role,status`, { headers }),
                // Staff activity log in date range
                fetch(`${url}/rest/v1/staff_activity_log?select=id,staff_id,staff_role,action_type,target_type,target_id,created_at,details,profiles:staff_id(first_name,last_name)&created_at=gte.${fromDate}&created_at=lte.${toDate}&order=created_at.desc`, { headers })
            ])

            const [loans, reservations, equipment, overdueLoans, profiles, staffActivityLog] = await Promise.all([
                loansRes.json(),
                reservationsRes.json(),
                equipmentRes.json(),
                overdueRes.json(),
                profilesRes.json(),
                staffActivityRes.json()
            ])

            // Calculate loan stats
            const loanStats: LoanStats = {
                total: Array.isArray(loans) ? loans.length : 0,
                pending: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'pending').length : 0,
                approved: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'approved').length : 0,
                returned: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'returned').length : 0,
                rejected: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'rejected').length : 0,
                overdue: Array.isArray(overdueLoans) ? overdueLoans.length : 0
            }

            // Calculate reservation stats
            const reservationStats: ReservationStats = {
                total: Array.isArray(reservations) ? reservations.length : 0,
                pending: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'pending').length : 0,
                approved: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'approved').length : 0,
                completed: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'completed').length : 0,
                cancelled: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'cancelled').length : 0,
                rejected: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'rejected').length : 0
            }

            // Calculate equipment stats
            const equipmentStats: EquipmentStats = {
                total: Array.isArray(equipment) ? equipment.length : 0,
                ready: Array.isArray(equipment) ? equipment.filter((e: any) => e.status === 'ready' || e.status === 'active').length : 0,
                borrowed: Array.isArray(equipment) ? equipment.filter((e: any) => e.status === 'borrowed').length : 0,
                maintenance: Array.isArray(equipment) ? equipment.filter((e: any) => e.status === 'maintenance').length : 0
            }

            // Calculate popular equipment
            const equipmentUsage: Record<string, { equipment: any, loans: number, reservations: number }> = {}

            if (Array.isArray(loans)) {
                loans.forEach((loan: any) => {
                    if (!equipmentUsage[loan.equipment_id]) {
                        const eq = Array.isArray(equipment) ? equipment.find((e: any) => e.id === loan.equipment_id) : null
                        equipmentUsage[loan.equipment_id] = { equipment: eq, loans: 0, reservations: 0 }
                    }
                    equipmentUsage[loan.equipment_id].loans++
                })
            }

            const popularEquipment: PopularEquipment[] = Object.entries(equipmentUsage)
                .map(([id, data]) => ({
                    id,
                    name: data.equipment?.name || 'Unknown',
                    equipment_number: data.equipment?.equipment_number || '-',
                    loan_count: data.loans,
                    reservation_count: data.reservations,
                    total_usage: data.loans + data.reservations
                }))
                .sort((a, b) => b.total_usage - a.total_usage)
                .slice(0, 10)

            // Format overdue items
            const overdueItems: OverdueItem[] = Array.isArray(overdueLoans)
                ? overdueLoans.map((loan: any) => {
                    const endDate = new Date(loan.end_date)
                    const now = new Date()
                    const daysOverdue = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

                    return {
                        id: loan.id,
                        user_name: loan.profiles ? `${loan.profiles.first_name || ''} ${loan.profiles.last_name || ''}`.trim() : 'Unknown',
                        user_email: loan.profiles?.email || '-',
                        equipment_name: loan.equipment?.name || 'Unknown',
                        equipment_number: loan.equipment?.equipment_number || '-',
                        end_date: loan.end_date,
                        days_overdue: daysOverdue
                    }
                })
                : []

            // Count today's loans
            const todayLoans = Array.isArray(loans)
                ? loans.filter((l: any) => new Date(l.created_at) >= today).length
                : 0

            // Calculate user stats with loan counts
            const userLoanCounts: Record<string, number> = {}
            const userReservationCounts: Record<string, number> = {}
            const userOverdueCounts: Record<string, number> = {}

            if (Array.isArray(loans)) {
                loans.forEach((loan: any) => {
                    userLoanCounts[loan.user_id] = (userLoanCounts[loan.user_id] || 0) + 1
                })
            }

            if (Array.isArray(reservations)) {
                reservations.forEach((res: any) => {
                    userReservationCounts[res.user_id] = (userReservationCounts[res.user_id] || 0) + 1
                })
            }

            if (Array.isArray(overdueLoans)) {
                overdueLoans.forEach((loan: any) => {
                    userOverdueCounts[loan.user_id] = (userOverdueCounts[loan.user_id] || 0) + 1
                })
            }

            const userStats: UserStats[] = Array.isArray(profiles)
                ? profiles.map((profile: any) => {
                    const getDepartmentName = (dept: any): string => {
                        if (!dept) return 'ไม่ระบุ'
                        if (typeof dept === 'string') return dept
                        if (typeof dept === 'object') {
                            return dept.name || dept.label || dept.th || JSON.stringify(dept)
                        }
                        return 'ไม่ระบุ'
                    }

                    const loanCount = userLoanCounts[profile.id] || 0
                    const reservationCount = userReservationCounts[profile.id] || 0
                    const overdueCount = userOverdueCounts[profile.id] || 0

                    return {
                        id: profile.id,
                        email: profile.email || '-',
                        first_name: profile.first_name || '',
                        last_name: profile.last_name || '',
                        department: getDepartmentName(profile.department),
                        user_type: profile.role || 'user',
                        loan_count: loanCount,
                        reservation_count: reservationCount,
                        total_activity: loanCount + reservationCount,
                        overdue_count: overdueCount
                    }
                })
                : []

            // Extract unique departments
            const departments = Array.from(new Set(userStats.map(u => u.department))).filter(Boolean).sort()

            // Process staff activity log
            const activityLog = Array.isArray(staffActivityLog) ? staffActivityLog : []

            // Get action type label
            const getActionLabel = (actionType: string): string => {
                const labels: Record<string, string> = {
                    'approve_loan': 'อนุมัติยืม',
                    'reject_loan': 'ปฏิเสธยืม',
                    'mark_returned': 'บันทึกคืน',
                    'approve_reservation': 'อนุมัติจอง',
                    'reject_reservation': 'ปฏิเสธจอง',
                    'mark_ready': 'พร้อมรับ',
                    'convert_to_loan': 'แปลงเป็นยืม',
                    'cancel_reservation': 'ยกเลิกจอง',
                    'self_borrow': 'ยืมเอง',
                    'self_reserve': 'จองเอง',
                    'export_data': 'ส่งออกข้อมูล',
                    'import_data': 'นำเข้าข้อมูล',
                    'soft_delete_data': 'ลบข้อมูล',
                    'hard_delete_notifications': 'ลบการแจ้งเตือน',
                    'restore_data': 'กู้คืนข้อมูล'
                }
                return labels[actionType] || actionType
            }

            // Aggregate by action type
            const actionTypeCounts: Record<string, number> = {}
            activityLog.forEach((activity: any) => {
                const actionType = activity.action_type
                actionTypeCounts[actionType] = (actionTypeCounts[actionType] || 0) + 1
            })
            const byActionType = Object.entries(actionTypeCounts)
                .map(([action, count]) => ({ name: getActionLabel(action), count }))
                .sort((a, b) => b.count - a.count)

            // Aggregate by staff
            const staffCounts: Record<string, { name: string; approve: number; reject: number; return: number }> = {}
            activityLog.forEach((activity: any) => {
                const staffId = activity.staff_id
                const staffName = activity.profiles
                    ? `${activity.profiles.first_name || ''} ${activity.profiles.last_name || ''}`.trim()
                    : 'Unknown'

                if (!staffCounts[staffId]) {
                    staffCounts[staffId] = { name: staffName, approve: 0, reject: 0, return: 0 }
                }

                if (activity.action_type.includes('approve')) {
                    staffCounts[staffId].approve++
                } else if (activity.action_type.includes('reject')) {
                    staffCounts[staffId].reject++
                } else if (activity.action_type === 'mark_returned') {
                    staffCounts[staffId].return++
                }
            })
            const byStaff = Object.values(staffCounts)
                .sort((a, b) => (b.approve + b.reject + b.return) - (a.approve + a.reject + a.return))

            // Daily activity count
            const dailyCounts: Record<string, number> = {}
            activityLog.forEach((activity: any) => {
                const date = new Date(activity.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
                dailyCounts[date] = (dailyCounts[date] || 0) + 1
            })
            const dailyActivity = Object.entries(dailyCounts)
                .map(([date, count]) => ({ date, count }))
                .slice(-14) // Last 14 days

            // Recent activities
            const recentActivities: StaffActivityItem[] = activityLog.slice(0, 20).map((activity: any) => ({
                id: activity.id,
                staff_id: activity.staff_id,
                staff_name: activity.profiles
                    ? `${activity.profiles.first_name || ''} ${activity.profiles.last_name || ''}`.trim()
                    : 'Unknown',
                staff_role: activity.staff_role,
                action_type: activity.action_type,
                target_type: activity.target_type,
                target_id: activity.target_id,
                created_at: activity.created_at,
                details: activity.details || {}
            }))

            const staffActivity: StaffActivityStats = {
                total: activityLog.length,
                byActionType,
                byStaff,
                recentActivities,
                dailyActivity
            }

            // Calculate monthly stats from loans data
            const monthlyData: Record<string, MonthlyStats> = {}
            const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

            if (Array.isArray(loans)) {
                loans.forEach((loan: any) => {
                    const date = new Date(loan.created_at)
                    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
                    const monthLabel = `${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543 - 2500}`

                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = {
                            month: monthLabel,
                            loans: 0,
                            reservations: 0,
                            returned: 0,
                            overdue: 0
                        }
                    }

                    monthlyData[monthKey].loans++
                    if (loan.status === 'returned') {
                        monthlyData[monthKey].returned++
                    }
                })
            }

            if (Array.isArray(reservations)) {
                reservations.forEach((res: any) => {
                    const date = new Date(res.created_at)
                    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
                    const monthLabel = `${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543 - 2500}`

                    if (!monthlyData[monthKey]) {
                        monthlyData[monthKey] = {
                            month: monthLabel,
                            loans: 0,
                            reservations: 0,
                            returned: 0,
                            overdue: 0
                        }
                    }

                    monthlyData[monthKey].reservations++
                })
            }

            const monthlyStats = Object.entries(monthlyData)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([_, data]) => data)

            return {
                loanStats,
                reservationStats,
                equipmentStats,
                popularEquipment,
                overdueItems,
                todayLoans,
                userStats,
                departments,
                staffActivity,
                monthlyStats
            }
        }
    })
}
