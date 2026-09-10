'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/useSystemConfig'
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import {
    Loader2,
    Save,
    AlertTriangle,
    Clock,
    Zap,
    Users,
    Megaphone,
    RefreshCw,
    FileText,
    Palette,
    Bot
} from 'lucide-react'
import { Database } from '@/supabase/types'
import { useTheme } from '@/components/providers/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { triggerDailyAutomationAction } from '@/app/admin/settings/actions'
import {
    LimitsTab,
    HoursTab,
    FeaturesTab,
    NotificationsTab,
    AutomationTab,
    DocumentsTab,
    ThemeTab
} from './tabs'
import { defaultLoanLimits, LoanLimitsByType } from './tabs/LimitsTab'

type SystemConfigUpdate = Database['public']['Tables']['system_config']['Update']

type TabType = 'limits' | 'hours' | 'features' | 'notifications' | 'automation' | 'documents' | 'theme'

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'limits', label: 'ขีดจำกัด', icon: <Users className="w-4 h-4" /> },
    { id: 'hours', label: 'เวลาทำการ', icon: <Clock className="w-4 h-4" /> },
    { id: 'features', label: 'ฟีเจอร์', icon: <Zap className="w-4 h-4" /> },
    { id: 'notifications', label: 'แจ้งเตือน', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'automation', label: 'งานอัตโนมัติ', icon: <Bot className="w-4 h-4" /> },
    { id: 'documents', label: 'เอกสาร', icon: <FileText className="w-4 h-4" /> },
    { id: 'theme', label: 'ธีม', icon: <Palette className="w-4 h-4" /> },
]

interface AdminSettingsClientProps {
    initialConfig: any
    initialEquipmentTypes: any[]
}

export default function AdminSettingsClient({ initialConfig, initialEquipmentTypes }: AdminSettingsClientProps) {
    const { data: config, error, refetch } = useSystemConfig()
    const updateMutation = useUpdateSystemConfig()
    const { data: equipmentTypes = [] } = useEquipmentTypes()
    const { theme, setTheme } = useTheme()

    const [activeTab, setActiveTab] = useState<TabType>('limits')
    const [formData, setFormData] = useState<SystemConfigUpdate>({})
    const [isDirty, setIsDirty] = useState(false)
    const [loanLimits, setLoanLimits] = useState<LoanLimitsByType>(defaultLoanLimits)
    const [closedDates, setClosedDates] = useState<string[]>([])
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = useState(false)
    const [templateUrl, setTemplateUrl] = useState<string | null>(null)
    const [isUploadingTemplate, setIsUploadingTemplate] = useState(false)

    // Automation test state
    const [isExecutingAutomation, setIsExecutingAutomation] = useState(false)
    const [automationResult, setAutomationResult] = useState<any>(null)

    const handleRunDailyAutomation = async () => {
        setIsExecutingAutomation(true)
        setAutomationResult(null)
        try {
            const res = await triggerDailyAutomationAction()
            if (!res.success) {
                alert(`เกิดข้อผิดพลาด: ${res.error || 'ไม่สามารถสั่งรันงานอัตโนมัติได้'}`)
                return
            }
            setAutomationResult(res.result)
        } catch (err: any) {
            alert(`เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถสั่งรันงานอัตโนมัติได้'}`)
        } finally {
            setIsExecutingAutomation(false)
        }
    }

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert(`คัดลอก "${text}" เรียบร้อยแล้ว`)
    }

    // Initialize state from config
    useEffect(() => {
        const activeConfig = config || initialConfig
        if (activeConfig) {
            setFormData({
                is_loan_system_active: activeConfig.is_loan_system_active ?? true,
                is_reservation_active: activeConfig.is_reservation_active ?? true,
                opening_time: activeConfig.opening_time || '09:00',
                closing_time: activeConfig.closing_time || '17:00',
                break_start_time: activeConfig.break_start_time || '12:00',
                break_end_time: activeConfig.break_end_time || '13:00',
                discord_webhook_url: activeConfig.discord_webhook_url || '',
                discord_webhook_auth: activeConfig.discord_webhook_auth || '',
                discord_webhook_reservations: activeConfig.discord_webhook_reservations || '',
                discord_webhook_maintenance: activeConfig.discord_webhook_maintenance || '',
                announcement_active: activeConfig.announcement_active ?? false,
                announcement_message: activeConfig.announcement_message || '',
                welpru_notifications_enabled: activeConfig.welpru_notifications_enabled ?? false,
                welpru_api_key: activeConfig.welpru_api_key || '',
                admin_welpru_ids: activeConfig.admin_welpru_ids || [],
                notification_settings: activeConfig.notification_settings || {},
                document_logo_url: activeConfig.document_logo_url || null,
                document_template_url: activeConfig.document_template_url || null,
            } as any)

            if (activeConfig.loan_limits_by_type) {
                setLoanLimits({
                    ...defaultLoanLimits,
                    ...activeConfig.loan_limits_by_type
                })
            }

            if (activeConfig.closed_dates) {
                setClosedDates(activeConfig.closed_dates)
            }

            if (activeConfig.document_logo_url) {
                setLogoUrl(activeConfig.document_logo_url)
            }

            if (activeConfig.document_template_url) {
                setTemplateUrl(activeConfig.document_template_url)
            }
        }
    }, [config, initialConfig])

    const handleFieldChange = (field: keyof SystemConfigUpdate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsDirty(true)
    }

    const handleAddClosedDate = (date: string) => {
        if (!closedDates.includes(date)) {
            const updated = [...closedDates, date].sort()
            setClosedDates(updated)
            setIsDirty(true)
        }
    }

    const handleRemoveClosedDate = (date: string) => {
        setClosedDates(closedDates.filter(d => d !== date))
        setIsDirty(true)
    }

    // Logo Upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('ขนาดไฟล์ต้องไม่เกิน 2MB')
            return
        }

        setIsUploadingLogo(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `logo-${Date.now()}.${fileExt}`
            const filePath = `system/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath)

            setLogoUrl(publicUrl)
            handleFieldChange('document_logo_url' as any, publicUrl)

            updateMutation.mutate({ document_logo_url: publicUrl }, {
                onSuccess: () => alert('อัปโหลดโลโก้เรียบร้อยแล้ว'),
                onError: (err) => alert(`เกิดข้อผิดพลาด: ${err.message}`)
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถอัปโหลดโลโก้ได้')
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleLogoDelete = async () => {
        if (!logoUrl || !confirm('ต้องการลบโลโก้หรือไม่?')) return
        try {
            setLogoUrl(null)
            handleFieldChange('document_logo_url' as any, null)
            updateMutation.mutate({ document_logo_url: null }, {
                onSuccess: () => alert('ลบโลโก้เรียบร้อยแล้ว'),
                onError: (err) => alert(`เกิดข้อผิดพลาด: ${err.message}`)
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถลบโลโก้ได้')
        }
    }

    // Template Upload
    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.docx')) {
            alert('กรุณาอัปโหลดไฟล์ .docx เท่านั้น')
            return
        }

        setIsUploadingTemplate(true)
        try {
            const fileName = `template-${Date.now()}.docx`
            const filePath = `templates/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath)

            setTemplateUrl(publicUrl)
            handleFieldChange('document_template_url' as any, publicUrl)

            updateMutation.mutate({ document_template_url: publicUrl }, {
                onSuccess: () => alert('อัปโหลด template เรียบร้อยแล้ว'),
                onError: (err) => alert(`เกิดข้อผิดพลาด: ${err.message}`)
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถอัปโหลด template ได้')
        } finally {
            setIsUploadingTemplate(false)
        }
    }

    const handleTemplateDelete = async () => {
        if (!templateUrl || !confirm('ต้องการลบ template หรือไม่?')) return
        try {
            setTemplateUrl(null)
            handleFieldChange('document_template_url' as any, null)
            updateMutation.mutate({ document_template_url: null }, {
                onSuccess: () => alert('ลบ template เรียบร้อยแล้ว'),
                onError: (err) => alert(`เกิดข้อผิดพลาด: ${err.message}`)
            })
        } catch (err: any) {
            alert(err.message || 'ไม่สามารถลบ template ได้')
        }
    }

    const timeError = useMemo(() => {
        if (!formData.opening_time || !formData.closing_time) return null
        if (formData.opening_time >= formData.closing_time) {
            return 'เวลาเปิดต้องน้อยกว่าเวลาปิด'
        }
        if (formData.break_start_time && formData.break_end_time) {
            if (formData.break_start_time >= formData.break_end_time) {
                return 'เวลาเริ่มพักต้องน้อยกว่าเวลาสิ้นสุดพัก'
            }
            if (formData.break_start_time < formData.opening_time || formData.break_end_time > formData.closing_time) {
                return 'เวลาพักต้องอยู่ระหว่างเวลาเปิด-ปิด'
            }
        }
        return null
    }, [formData.opening_time, formData.closing_time, formData.break_start_time, formData.break_end_time])

    const handleSave = () => {
        const updates = {
            ...formData,
            loan_limits_by_type: loanLimits,
            closed_dates: closedDates,
        }
        updateMutation.mutate(updates, {
            onSuccess: () => {
                setIsDirty(false)
                alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
            },
            onError: (err) => {
                alert(`เกิดข้อผิดพลาด: ${err.message}`)
            }
        })
    }

    const activeEquipmentTypes = Array.isArray(equipmentTypes) && equipmentTypes.length > 0
        ? equipmentTypes
        : initialEquipmentTypes

    if (error) {
        return (
            <>
                <AdminPageHeader title="ตั้งค่าระบบ" subtitle="เกิดข้อผิดพลาด"/>
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <p className="text-red-700 font-medium">ไม่สามารถโหลดการตั้งค่าได้</p>
                    </div>
                    <p className="text-sm text-red-600 mb-4">{(error as Error).message}</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        ลองใหม่
                    </button>
                </div>
            </>
        )
    }

    return (
        <>
            <AdminPageHeader title="ตั้งค่าระบบ" subtitle="จัดการการตั้งค่าระบบยืม-คืนอุปกรณ์"/>

            {/* Sticky Save Button */}
            {isDirty && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-50 animate-slide-in flex flex-col items-center gap-2">
                    {timeError && (
                        <div className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{timeError}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateMutation.isPending || Boolean(timeError)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:bg-gray-400 transition-all font-medium text-sm"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span className="hidden sm:inline">บันทึกการเปลี่ยนแปลง</span>
                        <span className="sm:hidden">บันทึก</span>
                    </button>
                </div>
            )}

            <div className="max-w-4xl">
                {/* Tabs Navigation */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-4 sm:px-6 py-4 text-sm font-medium whitespace-nowrap
                                    border-b-2 transition-all flex-1 justify-center
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Contents */}
                <div>
                    {activeTab === 'limits' && (
                        <LimitsTab
                            loanLimits={loanLimits}
                            setLoanLimits={setLoanLimits}
                            activeEquipmentTypes={activeEquipmentTypes}
                            setIsDirty={setIsDirty}
                        />
                    )}

                    {activeTab === 'hours' && (
                        <HoursTab
                            formData={formData}
                            onFieldChange={handleFieldChange}
                            closedDates={closedDates}
                            onAddClosedDate={handleAddClosedDate}
                            onRemoveClosedDate={handleRemoveClosedDate}
                            timeError={timeError}
                        />
                    )}

                    {activeTab === 'features' && (
                        <FeaturesTab
                            formData={formData}
                            onFieldChange={handleFieldChange}
                        />
                    )}

                    {activeTab === 'notifications' && (
                        <NotificationsTab
                            formData={formData}
                            onFieldChange={handleFieldChange}
                        />
                    )}

                    {activeTab === 'automation' && (
                        <AutomationTab
                            onRunDailyAutomation={handleRunDailyAutomation}
                            isExecutingAutomation={isExecutingAutomation}
                            automationResult={automationResult}
                            onCopyToClipboard={handleCopyToClipboard}
                        />
                    )}

                    {activeTab === 'documents' && (
                        <DocumentsTab
                            logoUrl={logoUrl}
                            isUploadingLogo={isUploadingLogo}
                            onLogoUpload={handleLogoUpload}
                            onLogoDelete={handleLogoDelete}
                            templateUrl={templateUrl}
                            isUploadingTemplate={isUploadingTemplate}
                            onTemplateUpload={handleTemplateUpload}
                            onTemplateDelete={handleTemplateDelete}
                            onCopyToClipboard={handleCopyToClipboard}
                        />
                    )}

                    {activeTab === 'theme' && (
                        <ThemeTab
                            theme={theme}
                            setTheme={setTheme}
                        />
                    )}
                </div>
            </div>
        </>
    )
}
