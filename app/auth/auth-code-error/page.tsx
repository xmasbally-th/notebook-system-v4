'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function AuthCodeErrorPage() {
    const handleRetry = () => {
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                {/* Icon */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    เกิดข้อผิดพลาดในการเข้าสู่ระบบ
                </h1>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                    ไม่สามารถยืนยันตัวตนกับ Google ได้ อาจเกิดจากสาเหตุต่อไปนี้:
                </p>

                {/* Possible causes */}
                <div className="text-left bg-gray-50 rounded-xl p-4 mb-6">
                    <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Session หมดอายุ กรุณาลองเข้าสู่ระบบใหม่</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>เวลาของอุปกรณ์ไม่ตรงกับเวลาจริง</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>มีปัญหาในการเชื่อมต่อกับ Google</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleRetry}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองเข้าสู่ระบบอีกครั้ง
                    </button>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับหน้าแรก
                    </Link>
                </div>

                {/* Help text */}
                <p className="text-xs text-gray-400 mt-6">
                    หากปัญหายังคงอยู่ กรุณาตรวจสอบการตั้งค่าเวลาของอุปกรณ์
                    <br />
                    หรือติดต่อผู้ดูแลระบบ
                </p>
            </div>
        </div>
    )
}
