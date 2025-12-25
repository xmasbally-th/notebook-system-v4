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
                    first_name: string | null
                    last_name: string | null
                    role: 'admin' | 'user'
                    status: 'pending' | 'approved' | 'rejected'
                    department: Json | null
                    phone_number: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    role?: 'admin' | 'user'
                    status?: 'pending' | 'approved' | 'rejected'
                    department?: Json | null
                    phone_number?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    role?: 'admin' | 'user'
                    status?: 'pending' | 'approved' | 'rejected'
                    department?: Json | null
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
        }
    }
}
