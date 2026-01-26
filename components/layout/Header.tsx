'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Laptop, LogIn, LogOut, User, Menu, X, Package, Monitor, HelpCircle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import UserNotificationBell from '@/components/ui/UserNotificationBell'
import { useSystemConfig } from '@/hooks/useSystemConfig'

// Get Supabase client for auth operations
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

export default function Header() {
    const [user, setUser] = useState<any>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const router = useRouter()
    const { data: systemConfig } = useSystemConfig()

    useEffect(() => {
        const checkUser = async () => {
            const client = getSupabaseClient()
            if (!client) return
            const { data: { session } } = await client.auth.getSession()
            setUser(session?.user || null)
            setAccessToken(session?.access_token || null)
        }
        checkUser()
    }, [])

    const handleSignOut = async () => {
        const client = getSupabaseClient()
        if (client) {
            await client.auth.signOut()
        }
        setUser(null)
        setIsMenuOpen(false)
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                                <Laptop className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 leading-tight">ระบบยืม-คืนพัสดุฯ</span>
                            <span className="text-[10px] text-gray-500 font-medium">คณะวิทยาการจัดการ มรภ.ลำปาง</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <UserNotificationBell userId={user.id} accessToken={accessToken || undefined} />
                                <Link
                                    href="/equipment"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Monitor className="w-4 h-4" />
                                    อุปกรณ์
                                </Link>
                                <Link
                                    href="/my-loans"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Package className="w-4 h-4" />
                                    การยืมและจอง
                                </Link>
                                <Link
                                    href="/user-guide"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <HelpCircle className="w-4 h-4" />
                                    คู่มือ
                                </Link>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900 z-50 relative"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-white z-40 md:hidden pt-20 px-4 animate-in slide-in-from-top-10 fade-in duration-200">
                    <div className="flex flex-col gap-4">
                        {user ? (
                            <>
                                <div className="py-4 border-b border-gray-100">
                                    <p className="text-sm text-gray-500 mb-1">Signed in as</p>
                                    <p className="font-medium text-gray-900 truncate">{user.email}</p>
                                </div>
                                <Link
                                    href="/equipment"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-900 font-medium"
                                >
                                    <Monitor className="w-5 h-5" />
                                    อุปกรณ์
                                </Link>
                                <Link
                                    href="/my-loans"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium"
                                >
                                    <Package className="w-5 h-5" />
                                    การยืมและจอง
                                </Link>
                                <Link
                                    href="/user-guide"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium"
                                >
                                    <HelpCircle className="w-5 h-5" />
                                    คู่มือการใช้งาน
                                </Link>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-900 font-medium"
                                >
                                    <User className="w-5 h-5" />
                                    โปรไฟล์
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-600 font-medium w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" />
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
                                    <LogIn className="w-5 h-5" />
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
        </header>
    )
}
