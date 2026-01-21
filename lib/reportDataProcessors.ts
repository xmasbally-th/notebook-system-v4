/**
 * Report Data Processors
 * Functions for processing and transforming report data
 */

import type {
    LoanStats,
    ReservationStats,
    EquipmentStats,
    PopularEquipment,
    OverdueItem,
    UserStats,
    StaffActivityItem,
    StaffActivityStats,
    MonthlyStats
} from '@/hooks/useReportData'

// Thai month names for formatting
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// Action type labels mapping
const ACTION_LABELS: Record<string, string> = {
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

/**
 * Calculate loan statistics from loan data
 */
export function calculateLoanStats(loans: any[], overdueLoans: any[]): LoanStats {
    return {
        total: Array.isArray(loans) ? loans.length : 0,
        pending: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'pending').length : 0,
        approved: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'approved').length : 0,
        returned: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'returned').length : 0,
        rejected: Array.isArray(loans) ? loans.filter((l: any) => l.status === 'rejected').length : 0,
        overdue: Array.isArray(overdueLoans) ? overdueLoans.length : 0
    }
}

/**
 * Calculate reservation statistics from reservation data
 */
export function calculateReservationStats(reservations: any[]): ReservationStats {
    return {
        total: Array.isArray(reservations) ? reservations.length : 0,
        pending: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'pending').length : 0,
        approved: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'approved').length : 0,
        completed: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'completed').length : 0,
        cancelled: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'cancelled').length : 0,
        rejected: Array.isArray(reservations) ? reservations.filter((r: any) => r.status === 'rejected').length : 0
    }
}

/**
 * Calculate equipment statistics from equipment data
 */
export function calculateEquipmentStats(equipment: any[]): EquipmentStats {
    return {
        total: Array.isArray(equipment) ? equipment.length : 0,
        ready: Array.isArray(equipment) ? equipment.filter((e: any) => e.status === 'ready' || e.status === 'active').length : 0,
        borrowed: Array.isArray(equipment) ? equipment.filter((e: any) => e.status === 'borrowed').length : 0,
        maintenance: Array.isArray(equipment) ? equipment.filter((e: any) => e.status === 'maintenance').length : 0
    }
}

/**
 * Calculate popular equipment from loan data
 */
export function calculatePopularEquipment(loans: any[], equipment: any[]): PopularEquipment[] {
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

    return Object.entries(equipmentUsage)
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
}

/**
 * Format overdue loan items
 */
export function formatOverdueItems(overdueLoans: any[]): OverdueItem[] {
    if (!Array.isArray(overdueLoans)) return []

    return overdueLoans.map((loan: any) => {
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
}

/**
 * Calculate user statistics from profile and activity data
 */
export function calculateUserStats(
    profiles: any[],
    loans: any[],
    reservations: any[],
    overdueLoans: any[]
): { userStats: UserStats[], departments: string[] } {
    // Count activities per user
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

    // Helper to get department name
    const getDepartmentName = (dept: any): string => {
        if (!dept) return 'ไม่ระบุ'
        if (typeof dept === 'string') return dept
        if (typeof dept === 'object') {
            return dept.name || dept.label || dept.th || JSON.stringify(dept)
        }
        return 'ไม่ระบุ'
    }

    const userStats: UserStats[] = Array.isArray(profiles)
        ? profiles.map((profile: any) => {
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

    const departments = Array.from(new Set(userStats.map(u => u.department))).filter(Boolean).sort()

    return { userStats, departments }
}

/**
 * Process staff activity log data
 */
export function processStaffActivityLog(activityLog: any[]): StaffActivityStats {
    const activities = Array.isArray(activityLog) ? activityLog : []

    // Get action type label
    const getActionLabel = (actionType: string): string => {
        return ACTION_LABELS[actionType] || actionType
    }

    // Aggregate by action type
    const actionTypeCounts: Record<string, number> = {}
    activities.forEach((activity: any) => {
        const actionType = activity.action_type
        actionTypeCounts[actionType] = (actionTypeCounts[actionType] || 0) + 1
    })
    const byActionType = Object.entries(actionTypeCounts)
        .map(([action, count]) => ({ name: getActionLabel(action), count }))
        .sort((a, b) => b.count - a.count)

    // Aggregate by staff
    const staffCounts: Record<string, { name: string; approve: number; reject: number; return: number }> = {}
    activities.forEach((activity: any) => {
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
    activities.forEach((activity: any) => {
        const date = new Date(activity.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })
    const dailyActivity = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .slice(-14)

    // Recent activities
    const recentActivities: StaffActivityItem[] = activities.slice(0, 20).map((activity: any) => ({
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

    return {
        total: activities.length,
        byActionType,
        byStaff,
        recentActivities,
        dailyActivity
    }
}

/**
 * Calculate monthly statistics from loan and reservation data
 */
export function calculateMonthlyStats(loans: any[], reservations: any[]): MonthlyStats[] {
    const monthlyData: Record<string, MonthlyStats> = {}

    if (Array.isArray(loans)) {
        loans.forEach((loan: any) => {
            const date = new Date(loan.created_at)
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`
            const monthLabel = `${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543 - 2500}`

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
            const monthLabel = `${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543 - 2500}`

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

    return Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([_, data]) => data)
}
