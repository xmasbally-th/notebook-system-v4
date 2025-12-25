import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Equipment Lending System V4',
    description: 'Manage equipment lending and reservations',
}

import QueryProvider from '@/components/providers/QueryProvider'
import AuthGuard from '@/components/auth/AuthGuard'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <QueryProvider>
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </QueryProvider>
            </body>
        </html>
    )
}
