export type TabType = 'completed' | 'pending'
export type PendingFilter = 'mandatory' | 'all'
export type RatingFilter = 'all' | 'high' | 'medium' | 'low'
export type ViewMode = 'cards' | 'table'

export interface ProfileInfo {
    id?: string
    first_name?: string
    last_name?: string
    email?: string
    avatar_url?: string
    user_type?: string
    phone_number?: string
    user_id?: string // Student or staff code
}

export interface EquipmentInfo {
    id?: string
    name: string
    equipment_number: string
}

export interface EvaluationDetails {
    system_overall?: number
    service_speed?: number
    service_staff?: number
    equipment_quality?: number
    overall_satisfaction?: number
    [key: string]: any
}

export interface EvaluationItem {
    id: string
    loan_id: string
    user_id: string
    rating: number
    details?: EvaluationDetails
    suggestions?: string | null
    created_at: string
    profiles?: ProfileInfo
    loanRequests?: {
        id: string
        equipment?: EquipmentInfo
    }
}

export interface PendingLoan {
    id: string
    created_at: string
    updated_at: string
    start_date: string
    end_date: string
    return_time?: string
    profiles?: ProfileInfo
    equipment?: EquipmentInfo
    evaluations?: { id: string }[]
}

export interface SectionAverageStats {
    sum: number
    count: number
}

export interface EvaluationStats {
    avg: number
    total: number
    comments: number
    sectionAvgs: Record<string, SectionAverageStats>
}

export interface DateRange {
    start: string
    end: string
}
