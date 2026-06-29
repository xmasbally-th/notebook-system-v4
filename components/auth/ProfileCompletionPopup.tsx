'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { AlertCircle, ArrowRight } from 'lucide-react'

export default function ProfileCompletionPopup() {
    const pathname = usePathname()
    const router = useRouter()
    
    // We only need the userId if it's not the current user, but useProfile without args uses current session
    const { data: profile, isLoading } = useProfile()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || isLoading || !profile) return null

    // We only force this on approved users
    if (profile.status !== 'approved') return null

    const isProfileComplete = !!(
        profile.first_name &&
        profile.last_name &&
        profile.phone_number &&
        profile.title &&
        profile.user_type &&
        profile.department_id &&
        profile.user_id
    )

    if (isProfileComplete) return null

    // Don't show popup if they are already on the setup pages
    if (
        pathname === '/register/complete-profile' || 
        pathname === '/profile/setup' || 
        pathname === '/profile'
    ) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                <div className="bg-orange-500 p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">ข้อมูลโปรไฟล์ไม่สมบูรณ์</h2>
                    <p className="text-orange-100 text-sm">
                        กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วนเพื่อดำเนินการต่อ
                    </p>
                </div>
                
                <div className="p-6">
                    <p className="text-gray-600 dark:text-slate-400 text-center mb-6">
                        ระบบตรวจพบว่าข้อมูลโปรไฟล์ของคุณขาดหายไปบางส่วน (เช่น คำนำหน้า, ประเภทผู้ใช้, หน่วยงาน หรือรหัสประจำตัว) ซึ่งจำเป็นต่อการใช้งานระบบยืม-คืนอุปกรณ์
                    </p>
                    
                    <button
                        onClick={() => router.push('/register/complete-profile')}
                        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                    >
                        ไปหน้ากรอกข้อมูล
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
