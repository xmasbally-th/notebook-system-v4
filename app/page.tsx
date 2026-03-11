import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RulesSection from '@/components/home/RulesSection'
import HoursSection from '@/components/home/HoursSection'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Laptop, Tablet, Headphones, Monitor, ArrowRight, LogIn, Package } from 'lucide-react'
import ActiveEvaluationPrompt from '@/components/evaluations/ActiveEvaluationPrompt'
import SystemStatusBadge from '@/components/home/SystemStatusBadge'
import QuickSearch from '@/components/home/QuickSearch'

/**
 * Async component that handles auth check + profile redirect + CTA rendering.
 * Wrapped in Suspense so the rest of the page streams immediately.
 */
async function AuthAwareCTA() {
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
        <>
            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center" id="hero-cta">
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

            {/* Mid-page CTA Section */}
            <section className="py-10 bg-gray-50" id="mid-cta">
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
        </>
    )
}

/** Skeleton shown while auth check is in progress */
function CTAButtonSkeleton() {
    return (
        <>
            <div className="flex justify-center" id="hero-cta">
                <div className="h-12 w-56 bg-orange-400/50 rounded-full animate-pulse" />
            </div>
            <section className="py-10 bg-gray-50" id="mid-cta">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                        <div className="mb-4">
                            <div className="h-12 w-12 bg-blue-100 rounded-xl mx-auto mb-3" />
                            <div className="h-7 w-64 bg-gray-200 rounded mx-auto mb-2" />
                            <div className="h-4 w-80 bg-gray-100 rounded mx-auto" />
                        </div>
                        <div className="h-10 w-48 bg-blue-400/50 rounded-xl mx-auto animate-pulse" />
                    </div>
                </div>
            </section>
        </>
    )
}

/**
 * Home page — static content streams immediately.
 * Auth-dependent CTA buttons load via Suspense streaming.
 */
export default function Home() {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />

            <ActiveEvaluationPrompt />

            <main className="flex-grow">
                {/* Hero Section - streams immediately (no await!) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                        <div className="text-center">
                            {/* Dynamic Status Badge — wrapped in Suspense */}
                            <Suspense fallback={
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-4">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                                    กำลังตรวจสอบสถานะ...
                                </div>
                            }>
                                <SystemStatusBadge />
                            </Suspense>

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

                            {/* CTA — streams via Suspense after auth check */}
                            <Suspense fallback={
                                <div className="flex justify-center">
                                    <div className="h-12 w-56 bg-orange-400/50 rounded-full animate-pulse" />
                                </div>
                            }>
                                <AuthAwareCTAHero />
                            </Suspense>
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

                {/* Mid-page CTA — streams via Suspense */}
                <Suspense fallback={<CTAButtonSkeleton />}>
                    <AuthAwareCTAMid />
                </Suspense>

                <HoursSection />
            </main>

            <Footer />
        </div>
    )
}

/**
 * Hero CTA — only renders the button, shares auth logic
 */
async function AuthAwareCTAHero() {
    const isApproved = await checkIsApproved()

    return (
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
    )
}

/**
 * Mid-page CTA section — same auth check
 */
async function AuthAwareCTAMid() {
    const isApproved = await checkIsApproved()

    return (
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
    )
}

/**
 * Shared auth check — handles redirects + returns isApproved.
 * React.cache would deduplicate if both CTA components call this in the same request,
 * but since they're in separate Suspense boundaries they may run in parallel which is fine.
 */
async function checkIsApproved(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('department_id, phone_number, status')
        .eq('id', user.id)
        .single()

    // Redirect if profile incomplete
    if (profile && (!profile.department_id || !profile.phone_number)) {
        redirect('/register/complete-profile')
    }

    // Redirect if pending/rejected
    if (profile && (profile.status === 'pending' || profile.status === 'rejected')) {
        redirect('/pending-approval')
    }

    return profile?.status === 'approved'
}
