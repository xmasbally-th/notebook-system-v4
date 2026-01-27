import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
                <QueryProvider>
                    <AuthGuard>
                        {children}
                        <SupportButton />
                    </AuthGuard>
                </QueryProvider>
            </body>
        </html>
    )
}
