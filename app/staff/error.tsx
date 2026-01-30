'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Staff Page Error:', error)
    }, [error])

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                {/* Error Icon */}
                <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-5">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>

                {/* Error Message */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    เกิดข้อผิดพลาด
                </h2>
                <p className="text-gray-500 mb-6">
                    ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่อีกครั้ง
                </p>

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-6 p-3 bg-red-50 rounded-lg text-left overflow-auto max-h-32">
                        <p className="text-sm font-mono text-red-800 break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองใหม่
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        ย้อนกลับ
                    </button>
                </div>
            </div>
        </div>
    )
}
