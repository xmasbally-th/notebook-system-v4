'use client'

import React from 'react'
import {
    Bot,
    Play,
    Loader2,
    AlertCircle,
    Clock,
    CalendarX,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react'

interface AutomationTabProps {
    onRunDailyAutomation: () => void
    isExecutingAutomation: boolean
    automationResult: any
    onCopyToClipboard: (text: string) => void
}

export default function AutomationTab({
    onRunDailyAutomation,
    isExecutingAutomation,
    automationResult,
    onCopyToClipboard
}: AutomationTabProps) {
    return (
        <div className="space-y-6">
            {/* Main Automation Card */}
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">ระบบงานอัตโนมัติประจำวัน (Daily Automation & Smart Cron)</h2>
                            <p className="text-sm text-gray-500">ดูแลงานประจำวันอัตโนมัติทุกวันเวลา 08:30 น. (UTC+7 / 01:30 UTC)</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onRunDailyAutomation}
                        disabled={isExecutingAutomation}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 font-medium text-sm whitespace-nowrap"
                    >
                        {isExecutingAutomation ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>กำลังประมวลผล...</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                <span>ทดสอบรันงานอัตโนมัติทันที</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Task Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-red-100 bg-red-50/50">
                        <div className="flex items-center gap-2 text-red-600 font-semibold text-sm mb-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>1. ตรวจสอบและเตือนค้างส่ง</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            ค้นหารายการยืมที่เลยกำหนดส่งคืน แจ้งเตือนผู้ยืมผ่าน In-App & WeLPRU และสรุปรายงานส่ง Staff ทาง Discord Webhook (สีแดง) ป้องกันการส่งซ้ำใน 20 ชม.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50">
                        <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-2">
                            <Clock className="w-4 h-4" />
                            <span>2. เตือนก่อนครบกำหนด 1 วัน</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            แจ้งเตือนผู้ยืมล่วงหน้าสำหรับอุปกรณ์ที่ต้องส่งคืนวันนี้หรือวันพรุ่งนี้ พร้อมสรุปรายการส่ง Discord Staff (สีส้มทอง)
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
                        <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-2">
                            <CalendarX className="w-4 h-4" />
                            <span>3. เคลียร์คิวจองหมดเวลา</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            ยกเลิกคิวจองที่เลยกำหนดวันรับของข้ามวันอัตโนมัติ (สถานะ Expired) เพื่อคืนสิทธิ์อุปกรณ์ให้ผู้อื่นยืมได้ทันที
                        </p>
                    </div>
                </div>

                {/* Automation Run Result Banner */}
                {automationResult && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>ผลการรันล่าสุด ({new Date(automationResult.timestamp).toLocaleTimeString('th-TH')})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-emerald-950">
                            <div className="p-3 bg-white/80 rounded-lg border border-emerald-100">
                                <span className="font-semibold block text-red-600 mb-1">🚨 รายการค้างส่ง:</span>
                                ตรวจพบ {automationResult.overdue.totalEvaluated} รายการ<br />
                                ส่งเตือนใหม่ <strong>{automationResult.overdue.actionTaken}</strong> รายการ
                            </div>
                            <div className="p-3 bg-white/80 rounded-lg border border-emerald-100">
                                <span className="font-semibold block text-amber-600 mb-1">⏰ ใกล้ครบกำหนด:</span>
                                ตรวจพบ {automationResult.dueSoon.totalEvaluated} รายการ<br />
                                ส่งเตือนล่วงหน้า <strong>{automationResult.dueSoon.actionTaken}</strong> รายการ
                            </div>
                            <div className="p-3 bg-white/80 rounded-lg border border-emerald-100">
                                <span className="font-semibold block text-gray-700 mb-1">⌛ คิวจองหมดอายุ:</span>
                                ตรวจพบ {automationResult.expiredReservations.totalEvaluated} รายการ<br />
                                ยกเลิกอัตโนมัติ <strong>{automationResult.expiredReservations.actionTaken}</strong> รายการ
                            </div>
                        </div>
                        {automationResult.summaryMessage && (
                            <p className="mt-3 text-xs text-emerald-800 font-medium">
                                💬 {automationResult.summaryMessage}
                            </p>
                        )}
                    </div>
                )}
            </section>

            {/* Technical & Cron Config Card */}
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span>การเชื่อมต่อ Vercel Cron & ความปลอดภัย</span>
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-xl gap-2">
                        <div>
                            <span className="font-medium text-gray-900 block">Cron API Endpoint</span>
                            <code className="text-xs text-gray-500 font-mono">/api/cron/daily-tasks</code>
                        </div>
                        <button
                            type="button"
                            onClick={() => onCopyToClipboard('/api/cron/daily-tasks')}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium self-start sm:self-center"
                        >
                            คัดลอก Path
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-xl gap-2">
                        <div>
                            <span className="font-medium text-gray-900 block">รอบเวลาทำงาน (Schedule)</span>
                            <span className="text-xs text-gray-500 font-mono">30 1 * * * (ทุกวัน เวลา 08:30 น. ตามเวลาประเทศไทย)</span>
                        </div>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full self-start sm:self-center">
                            Active in vercel.json
                        </span>
                    </div>
                    <div className="p-3 bg-blue-50/60 rounded-xl text-xs text-blue-800 leading-relaxed">
                        💡 <strong>คำแนะนำด้านความปลอดภัย:</strong> หากตั้งค่าตัวแปร <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded">CRON_SECRET</code> บน Vercel Environment Variables ระบบจะตรวจสอบ Bearer Token โดยอัตโนมัติเพื่อป้องกันบุคคลภายนอกเรียกใช้งานโดยตรง
                    </div>
                </div>
            </section>
        </div>
    )
}
