import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/supabase/types'

// Read env vars at module level
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Log env vars status for debugging 
if (typeof window !== 'undefined') {
    console.log('Supabase client init:', {
        urlSet: !!SUPABASE_URL,
        keySet: !!SUPABASE_ANON_KEY
    })
}

// Create client only if env vars are available
function createClient() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables are not configured')
        return null
    }
    return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// Singleton instance
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Export a proxy that handles the case when client is not available
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
    get(_, prop) {
        // Create instance on first access
        if (!supabaseInstance) {
            supabaseInstance = createClient()
        }

        // If still no instance, return a mock that handles common methods
        if (!supabaseInstance) {
            // Return mock functions that return error states
            if (prop === 'from') {
                return () => ({
                    select: () => ({
                        order: () => ({
                            eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                        }),
                        eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                        single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                    }),
                    insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                    update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
                    delete: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }),
                })
            }
            if (prop === 'auth') {
                return {
                    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
                    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                    signOut: () => Promise.resolve({ error: null }),
                    signInWithOAuth: () => Promise.resolve({ data: { url: '/login' }, error: null }),
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                }
            }
            if (prop === 'storage') {
                return {
                    from: () => ({
                        upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                        getPublicUrl: () => ({ data: { publicUrl: '' } }),
                        remove: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
                    }),
                }
            }
            return undefined
        }

        return (supabaseInstance as any)[prop]
    }
})
