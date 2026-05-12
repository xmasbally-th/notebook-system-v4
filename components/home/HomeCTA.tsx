'use client'

import Link from 'next/link'
import { Package, ArrowRight, LogIn } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'

export function HeroCTA() {
    const { data: profile, isLoading } = useProfile()

    if (isLoading) {
        return (
            <div className="flex justify-center" id="hero-cta">
                <div className="h-12 w-56 bg-orange-400/50 rounded-full animate-pulse" />
            </div>
        )
    }

    const isApproved = profile?.status === 'approved'

    return (
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
    )
}

export function MidCTA() {
    const { data: profile, isLoading } = useProfile()

    if (isLoading) {
        return (
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
        )
    }

    const isApproved = profile?.status === 'approved'

    return (
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
    )
}
