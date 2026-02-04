import './globals.css'
import type { Metadata } from 'next'
import { Kanit, Mali } from 'next/font/google'

const kanit = Kanit({
    subsets: ['thai', 'latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-kanit',
    display: 'swap'
})

const mali = Mali({
    subsets: ['thai', 'latin'],
    weight: ['400', '500', '600'],
    variable: '--font-mali',
    display: 'swap'
})

export const metadata: Metadata = {
    title: 'ระบบยืม-คืนพัสดุและครุภัณฑ์ คณะวิทยาการจัดการ มรภ.ลำปาง',
    description: 'ระบบยืม-คืนพัสดุและครุภัณฑ์ คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง',
    icons: {
        icon: '/favicon.svg',
    },
}

import SupportButton from '@/components/chat/SupportButton'
import QueryProvider from '@/components/providers/QueryProvider'
import AuthGuard from '@/components/auth/AuthGuard'
import DebugConsole from '@/components/debug/DebugConsole'
import ErrorBoundary from '@/components/error/ErrorBoundary'
import { ThemeProvider } from '@/components/providers/ThemeContext'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="th" suppressHydrationWarning>
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
                </ThemeProvider>
            </body>
        </html>
    )
}
