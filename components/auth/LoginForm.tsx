'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { Laptop, Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Get Supabase client for auth operations
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) return null
    return createBrowserClient(url, key)
}

// Detect if running inside an in-app browser (LINE, Facebook, Instagram, etc.)
function detectInAppBrowser(): { isInApp: boolean; appName: string } {
    if (typeof window === 'undefined') return { isInApp: false, appName: '' }
    const ua = navigator.userAgent || ''
    if (/Line\//i.test(ua))       return { isInApp: true, appName: 'LINE' }
    if (/FBAN|FBAV/i.test(ua))    return { isInApp: true, appName: 'Facebook' }
    if (/Instagram/i.test(ua))    return { isInApp: true, appName: 'Instagram' }
    if (/Twitter/i.test(ua))      return { isInApp: true, appName: 'Twitter' }
    if (/wv\)/i.test(ua) && /Android/i.test(ua)) return { isInApp: true, appName: 'แอปอื่น' }
    return { isInApp: false, appName: '' }
}

interface LoginFormProps {
    logoUrl: string | null
}

export default function LoginForm({ logoUrl }: LoginFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [inAppInfo, setInAppInfo] = useState<{ isInApp: boolean; appName: string }>({ isInApp: false, appName: '' })
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setInAppInfo(detectInAppBrowser())
    }, [])

    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

    const handleCopyLink = () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    // Handle OAuth Login (Google)
    const handleGoogleLogin = async () => {
        const client = getSupabaseClient()
        if (!client) {
            setError('ไม่สามารถเชื่อมต่อระบบได้')
            return
        }

        try {
            setLoading(true)
            setError(null)
            const { error } = await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Left Side - Branding */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-400 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
                    {logoUrl ? (
                        <div className="w-24 h-24 relative mb-6 bg-white/10 rounded-2xl backdrop-blur-sm p-2">
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm mb-6">
                            <Laptop className="w-16 h-16 text-white" aria-hidden="true" />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-white mb-4">
                        ระบบยืม-คืน<span className="text-orange-400">พัสดุและครุภัณฑ์</span>
                    </h1>
                    <p className="text-blue-100 text-lg max-w-sm">
                        คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง
                    </p>

                    <div className="mt-12 flex gap-4">
                        <div className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm">
                            <span className="font-bold text-2xl text-orange-400">100+</span><br />
                            อุปกรณ์พร้อมใช้
                        </div>
                        <div className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm">
                            <span className="font-bold text-2xl text-green-400">24/7</span><br />
                            ระบบออนไลน์
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-gray-50">
                {/* Mobile Logo */}
                <div className="md:hidden flex items-center gap-3 mb-8">
                    {logoUrl ? (
                        <div className="w-10 h-10 relative">
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Laptop className="w-6 h-6 text-white" aria-hidden="true" />
                        </div>
                    )}
                    <span className="text-lg font-bold text-gray-900">ระบบยืม-คืนพัสดุฯ</span>
                </div>

                <div className="w-full max-w-md">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                เข้าสู่ระบบ
                            </h2>
                            <p className="text-gray-500 text-sm">
                                เข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัย
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Google Auth Button / In-App Browser Warning */}
                        {inAppInfo.isInApp ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800 mb-1">
                                            ไม่สามารถเข้าสู่ระบบผ่าน {inAppInfo.appName} ได้
                                        </p>
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            Google ไม่อนุญาตให้เข้าสู่ระบบผ่านเบราว์เซอร์ภายในแอป
                                            กรุณาเปิดลิงก์นี้ด้วยเบราว์เซอร์ภายนอก เช่น Chrome หรือ Safari
                                        </p>
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 font-medium">วิธีเปิดในเบราว์เซอร์ภายนอก:</div>
                                <div className="space-y-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                                        <span>กด &quot;คัดลอกลิงก์&quot; ด้านล่าง</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                                        <span>เปิดแอป Chrome หรือ Safari แล้ววางลิงก์ในช่องที่อยู่</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                                        <span>กด &quot;เข้าสู่ระบบด้วย Google&quot; อีกครั้ง</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCopyLink}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    {copied ? '✓ คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์เพื่อเปิดในเบราว์เซอร์'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
                            </button>
                        )}

                        <div className="mt-6 text-center">
                            <Link
                                href="/"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                ← กลับหน้าหลัก
                            </Link>
                        </div>
                    </div>


                    <p className="mt-6 text-center text-xs text-gray-400">
                        เมื่อเข้าสู่ระบบ แสดงว่าคุณยอมรับ<br />
                        <span className="text-blue-600 hover:underline cursor-pointer">เงื่อนไขการใช้งาน</span> และ{' '}
                        <span className="text-blue-600 hover:underline cursor-pointer">นโยบายความเป็นส่วนตัว</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
