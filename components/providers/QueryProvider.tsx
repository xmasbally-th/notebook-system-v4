'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ToastProvider } from '@/components/ui/toast'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,          // 1 minute — realtime handles live updates
                gcTime: 5 * 60 * 1000,         // 5 minutes cache retention
                retry: 1,                       // 1 retry only (faster error surfacing)
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                refetchOnWindowFocus: false,    // realtime subscriptions handle updates
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                {children}
            </ToastProvider>
        </QueryClientProvider>
    )
}

