'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('My Reservations Page Error:', error)
    }, [error])

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="mx-auto w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-5">
                    <AlertTriangle className="w-7 h-7 text-orange-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    ไม่สามารถโหลดข้อมูลการจองได้
                </h2>
                <p className="text-gray-500 mb-6">
                    กรุณาลองใหม่อีกครั้ง
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-6 p-3 bg-red-50 rounded-lg text-left overflow-auto max-h-32">
                        <p className="text-sm font-mono text-red-800 break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองใหม่
                    </button>
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        กลับหน้าหลัก
                    </a>
                </div>
            </div>
        </div>
    )
}
