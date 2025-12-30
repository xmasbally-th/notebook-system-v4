export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    title: string | null
                    first_name: string | null
                    last_name: string | null
                    role: 'admin' | 'user'
                    status: 'pending' | 'approved' | 'rejected'
                    user_type: 'student' | 'lecturer' | 'staff' | null
                    department: Json | null
                    department_id: string | null
                    phone_number: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    title?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    role?: 'admin' | 'user'
                    status?: 'pending' | 'approved' | 'rejected'
                    user_type?: 'student' | 'lecturer' | 'staff' | null
                    department?: Json | null
                    department_id?: string | null
                    phone_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    title?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    role?: 'admin' | 'user'
                    status?: 'pending' | 'approved' | 'rejected'
                    user_type?: 'student' | 'lecturer' | 'staff' | null
                    department?: Json | null
                    department_id?: string | null
                    phone_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            equipment: {
                Row: {
                    id: string
                    equipment_number: string
                    name: string
                    status: 'active' | 'maintenance' | 'retired' | 'lost'
                    category: Json | null
                    images: Json
                    search_keywords: string[]
                    location: Json | null
                    specifications: Json | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    equipment_number: string
                    name: string
                    status?: 'active' | 'maintenance' | 'retired' | 'lost'
                    category?: Json | null
                    images?: Json
                    search_keywords?: string[]
                    location?: Json | null
                    specifications?: Json | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    equipment_number?: string
                    name?: string
                    status?: 'active' | 'maintenance' | 'retired' | 'lost'
                    category?: Json | null
                    images?: Json
                    search_keywords?: string[]
                    location?: Json | null
                    specifications?: Json | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            loanRequests: {
                Row: {
                    id: string
                    user_id: string
                    equipment_id: string
                    start_date: string
                    end_date: string
                    reason: string | null
                    status: 'pending' | 'approved' | 'rejected' | 'returned'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    equipment_id: string
                    start_date: string
                    end_date: string
                    reason?: string | null
                    status?: 'pending' | 'approved' | 'rejected' | 'returned'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    equipment_id?: string
                    start_date?: string
                    end_date?: string
                    reason?: string | null
                    status?: 'pending' | 'approved' | 'rejected' | 'returned'
                    created_at?: string
                    updated_at?: string
                }
            }
            system_config: {
                Row: {
                    id: number
                    max_loan_days: number
                    max_items_per_user: number
                    opening_time: string | null
                    closing_time: string | null
                    break_start_time: string | null
                    break_end_time: string | null
                    closed_days: Json | null
                    closed_dates: Json | null
                    loan_limits_by_type: Json | null
                    is_loan_system_active: boolean
                    is_reservation_active: boolean
                    discord_webhook_url: string | null
                    announcement_message: string | null
                    announcement_active: boolean
                    updated_at: string
                }
                Insert: {
                    id?: number
                    max_loan_days?: number
                    max_items_per_user?: number
                    opening_time?: string | null
                    closing_time?: string | null
                    break_start_time?: string | null
                    break_end_time?: string | null
                    closed_days?: Json | null
                    closed_dates?: Json | null
                    loan_limits_by_type?: Json | null
                    is_loan_system_active?: boolean
                    is_reservation_active?: boolean
                    discord_webhook_url?: string | null
                    announcement_message?: string | null
                    announcement_active?: boolean
                    updated_at?: string
                }
                Update: {
                    id?: number
                    max_loan_days?: number
                    max_items_per_user?: number
                    opening_time?: string | null
                    closing_time?: string | null
                    break_start_time?: string | null
                    break_end_time?: string | null
                    closed_days?: Json | null
                    closed_dates?: Json | null
                    loan_limits_by_type?: Json | null
                    is_loan_system_active?: boolean
                    is_reservation_active?: boolean
                    discord_webhook_url?: string | null
                    announcement_message?: string | null
                    announcement_active?: boolean
                    updated_at?: string
                }
            }
        }
        Functions: {
            check_reservation_conflict: {
                Args: {
                    target_equipment_id: string
                    new_start_date: string
                    new_end_date: string
                }
                Returns: boolean
            }
        }
    }
}
