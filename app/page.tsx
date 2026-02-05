import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RulesSection from '@/components/home/RulesSection'
import HoursSection from '@/components/home/HoursSection'
import { createClient } from '@/lib/supabase/server'
import { redirect, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Laptop, Tablet, Headphones, Monitor, ArrowRight, LogIn, Package, Search, Clock, AlertCircle } from 'lucide-react'
import ActiveEvaluationPrompt from '@/components/evaluations/ActiveEvaluationPrompt'
import { useSystemConfig } from '@/hooks/useSystemConfig'

// Client component for System Status
function SystemStatusBadge() {
    'use client'
    const { data: config, isLoading } = useSystemConfig()

    if (isLoading) return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-4 animate-pulse">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            กำลังตรวจสอบสถานะ...
        </div>
    )

    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

    const isClosedDay = (config?.closed_days as string[])?.includes(currentDay)
    const isBeforeOpen = currentTime < (config?.opening_time || '08:30')
    const isAfterClose = currentTime > (config?.closing_time || '16:30')
    const isLunchBreak = currentTime >= (config?.break_start_time || '12:00') && currentTime < (config?.break_end_time || '13:00')

    let status = { text: 'ระบบพร้อมให้บริการ', color: 'bg-green-400', subText: '' }

    if (isClosedDay) {
        status = { text: 'ระบบปิดทำการ (วันหยุด)', color: 'bg-red-400', subText: 'เปิดทำการวันจันทร์' }
    } else if (isBeforeOpen || isAfterClose) {
        status = { text: 'ระบบปิดทำการ (นอกเวลา)', color: 'bg-red-400', subText: `เปิดเวลา ${config?.opening_time?.slice(0, 5)} น.` }
    } else if (isLunchBreak) {
        status = { text: 'พักกลางวัน', color: 'bg-orange-400', subText: `เปิดเวลา ${config?.break_end_time?.slice(0, 5)} น.` }
    }

    return (
        <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${status.color}`}></span>
                {status.text}
            </div>
            {status.subText && (
                <span className="text-xs text-blue-200 mb-4 font-light">{status.subText}</span>
            )}
        </div>
    )
}

// Client component for Quick Search
function QuickSearch() {
    'use client'
    const router = useRouter() // Works bc it's inside 'use client' wrapper actually... wait, page.tsx is a server component. 
    // We need to make this a separate file or handle the 'use client' directive properly.
    // Since page.tsx is async/server component, we can't embed 'use client' function components directly ONLY if we use them.
    // Actually, we can define them in separate files.
    // BUT defined here they are just functions. If I use <QuickSearch /> it needs to be a client component.
    // Let's make a tiny helper file for these interactive parts or just use standard form action.
    // Actually for search, a simple form with action to /equipment is enough using native HTML behavior?
    // No, standard form submission refreshes the page. We want SPA nav if possible, but form method="get" action="/equipment" works perfectly fine for this simple case.

    return (
        <form action="/equipment" method="GET" className="w-full max-w-md mx-auto mb-8 relative group">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-blue-300 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    name="search"
                    className="block w-full pl-11 pr-4 py-3 bg-white/10 border border-blue-400/30 rounded-full text-white placeholder-blue-200 focus:outline-none focus:bg-white focus:text-gray-900 focus:ring-2 focus:ring-white transition-all shadow-lg backdrop-blur-sm"
                    placeholder="ค้นหาอุปกรณ์ เช่น MacBook, iPad..."
                />
                <button type="submit" className="absolute inset-y-1 right-1 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-full transition-colors">
                    ค้นหา
                </button>
            </div>
        </form>
    )
}

export default async function Home() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let isApproved = false

    if (user) {
        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('department_id, phone_number, status')
            .eq('id', user.id)
            .single()

        // Check if profile is incomplete
        if (profile && (!profile.department_id || !profile.phone_number)) {
            redirect('/register/complete-profile')
        }

        // Check if user is pending or rejected
        if (profile && (profile.status === 'pending' || profile.status === 'rejected')) {
            redirect('/pending-approval')
        }

        isApproved = profile?.status === 'approved'
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />

            <ActiveEvaluationPrompt />

            <main className="flex-grow">
                {/* Hero Section - Blue & White with Orange Accent */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                        <div className="text-center">
                            {/* Dynamic Status Badge */}
                            <SystemStatusBadge />

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
                                ระบบยืม-คืนพัสดุและครุภัณฑ์
                            </h1>
                            <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto mb-8">
                                บริการยืมอุปกรณ์คอมพิวเตอร์สำหรับนักศึกษาและบุคลากร
                                สะดวก รวดเร็ว ปลอดภัย
                            </p>

                            {/* Quick Search */}
                            <QuickSearch />

                            {/* Device Icons - Interactive */}
                            <div className="flex justify-center gap-6 md:gap-10 mb-8">
                                <Link href="/equipment?type=laptop" className="group flex flex-col items-center text-blue-100 hover:text-white transition-all">
                                    <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-xl mb-2 transition-colors group-hover:scale-110 duration-300">
                                        <Laptop className="w-8 h-8" aria-hidden="true" />
                                    </div>
                                    <span className="text-xs font-medium">Laptop</span>
                                </Link>
                                <Link href="/equipment?type=tablet" className="group flex flex-col items-center text-blue-100 hover:text-white transition-all">
                                    <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-xl mb-2 transition-colors group-hover:scale-110 duration-300">
                                        <Tablet className="w-8 h-8" aria-hidden="true" />
                                    </div>
                                    <span className="text-xs font-medium">Tablet</span>
                                </Link>
                                <Link href="/equipment?type=monitor" className="group flex flex-col items-center text-blue-100 hover:text-white transition-all">
                                    <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-xl mb-2 transition-colors group-hover:scale-110 duration-300">
                                        <Monitor className="w-8 h-8" aria-hidden="true" />
                                    </div>
                                    <span className="text-xs font-medium">Monitor</span>
                                </Link>
                                <Link href="/equipment?type=accessories" className="group flex flex-col items-center text-blue-100 hover:text-white transition-all">
                                    <div className="p-3 bg-white/10 group-hover:bg-white/20 rounded-xl mb-2 transition-colors group-hover:scale-110 duration-300">
                                        <Headphones className="w-8 h-8" aria-hidden="true" />
                                    </div>
                                    <span className="text-xs font-medium">Accessories</span>
                                </Link>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {isApproved ? (
                                    <Link
                                        href="/equipment"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                                    >
                                        <Package className="w-5 h-5" aria-hidden="true" />
                                        ดูรายการอุปกรณ์
                                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                                    >
                                        <LogIn className="w-5 h-5" aria-hidden="true" />
                                        เข้าสู่ระบบเพื่อดูอุปกรณ์
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Wave Divider */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 50L48 45.8C96 41.7 192 33.3 288 29.2C384 25 480 25 576 33.3C672 41.7 768 58.3 864 62.5C960 66.7 1056 58.3 1152 50C1248 41.7 1344 33.3 1392 29.2L1440 25V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z" fill="white" />
                        </svg>
                    </div>
                </div>

                <RulesSection />

                {/* CTA Section - Instead of Equipment List */}
                <section className="py-10 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                            <div className="mb-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                                    <Package className="w-6 h-6 text-blue-600" aria-hidden="true" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                                    พร้อมยืมอุปกรณ์แล้วหรือยัง?
                                </h2>
                                <p className="text-gray-500 max-w-lg mx-auto text-sm">
                                    {isApproved
                                        ? 'คุณสามารถเลือกอุปกรณ์และส่งคำขอยืมได้ทันที'
                                        : 'เข้าสู่ระบบเพื่อดูรายการอุปกรณ์และส่งคำขอยืม'
                                    }
                                </p>
                            </div>

                            {isApproved ? (
                                <Link
                                    href="/equipment"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
                                >
                                    <Package className="w-4 h-4" aria-hidden="true" />
                                    ดูรายการอุปกรณ์ทั้งหมด
                                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                </Link>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
                                    >
                                        <LogIn className="w-4 h-4" aria-hidden="true" />
                                        เข้าสู่ระบบ
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <HoursSection />
            </main>

            <Footer />
        </div>
    )
}
