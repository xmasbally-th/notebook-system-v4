import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

// Create a function that returns the client
// This defers execution until runtime when env vars are available
function createSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a dummy client during build time
        // This will be replaced with real client at runtime
        console.warn('Supabase env vars not available during build')
        return null as any
    }

    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Lazy initialization
let _supabase: ReturnType<typeof createBrowserClient<Database>> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
    get(_, prop) {
        if (!_supabase) {
            _supabase = createSupabaseClient()
        }
        if (!_supabase) {
            throw new Error('Supabase client not initialized. Check environment variables.')
        }
        return (_supabase as any)[prop]
    }
})
