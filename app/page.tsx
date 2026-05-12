import { Suspense } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RulesSection from '@/components/home/RulesSection'
import HoursSection from '@/components/home/HoursSection'
import Link from 'next/link'
import { Laptop, Tablet, Headphones, Monitor } from 'lucide-react'
import SystemStatusBadge from '@/components/home/SystemStatusBadge'
import QuickSearch from '@/components/home/QuickSearch'
import { HeroCTA, MidCTA } from '@/components/home/HomeCTA'

// P5: Lazy loaded via client wrapper — avoids loading heavy EvaluationModal upfront
import LazyEvaluationPrompt from '@/components/evaluations/LazyEvaluationPrompt'

/**
 * Home page — static content streams immediately.
 * Auth-dependent CTA buttons load via client components to avoid blocking TTFB.
 */
export default function Home() {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Header />

            <LazyEvaluationPrompt />

            <main className="flex-grow">
                {/* Hero Section - static content can be fully prerendered */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                        <div className="text-center">
                            {/* Dynamic Status Badge — client side fetch */}
                            <Suspense fallback={
                                <div className="flex flex-col items-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                                        กำลังตรวจสอบสถานะ...
                                    </div>
                                    <span className="text-xs text-transparent mb-4">placeholder</span>
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

                            {/* CTA — streams via client component */}
                            <HeroCTA />
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

                {/* Mid-page CTA — client component */}
                <MidCTA />

                <HoursSection />
            </main>

            <Footer />
        </div>
    )
}
