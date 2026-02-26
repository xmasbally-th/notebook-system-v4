'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global Error:', error)
    }, [error])

    return (
        <html lang="th">
            <body className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-5">
                        <AlertTriangle className="w-7 h-7 text-red-600" />
                    </div>

                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        เกิดข้อผิดพลาดร้ายแรง
                    </h1>
                    <p className="text-gray-500 mb-6">
                        ระบบเกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองรีโหลดหน้าเว็บ
                    </p>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-6 p-3 bg-red-50 rounded-lg text-left overflow-auto max-h-32">
                            <p className="text-sm font-mono text-red-800 break-all">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-red-600 mt-1">Digest: {error.digest}</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองใหม่
                    </button>
                </div>
            </body>
        </html>
    )
}
