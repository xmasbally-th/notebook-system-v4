'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Laptop, LogIn, LogOut, User, Menu, X, Package, Monitor, HelpCircle, Camera } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import UserNotificationBell from '@/components/ui/UserNotificationBell'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import ThemeToggle from '@/components/ThemeToggle'
import { extractEquipmentIdentifier } from '@/lib/qr-scan-resolver'
import { getSupabaseBrowserClient } from '@/lib/supabase-helpers'

const QrScannerModal = dynamic(
    () => import('@/components/scanner/QrScannerModal'),
    { ssr: false }
)

export default function Header() {
    const [user, setUser] = useState<any>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [, startTransition] = useTransition()
    const router = useRouter()
    const { data: systemConfig } = useSystemConfig()

    const handleScanSuccess = (decodedText: string) => {
        const target = extractEquipmentIdentifier(decodedText)
        if (target) {
            router.push(`/eq/${encodeURIComponent(target)}`)
        } else {
            setIsScannerOpen(false)
        }
    }

    useEffect(() => {
        const checkUser = async () => {
            const client = getSupabaseBrowserClient()
            if (!client) return
            const { data: { session } } = await client.auth.getSession()
            setUser(session?.user || null)
            setAccessToken(session?.access_token || null)
        }
        checkUser()
    }, [])

    const handleSignOut = async () => {
        const client = getSupabaseBrowserClient()
        if (client) {
            await client.auth.signOut()
        }
        setUser(null)
        setIsMenuOpen(false)
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo & Brand */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity z-50 relative">
                        {systemConfig?.document_logo_url ? (
                            <div className="w-10 h-10 relative flex-shrink-0">
                                <Image
                                    src={systemConfig.document_logo_url}
                                    alt="Logo"
                                    fill
                                    className="object-contain"
                                    />
                            </div>
                        ) : (
                            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                                <Laptop className="w-6 h-6 text-white" aria-hidden="true" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">ระบบยืม-คืนพัสดุฯ</span>
                            <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">คณะวิทยาการจัดการ มรภ.ลำปาง</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <ThemeToggle />
                        {user ? (
                            <div className="flex items-center gap-3">
                                <UserNotificationBell userId={user.id} accessToken={accessToken || undefined} />
                                <Link
                                    href="/equipment"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    <Monitor className="w-4 h-4" aria-hidden="true" />
                                    อุปกรณ์
                                </Link>
                                <Link
                                    href="/my-loans"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    <Package className="w-4 h-4" aria-hidden="true" />
                                    การยืมและจอง
                                </Link>
                                <Link
                                    href="/user-guide"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    <HelpCircle className="w-4 h-4" aria-hidden="true" />
                                    คู่มือ
                                </Link>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    <User className="w-4 h-4" aria-hidden="true" />
                                    Profile
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setIsScannerOpen(true)}
                                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition-all shadow-2xs cursor-pointer"
                                    title="สแกน QR Code บนตัวเครื่องเพื่อยืมทันที"
                                >
                                    <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>สแกน QR ยืมเครื่อง</span>
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" aria-hidden="true" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                            >
                                <LogIn className="w-4 h-4" aria-hidden="true" />
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Top Actions: QR Scanner & Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                            aria-label="สแกน QR Code ยืมเครื่อง"
                        >
                            <Camera className="w-4 h-4" />
                            <span>สแกน QR</span>
                        </button>
                        <button
                            className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white z-50 relative"
                            onClick={() => startTransition(() => setIsMenuOpen(!isMenuOpen))}
                            aria-label={isMenuOpen ? "ปิดเมนู" : "เปิดเมนู"}
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-white dark:bg-slate-950 z-40 md:hidden pt-20 px-4 animate-in slide-in-from-top-10 fade-in duration-200">
                    <div className="flex flex-col gap-4">
                        {/* Theme Toggle for Mobile */}
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800">
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">สลับธีมมืด/สว่าง</span>
                            <ThemeToggle showLabel />
                        </div>
                        {user ? (
                            <>
                                <div className="py-4 border-b border-gray-100 dark:border-slate-800 space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Signed in as</p>
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false)
                                            setIsScannerOpen(true)
                                        }}
                                        className="flex items-center justify-center gap-2.5 w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all text-sm cursor-pointer"
                                    >
                                        <Camera className="w-5 h-5" />
                                        <span>สแกน QR Code เพื่อยืมทันที</span>
                                    </button>
                                </div>
                                <Link
                                    href="/equipment"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/45 text-blue-900 dark:text-blue-200 font-medium"
                                >
                                    <Monitor className="w-5 h-5" aria-hidden="true" />
                                    อุปกรณ์
                                </Link>
                                <Link
                                    href="/my-loans"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-medium"
                                >
                                    <Package className="w-5 h-5" aria-hidden="true" />
                                    การยืมและจอง
                                </Link>
                                <Link
                                    href="/user-guide"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-medium"
                                >
                                    <HelpCircle className="w-5 h-5" aria-hidden="true" />
                                    คู่มือการใช้งาน
                                </Link>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-medium"
                                >
                                    <User className="w-5 h-5" aria-hidden="true" />
                                    โปรไฟล์
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-medium w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" aria-hidden="true" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="py-4 text-center">
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 w-full p-3 bg-blue-600 text-white rounded-xl font-medium shadow-sm active:scale-95 transition-transform"
                                >
                                    <LogIn className="w-5 h-5" aria-hidden="true" />
                                    Sign In with Google
                                </Link>
                                <p className="mt-4 text-sm text-gray-500">
                                    Please sign in with your university account to continue.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* In-app QR Scanner Modal for Users */}
            {isScannerOpen && (
                <QrScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={handleScanSuccess}
                    title="สแกน QR Code บนตัวเครื่อง"
                    subtitle="ส่องกล้องไปที่สติกเกอร์ QR Code บนเครื่องโน้ตบุ๊คเพื่อปลดล็อกการยืมทันที"
                />
            )}
        </header>
    )
}
