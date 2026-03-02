'use client'

import { useState } from 'react'
import { Archive, AlertTriangle, PlayCircle, Loader2, CheckCircle2, Save } from 'lucide-react'
import { runAutoArchiveAction, type ArchiveResult } from '@/lib/dataManagement'
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useSystemConfig'

export default function ArchiveTab() {
    const { data: config } = useSystemConfig()
    const updateMutation = useUpdateSystemConfig()

    const [archiveEnabled, setArchiveEnabled] = useState<boolean>(() => config?.archive_enabled ?? false)
    const [archiveSupportDays, setArchiveSupportDays] = useState<number>(() => config?.archive_support_after_days ?? 180)
    const [archiveNotifDays, setArchiveNotifDays] = useState<number>(() => config?.archive_notifications_after_days ?? 90)
    const [isDirty, setIsDirty] = useState(false)

    const [isArchiving, setIsArchiving] = useState(false)
    const [archiveResult, setArchiveResult] = useState<ArchiveResult | null>(null)
    const [archiveError, setArchiveError] = useState<string | null>(null)

    // Sync from loaded config (when it arrives)
    const configEnabled = config?.archive_enabled ?? false
    const configSupportDays = config?.archive_support_after_days ?? 180
    const configNotifDays = config?.archive_notifications_after_days ?? 90

    const handleSavePolicy = () => {
        updateMutation.mutate({
            archive_enabled: archiveEnabled,
            archive_support_after_days: archiveSupportDays,
            archive_notifications_after_days: archiveNotifDays,
        } as any, {
            onSuccess: () => {
                setIsDirty(false)
            }
        })
    }

    const handleRunArchive = async () => {
        if (!confirm('ยืนยันการลบข้อมูลเก่าตามนโยบาย? การกระทำนี้ไม่สามารถกู้คืนได้')) return
        setIsArchiving(true)
        setArchiveResult(null)
        setArchiveError(null)
        try {
            const result = await runAutoArchiveAction()
            setArchiveResult(result)
        } catch (err: any) {
            setArchiveError(err.message || 'เกิดข้อผิดพลาด')
        } finally {
            setIsArchiving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                    <p className="font-semibold mb-1">⚠️ Auto-Archive (Hard Delete)</p>
                    <p>ข้อมูลที่ถูก Archive จะ<strong>ถูกลบถาวร</strong> ไม่สามารถกู้คืนได้ — จำกัดเฉพาะ ticket ที่ปิดแล้ว และ notification เก่า</p>
                </div>
            </div>

            {/* Policy Settings */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-800">ตั้งค่านโยบาย Retention</span>
                    </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                        <p className="text-sm font-medium text-gray-800">เปิดใช้งาน Auto-Archive</p>
                        <p className="text-xs text-gray-500">บันทึกสถานะ policy นี้ไว้ใน system config</p>
                    </div>
                    <button
                        onClick={() => { setArchiveEnabled(!archiveEnabled); setIsDirty(true) }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${archiveEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${archiveEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Retention Days */}
                <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Support Chat (Closed Tickets)
                        </label>
                        <p className="text-xs text-gray-400 mb-2">ลบ ticket ที่ปิดแล้ว และข้อความทั้งหมด</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={30}
                                max={3650}
                                value={archiveSupportDays}
                                onChange={(e) => { setArchiveSupportDays(parseInt(e.target.value) || 180); setIsDirty(true) }}
                                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-600">วัน</span>
                            <span className="text-xs text-gray-400">(~{Math.round(archiveSupportDays / 30)} เดือน)</span>
                        </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            การแจ้งเตือน (Notifications)
                        </label>
                        <p className="text-xs text-gray-400 mb-2">ลบ notification ทุกรายการที่เก่ากว่า</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={30}
                                max={3650}
                                value={archiveNotifDays}
                                onChange={(e) => { setArchiveNotifDays(parseInt(e.target.value) || 90); setIsDirty(true) }}
                                className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-600">วัน</span>
                            <span className="text-xs text-gray-400">(~{Math.round(archiveNotifDays / 30)} เดือน)</span>
                        </div>
                    </div>
                </div>

                {/* Save Policy Button */}
                {isDirty && (
                    <div className="flex justify-end">
                        <button
                            onClick={handleSavePolicy}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                        >
                            {updateMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            บันทึกการตั้งค่า
                        </button>
                    </div>
                )}
            </div>

            {/* What will be deleted */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-medium text-amber-900 mb-2">สิ่งที่จะถูกลบเมื่อรัน Archive:</p>
                <ul className="space-y-1 text-amber-800">
                    <li>✅ Support Ticket ที่ปิดแล้ว และไม่ได้อัปเดตนานกว่า <strong>{archiveSupportDays} วัน</strong></li>
                    <li>✅ ข้อความทั้งหมดใน Ticket เหล่านั้น (CASCADE)</li>
                    <li>✅ Notification ทุกรายการที่เก่ากว่า <strong>{archiveNotifDays} วัน</strong></li>
                    <li className="text-amber-600">❌ ไม่ลบข้อมูลการยืม-คืน, อุปกรณ์, หรือผู้ใช้</li>
                </ul>
            </div>

            {/* Last archived */}
            {config?.last_archived_at && (
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    Archive ล่าสุด: {new Date((config as any).last_archived_at).toLocaleString('th-TH')}
                </p>
            )}

            {/* Archive Result */}
            {archiveResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-green-800 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Archive เสร็จสมบูรณ์
                    </div>
                    <ul className="space-y-1 text-green-700">
                        <li>✅ ลบ Ticket: <strong>{archiveResult.deleted_tickets}</strong> รายการ</li>
                        <li>✅ ลบ Notification: <strong>{archiveResult.deleted_notifications}</strong> รายการ</li>
                    </ul>
                </div>
            )}

            {/* Archive Error */}
            {archiveError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    <p className="font-semibold">เกิดข้อผิดพลาด</p>
                    <p>{archiveError}</p>
                </div>
            )}

            {/* Run Archive Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <div className="flex-1 text-sm text-gray-500 flex items-center">
                    กดปุ่มเพื่อลบข้อมูลที่เก่ากว่าเกณฑ์ที่ตั้งไว้ทันที
                </div>
                <button
                    onClick={handleRunArchive}
                    disabled={isArchiving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isArchiving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />กำลังลบ...</>
                    ) : (
                        <><PlayCircle className="w-4 h-4" />Run Archive Now</>
                    )}
                </button>
            </div>
        </div>
    )
}
