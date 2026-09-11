'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Camera, Sparkles, QrCode } from 'lucide-react'
import { extractEquipmentIdentifier } from '@/lib/qr-scan-resolver'

const QrScannerModal = dynamic(
    () => import('@/components/scanner/QrScannerModal'),
    { ssr: false }
)

export default function EquipmentScanBanner() {
    const router = useRouter()
    const [isScannerOpen, setIsScannerOpen] = useState(false)

    const handleScanSuccess = (decodedText: string) => {
        setIsScannerOpen(false)
        const target = extractEquipmentIdentifier(decodedText)
        if (target) {
            router.push(`/eq/${encodeURIComponent(target)}`)
        }
    }

    return (
        <>
            <div className="bg-gradient-to-r from-blue-700/90 via-indigo-700/90 to-blue-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-blue-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
                <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-white/15 text-white rounded-xl shrink-0 shadow-xs backdrop-blur-xs">
                        <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm sm:text-base text-white">
                                อยู่ที่หน้าเครื่องแล้วใช่ไหม? สแกน QR เพื่อยืมทันที
                            </h3>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                <Sparkles className="w-2.5 h-2.5" />
                                1 ขั้นตอน
                            </span>
                        </div>
                        <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
                            ส่องกล้องมือถือไปที่สติกเกอร์ QR Code บนตัวเครื่องจริง เพื่อปลดล็อกฟอร์มยืมด่วนและรับเครื่องได้ทันที
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-900 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>เปิดกล้องสแกน QR</span>
                </button>
            </div>

            {isScannerOpen && (
                <QrScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={handleScanSuccess}
                    title="สแกน QR Code บนตัวเครื่อง"
                    subtitle="ส่องกล้องไปที่สติกเกอร์ QR Code บนเครื่องโน้ตบุ๊คเพื่อปลดล็อกการยืมทันที"
                />
            )}
        </>
    )
}
