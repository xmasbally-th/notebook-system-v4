import './globals.css'
import type { Metadata } from 'next'
import { Kanit, Mali } from 'next/font/google'

const kanit = Kanit({
    subsets: ['thai', 'latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-kanit',
    display: 'swap',
    adjustFontFallback: true, // P8: auto-generate size-adjust to reduce CLS
})

const mali = Mali({
    subsets: ['thai', 'latin'],
    weight: ['400', '500', '600'],
    variable: '--font-mali',
    display: 'swap',
    adjustFontFallback: true, // P8: auto-generate size-adjust to reduce CLS
})

export const metadata: Metadata = {
    title: 'ระบบยืม-คืนพัสดุและครุภัณฑ์ คณะวิทยาการจัดการ มรภ.ลำปาง',
    description: 'ระบบยืม-คืนพัสดุและครุภัณฑ์ คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง',
    icons: {
        icon: '/favicon.svg',
    },
}

// P4: Lazy loaded via client component wrapper (ssr:false requires Client Component in Next.js 16)
import { SupportButton, DebugConsole } from '@/components/providers/LazyComponents'

import QueryProvider from '@/components/providers/QueryProvider'
import AuthGuard from '@/components/auth/AuthGuard'
import ErrorBoundary from '@/components/error/ErrorBoundary'
import { ThemeProvider } from '@/components/providers/ThemeContext'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// P1: Inline script to set theme BEFORE first paint — prevents flash & allows FCP without waiting for hydration
const themeScript = `
try {
    var t = localStorage.getItem('notebook-system-theme');
    if (t === 'classic' || t === 'playful') {
        document.documentElement.setAttribute('data-theme', t);
    }
} catch(e) {}
`

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="th" suppressHydrationWarning>
            <head>
                {/* P6: Preconnect to Supabase to reduce TTFB for API calls */}
                <link rel="preconnect" href="https://kdqcypgmpogoekgklzun.supabase.co" />
                <link rel="dns-prefetch" href="https://kdqcypgmpogoekgklzun.supabase.co" />
                {/* P1: Set theme before paint to prevent flash */}
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className={`${kanit.variable} ${mali.variable} font-body antialiased`}>
                <ThemeProvider>
                    <ErrorBoundary>
                        <QueryProvider>
                            <AuthGuard>
                                {children}
                                <SupportButton />
                            </AuthGuard>
                        </QueryProvider>
                    </ErrorBoundary>
                    <DebugConsole />
                    <Analytics />
                    <SpeedInsights />
                </ThemeProvider>
            </body>
        </html>
    )
}
