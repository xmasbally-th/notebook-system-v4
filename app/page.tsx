import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RulesSection from '@/components/home/RulesSection'
import HoursSection from '@/components/home/HoursSection'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Laptop, Tablet, Headphones, Monitor, ArrowRight, LogIn, Package } from 'lucide-react'

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

            <main className="flex-grow">
                {/* Hero Section - Blue & White with Orange Accent */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                    {/* Decorative Elements */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                        <div className="text-center">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-6">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                ระบบพร้อมให้บริการ
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
                                ระบบยืม-คืน<br className="sm:hidden" />
                                <span className="text-orange-400">โน้ตบุ๊ก</span>
                            </h1>
                            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                                บริการยืมอุปกรณ์คอมพิวเตอร์สำหรับนักศึกษาและบุคลากร
                                สะดวก รวดเร็ว ปลอดภัย
                            </p>

                            {/* Device Icons */}
                            <div className="flex justify-center gap-6 md:gap-10 mb-10">
                                <div className="flex flex-col items-center text-white/80 hover:text-white hover:scale-110 transition-all">
                                    <div className="p-3 bg-white/10 rounded-xl mb-2">
                                        <Laptop className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-medium">Laptop</span>
                                </div>
                                <div className="flex flex-col items-center text-white/80 hover:text-white hover:scale-110 transition-all">
                                    <div className="p-3 bg-white/10 rounded-xl mb-2">
                                        <Tablet className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-medium">Tablet</span>
                                </div>
                                <div className="flex flex-col items-center text-white/80 hover:text-white hover:scale-110 transition-all">
                                    <div className="p-3 bg-white/10 rounded-xl mb-2">
                                        <Monitor className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-medium">Monitor</span>
                                </div>
                                <div className="flex flex-col items-center text-white/80 hover:text-white hover:scale-110 transition-all">
                                    <div className="p-3 bg-white/10 rounded-xl mb-2">
                                        <Headphones className="w-8 h-8" />
                                    </div>
                                    <span className="text-xs font-medium">Accessories</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {isApproved ? (
                                    <Link
                                        href="/equipment"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                                    >
                                        <Package className="w-5 h-5" />
                                        ดูรายการอุปกรณ์
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                                    >
                                        <LogIn className="w-5 h-5" />
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
                <section className="py-16 bg-gray-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12">
                            <div className="mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                                    <Package className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                                    พร้อมยืมอุปกรณ์แล้วหรือยัง?
                                </h2>
                                <p className="text-gray-500 max-w-lg mx-auto">
                                    {isApproved
                                        ? 'คุณสามารถเลือกอุปกรณ์และส่งคำขอยืมได้ทันที'
                                        : 'เข้าสู่ระบบเพื่อดูรายการอุปกรณ์และส่งคำขอยืม'
                                    }
                                </p>
                            </div>

                            {isApproved ? (
                                <Link
                                    href="/equipment"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                                >
                                    <Package className="w-5 h-5" />
                                    ดูรายการอุปกรณ์ทั้งหมด
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                                    >
                                        <LogIn className="w-5 h-5" />
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
