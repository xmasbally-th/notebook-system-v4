'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Clock, CheckCircle2, Mail, Phone, LogOut, Laptop, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/components/ui/toast'
import { useSystemConfig } from '@/hooks/useSystemConfig'
import { getSupabaseBrowserClient, getSupabaseCredentials } from '@/lib/supabase-helpers'

// Use singleton client
function getSupabaseClient() {
    return getSupabaseBrowserClient()
}

// Faster polling interval (15 seconds)
const POLL_INTERVAL = 15000

export default function PendingApprovalPage() {
    const router = useRouter()
    const toast = useToast()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [loggingOut, setLoggingOut] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const previousStatusRef = useRef<string | null>(null)
    const { data: systemConfig } = useSystemConfig()

    // Check auth and profile status
    useEffect(() => {
        const checkStatus = async () => {
            setIsChecking(true)
            const client = getSupabaseClient()
            const { url, key } = getSupabaseCredentials()

            try {
                if (!client) {
                    router.replace('/login')
                    return
                }

                const { data: { user } } = await client.auth.getUser()

                if (!user) {
                    router.replace('/login')
                    return
                }

                // Get profile using direct fetch
                const response = await fetch(
                    `${url}/rest/v1/profiles?id=eq.${user.id}&select=*,departments(name)`,
                    {
                        headers: {
                            'apikey': key,
                            'Authorization': `Bearer ${key}`
                        }
                    }
                )
                const data = await response.json()
                const profileData = data?.[0]

                if (!profileData) {
                    router.replace('/register/complete-profile')
                    return
                }

                // Check if status changed
                if (previousStatusRef.current &&
                    previousStatusRef.current !== profileData.status) {
                    if (profileData.status === 'approved') {
                        toast.success('🎉 บัญชีของคุณได้รับการอนุมัติแล้ว!')
                    } else if (profileData.status === 'rejected' &&
                        previousStatusRef.current === 'pending') {
                        toast.error('บัญชีของคุณถูกปฏิเสธ กรุณาติดต่อเจ้าหน้าที่')
                    }
                }
                previousStatusRef.current = profileData.status

                // If already approved, redirect to home
                if (profileData.status === 'approved') {
                    setTimeout(() => {
                        router.replace('/')
                    }, 1500) // Delay to show toast
                    return
                }

                // If rejected, could show different page (for now just show status)
                setProfile(profileData)
                setLoading(false)
            } finally {
                setIsChecking(false)
            }
        }

        checkStatus()

        // Set up auto-refresh with faster interval
        const interval = setInterval(checkStatus, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [router, toast])

    const handleLogout = async () => {
        setLoggingOut(true)
        const client = getSupabaseClient()
        if (client) {
            await client.auth.signOut()
        }
        router.replace('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-500">กำลังตรวจสอบสถานะ...</p>
                </div>
            </div>
        )
    }

    const isRejected = profile?.status === 'rejected'

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
                    {systemConfig?.document_logo_url ? (
                        <div className="w-24 h-24 relative mb-6 bg-white/10 rounded-2xl backdrop-blur-sm p-2">
                            <Image
                                src={systemConfig.document_logo_url}
                                alt="Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm mb-6">
                            <Laptop className="w-16 h-16 text-white" />
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

            {/* Right Side - Status Content */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-gray-50">
                {/* Mobile Logo */}
                <div className="md:hidden flex items-center gap-3 mb-8">
                    {systemConfig?.document_logo_url ? (
                        <div className="w-10 h-10 relative">
                            <Image
                                src={systemConfig.document_logo_url}
                                alt="Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Laptop className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <span className="text-lg font-bold text-gray-900">ระบบยืม-คืนพัสดุฯ</span>
                </div>

                <div className="w-full max-w-md">
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        {/* Status Icon */}
                        <div className="flex justify-center mb-6">
                            {isRejected ? (
                                <div className="p-4 bg-red-100 rounded-full">
                                    <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-100 rounded-full animate-pulse">
                                    <Clock className="w-12 h-12 text-amber-600" />
                                </div>
                            )}
                        </div>

                        {/* Status Title & Description */}
                        <div className="text-center mb-8">
                            {isRejected ? (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        บัญชีถูกปฏิเสธ
                                    </h2>
                                    <p className="text-gray-500">
                                        บัญชีของคุณถูกปฏิเสธการเข้าใช้งาน<br />
                                        กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามข้อมูลเพิ่มเติม
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        รอการอนุมัติ
                                    </h2>
                                    <p className="text-gray-500">
                                        การลงทะเบียนของคุณสำเร็จแล้ว!<br />
                                        กรุณารอการอนุมัติจากเจ้าหน้าที่
                                    </p>
                                </>
                            )}
                        </div>

                        {/* User Info Card */}
                        {profile && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <h3 className="text-sm font-medium text-gray-500 mb-3">ข้อมูลที่ลงทะเบียน</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="font-medium">
                                            {profile.title} {profile.first_name} {profile.last_name}
                                        </span>
                                    </div>
                                    {profile.email && (
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <Mail className="w-4 h-4" />
                                            <span>{profile.email}</span>
                                        </div>
                                    )}
                                    {profile.phone_number && (
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <Phone className="w-4 h-4" />
                                            <span>{profile.phone_number}</span>
                                        </div>
                                    )}
                                    {profile.departments?.name && (
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span>{profile.departments.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Badge */}
                        {!isRejected && (
                            <div className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-75"></span>
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-150"></span>
                                </div>
                                <span className="text-amber-700 font-medium text-sm">
                                    กำลังรอการอนุมัติจากเจ้าหน้าที่
                                </span>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                            <h4 className="font-medium text-blue-800 mb-2">📌 ข้อมูลสำคัญ</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• เจ้าหน้าที่จะตรวจสอบข้อมูลของคุณโดยเร็วที่สุด</li>
                                <li>• คุณจะได้รับการแจ้งเตือนทางอีเมลเมื่อได้รับการอนุมัติ</li>
                                <li>• หน้านี้จะรีเฟรชอัตโนมัติทุก 15 วินาที</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                ตรวจสอบสถานะอีกครั้ง
                            </button>

                            <button
                                onClick={handleLogout}
                                disabled={loggingOut}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 font-medium rounded-xl transition-all disabled:opacity-50"
                            >
                                {loggingOut ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <LogOut className="w-5 h-5" />
                                )}
                                {loggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                            </button>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            มีปัญหา? ติดต่อเจ้าหน้าที่ที่<br />
                            <a href="mailto:support@lpru.ac.th" className="text-blue-600 hover:underline">
                                support@lpru.ac.th
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
