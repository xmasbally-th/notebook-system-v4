'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useMemo } from 'react'

type LoanLimitsByType = {
    [key: string]: {
        max_days: number
        max_items: number
        type_limits?: Record<string, number>
    }
}

type UserType = 'student' | 'lecturer' | 'staff'

interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
}

interface LoanValidationResult {
    validateDates: (startDate: string, endDate: string, returnTime?: string) => ValidationResult
    isLoading: boolean
    config: {
        maxDays: number
        maxItems: number
        typeLimits: Record<string, number>
        openingTime: string
        closingTime: string
        closedDates: string[]
        isLoanSystemActive: boolean
    } | null
    currentLoanCount: number
    activeLoans: any[]
}


export function useLoanValidation(userType: UserType = 'student'): LoanValidationResult {
    // Fetch system config using direct fetch
    const { data: systemConfig, isLoading: configLoading } = useQuery({
        queryKey: ['system_config'],
        staleTime: 5 * 60 * 1000, // 5 minutes - config rarely changes
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('system_config')
                .select('*')
                .limit(1)
                .single()
            if (error) return null
            return data || null
        }
    })

    // Fetch current user's active loans count and details
    const { data: activeLoanData, isLoading: loansLoading } = useQuery({
        queryKey: ['my-active-loans-count'],
        staleTime: 60 * 1000, // 1 minute
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return { count: 0, loans: [] }

            const { data, error } = await (supabase as any)
                .from('loanRequests')
                .select('id,equipment_id,equipment(equipment_type_id)')
                .eq('user_id', user.id)
                .in('status', ['pending', 'approved'])

            if (error) return { count: 0, loans: [] }
            return { count: data?.length || 0, loans: data || [] }
        }
    })

    // Get limits based on user type
    const config = useMemo(() => {
        if (!systemConfig) return null

        const loanLimits = systemConfig.loan_limits_by_type as LoanLimitsByType | null
        const limits = loanLimits?.[userType] || { max_days: 7, max_items: 1, type_limits: {} }

        return {
            maxDays: limits.max_days,
            maxItems: limits.max_items,
            typeLimits: limits.type_limits || {},
            openingTime: systemConfig.opening_time || '08:30',
            closingTime: systemConfig.closing_time || '16:30',
            closedDates: (systemConfig.closed_dates as string[]) || [],
            isLoanSystemActive: systemConfig.is_loan_system_active ?? true
        }
    }, [systemConfig, userType])

    const currentLoanCount = activeLoanData?.count || 0
    const activeLoans = activeLoanData?.loans || []

    // Validation function
    const validateDates = (startDate: string, endDate: string, returnTime?: string, equipmentTypeId?: string): ValidationResult => {
        const errors: string[] = []
        const warnings: string[] = []

        if (!config) {
            return { isValid: false, errors: ['กำลังโหลดการตั้งค่าระบบ...'], warnings: [] }
        }

        // Check if loan system is active
        if (!config.isLoanSystemActive) {
            errors.push('ระบบยืม-คืนปิดให้บริการชั่วคราว')
            return { isValid: false, errors, warnings }
        }

        // Check if dates are provided
        if (!startDate || !endDate) {
            errors.push('กรุณาระบุวันที่ยืมและวันที่คืน')
            return { isValid: false, errors, warnings }
        }

        const start = new Date(startDate)
        const end = new Date(endDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Check if start date is in the past
        if (start < today) {
            errors.push('วันที่ยืมต้องไม่เป็นวันที่ผ่านมาแล้ว')
        }

        // Check if end date is before start date
        if (end < start) {
            errors.push('วันที่คืนต้องไม่ก่อนวันที่ยืม')
        }

        // Calculate loan duration
        const durationMs = end.getTime() - start.getTime()
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1 // +1 because same day = 1 day

        // Check max days
        if (durationDays > config.maxDays) {
            errors.push(`ระยะเวลายืมเกินกำหนดสูงสุด (สูงสุด ${config.maxDays} วัน คุณเลือก ${durationDays} วัน)`)
        }

        // Check max items
        if (currentLoanCount >= config.maxItems) {
            errors.push(`คุณมีรายการยืมถึงขีดจำกัดแล้ว (สูงสุด ${config.maxItems} รายการ)`)
        }

        // Check type limits
        if (equipmentTypeId && config.typeLimits[equipmentTypeId]) {
            const typeLimit = config.typeLimits[equipmentTypeId]
            // Count active loans for this type
            const activeTypeLoans = activeLoans.filter((loan: any) =>
                loan.equipment?.equipment_type_id === equipmentTypeId
            ).length

            if (activeTypeLoans >= typeLimit) {
                errors.push(`คุณยืมอุปกรณ์ประเภทนี้ครบจำนวนที่กำหนดแล้ว (สูงสุด ${typeLimit} รายการ)`)
            }
        }

        // Check if start date is on closed date
        const startDateStr = start.toISOString().split('T')[0]
        if (config.closedDates.includes(startDateStr)) {
            errors.push('วันที่ยืมตรงกับวันหยุดทำการ')
        }

        // Check if end date is on closed date
        const endDateStr = end.toISOString().split('T')[0]
        if (config.closedDates.includes(endDateStr)) {
            errors.push('วันที่คืนตรงกับวันหยุดทำการ')
        }

        // Check return time if provided
        if (returnTime) {
            const [hours, minutes] = returnTime.split(':').map(Number)
            const [openHours, openMinutes] = config.openingTime.split(':').map(Number)
            const [closeHours, closeMinutes] = config.closingTime.split(':').map(Number)

            const returnMinutes = hours * 60 + minutes
            const openingMinutes = openHours * 60 + openMinutes
            const closingMinutes = closeHours * 60 + closeMinutes

            if (returnMinutes < openingMinutes || returnMinutes > closingMinutes) {
                errors.push(`เวลาคืนต้องอยู่ในช่วงเวลาทำการ (${config.openingTime} - ${config.closingTime})`)
            }
        }

        // Warnings
        if (durationDays >= config.maxDays - 1) {
            warnings.push('ระยะเวลายืมใกล้ถึงขีดจำกัดสูงสุด')
        }

        if (currentLoanCount >= config.maxItems - 1 && currentLoanCount < config.maxItems) {
            warnings.push('คุณมีรายการยืมใกล้ถึงขีดจำกัด')
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        }
    }

    return {
        validateDates,
        isLoading: configLoading || loansLoading,
        config,
        currentLoanCount,
        activeLoans
    }
}
