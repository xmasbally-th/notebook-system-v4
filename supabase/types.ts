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
                    role: 'admin' | 'staff' | 'user'
                    status: 'pending' | 'approved' | 'rejected'
                    user_type: 'student' | 'lecturer' | 'staff' | null
                    department_id: string | null
                    phone_number: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    title?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    role?: 'admin' | 'staff' | 'user'
                    status?: 'pending' | 'approved' | 'rejected'
                    user_type?: 'student' | 'lecturer' | 'staff' | null
                    department_id?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    title?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    role?: 'admin' | 'staff' | 'user'
                    status?: 'pending' | 'approved' | 'rejected'
                    user_type?: 'student' | 'lecturer' | 'staff' | null
                    department_id?: string | null
                    phone_number?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            equipment_types: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    icon: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    icon?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    icon?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            equipment: {
                Row: {
                    id: string
                    equipment_number: string
                    name: string
                    brand: string | null
                    model: string | null
                    equipment_type_id: string | null
                    status: 'ready' | 'borrowed' | 'maintenance' | 'retired'
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
                    brand?: string | null
                    model?: string | null
                    equipment_type_id?: string | null
                    status?: 'ready' | 'borrowed' | 'maintenance' | 'retired'
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
                    brand?: string | null
                    model?: string | null
                    equipment_type_id?: string | null
                    status?: 'ready' | 'borrowed' | 'maintenance' | 'retired'
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
                    return_time: string | null
                    returned_at: string | null
                    return_condition: string | null
                    return_notes: string | null
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
                    return_time?: string | null
                    returned_at?: string | null
                    return_condition?: string | null
                    return_notes?: string | null
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
                    return_time?: string | null
                    returned_at?: string | null
                    return_condition?: string | null
                    return_notes?: string | null
                    status?: 'pending' | 'approved' | 'rejected' | 'returned'
                    created_at?: string
                    updated_at?: string
                }
            }
            reservations: {
                Row: {
                    id: string
                    user_id: string
                    equipment_id: string
                    start_date: string
                    end_date: string
                    status: 'pending' | 'approved' | 'ready' | 'completed' | 'rejected' | 'cancelled' | 'expired'
                    rejection_reason: string | null
                    loan_id: string | null
                    created_at: string
                    updated_at: string
                    approved_at: string | null
                    approved_by: string | null
                    ready_at: string | null
                    ready_by: string | null
                    completed_at: string | null
                    completed_by: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    equipment_id: string
                    start_date: string
                    end_date: string
                    status?: 'pending' | 'approved' | 'ready' | 'completed' | 'rejected' | 'cancelled' | 'expired'
                    rejection_reason?: string | null
                    loan_id?: string | null
                    created_at?: string
                    updated_at?: string
                    approved_at?: string | null
                    approved_by?: string | null
                    ready_at?: string | null
                    ready_by?: string | null
                    completed_at?: string | null
                    completed_by?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    equipment_id?: string
                    start_date?: string
                    end_date?: string
                    status?: 'pending' | 'approved' | 'ready' | 'completed' | 'rejected' | 'cancelled' | 'expired'
                    rejection_reason?: string | null
                    loan_id?: string | null
                    created_at?: string
                    updated_at?: string
                    approved_at?: string | null
                    approved_by?: string | null
                    ready_at?: string | null
                    ready_by?: string | null
                    completed_at?: string | null
                    completed_by?: string | null
                }
            }
            support_tickets: {
                Row: {
                    id: string
                    user_id: string
                    status: 'open' | 'closed'
                    subject: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    status?: 'open' | 'closed'
                    subject?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    status?: 'open' | 'closed'
                    subject?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            support_messages: {
                Row: {
                    id: string
                    ticket_id: string
                    sender_id: string | null
                    message: string
                    is_staff_reply: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    ticket_id: string
                    sender_id?: string | null
                    message: string
                    is_staff_reply?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    ticket_id?: string
                    sender_id?: string | null
                    message?: string
                    is_staff_reply?: boolean
                    created_at?: string
                }
            }
            staff_activity_log: {
                Row: {
                    id: string
                    staff_id: string
                    staff_role: string
                    action_type: string
                    target_type: string
                    target_id: string
                    target_user_id: string | null
                    is_self_action: boolean
                    details: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    staff_id: string
                    staff_role: string
                    action_type: string
                    target_type: string
                    target_id: string
                    target_user_id?: string | null
                    is_self_action?: boolean
                    details?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    staff_id?: string
                    staff_role?: string
                    action_type?: string
                    target_type?: string
                    target_id?: string
                    target_user_id?: string | null
                    is_self_action?: boolean
                    details?: Json
                    created_at?: string
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
                    discord_webhook_auth: string | null
                    discord_webhook_reservations: string | null
                    discord_webhook_maintenance: string | null
                    announcement_message: string | null
                    announcement_active: boolean
                    document_logo_url: string | null
                    document_template_url: string | null
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
                    discord_webhook_auth?: string | null
                    discord_webhook_reservations?: string | null
                    discord_webhook_maintenance?: string | null
                    announcement_message?: string | null
                    announcement_active?: boolean
                    document_logo_url?: string | null
                    document_template_url?: string | null
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
                    discord_webhook_auth?: string | null
                    discord_webhook_reservations?: string | null
                    discord_webhook_maintenance?: string | null
                    announcement_message?: string | null
                    announcement_active?: boolean
                    document_logo_url?: string | null
                    document_template_url?: string | null
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
