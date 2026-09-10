'use client'

import React from 'react'
import {
    FileText,
    Image as ImageIcon,
    Upload,
    Trash2,
    X,
    Loader2
} from 'lucide-react'

interface DocumentsTabProps {
    logoUrl: string | null
    isUploadingLogo: boolean
    onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onLogoDelete: () => void
    templateUrl: string | null
    isUploadingTemplate: boolean
    onTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onTemplateDelete: () => void
    onCopyToClipboard: (text: string) => void
}

export default function DocumentsTab({
    logoUrl,
    isUploadingLogo,
    onLogoUpload,
    onLogoDelete,
    templateUrl,
    isUploadingTemplate,
    onTemplateUpload,
    onTemplateDelete,
    onCopyToClipboard
}: DocumentsTabProps) {
    return (
        <div className="space-y-6">
            {/* Logo Section */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-teal-50 rounded-xl">
                        <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">โลโก้เอกสาร</h2>
                        <p className="text-sm text-gray-500">โลโก้สำหรับแสดงในใบยืมพิเศษและเอกสารอื่นๆ</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        {logoUrl ? (
                            <div className="relative group">
                                <img
                                    src={logoUrl}
                                    alt="Document Logo"
                                    className="max-w-[200px] max-h-[200px] object-contain rounded-lg shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={onLogoDelete}
                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="ลบโลโก้"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 text-sm">ยังไม่มีโลโก้</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                onChange={onLogoUpload}
                                className="hidden"
                                disabled={isUploadingLogo}
                            />
                            <div className={`
                                flex items-center justify-center gap-2 px-4 py-3 
                                border-2 border-dashed border-teal-300 rounded-xl 
                                cursor-pointer hover:bg-teal-50 transition-colors
                                ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}
                            `}>
                                {isUploadingLogo ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                                ) : (
                                    <Upload className="w-5 h-5 text-teal-600" />
                                )}
                                <span className="text-teal-700 font-medium text-sm">
                                    {isUploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดโลโก้ใหม่'}
                                </span>
                            </div>
                        </label>

                        {logoUrl && (
                            <button
                                type="button"
                                onClick={onLogoDelete}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>ลบโลโก้</span>
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                        รองรับไฟล์ PNG, JPG ขนาดไม่เกิน 2MB แนะนำขนาด 200x200 พิกเซล
                    </p>
                </div>
            </section>

            {/* Template Upload Section */}
            <section className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Template เอกสาร DOCX</h2>
                        <p className="text-sm text-gray-500">อัปโหลด template .docx สำหรับสร้างเอกสารอัตโนมัติ</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        {templateUrl ? (
                            <div className="text-center">
                                <div className="p-3 bg-indigo-100 rounded-xl inline-block mb-3">
                                    <FileText className="w-10 h-10 text-indigo-600" />
                                </div>
                                <p className="font-medium text-gray-900 mb-1">Template พร้อมใช้งาน</p>
                                <p className="text-xs text-gray-500 break-all max-w-xs">{templateUrl.split('/').pop()}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500 text-sm">ยังไม่มี template</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <label className="flex-1">
                            <input
                                type="file"
                                accept=".docx"
                                onChange={onTemplateUpload}
                                className="hidden"
                                disabled={isUploadingTemplate}
                            />
                            <div className={`
                                flex items-center justify-center gap-2 px-4 py-3 
                                border-2 border-dashed border-indigo-300 rounded-xl 
                                cursor-pointer hover:bg-indigo-50 transition-colors
                                ${isUploadingTemplate ? 'opacity-50 cursor-not-allowed' : ''}
                            `}>
                                {isUploadingTemplate ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                ) : (
                                    <Upload className="w-5 h-5 text-indigo-600" />
                                )}
                                <span className="text-indigo-700 font-medium text-sm">
                                    {isUploadingTemplate ? 'กำลังอัปโหลด...' : 'อัปโหลด Template ใหม่'}
                                </span>
                            </div>
                        </label>

                        {templateUrl && (
                            <button
                                type="button"
                                onClick={onTemplateDelete}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>ลบ Template</span>
                            </button>
                        )}
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl">
                        <p className="text-sm font-medium text-indigo-900 mb-2">Placeholder ที่รองรับ (คลิกเพื่อคัดลอก):</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-indigo-700">
                            {[
                                '{borrower_name}',
                                '{borrower_phone}',
                                '{equipment_type}',
                                '{quantity}',
                                '{loan_date}',
                                '{return_date}',
                                '{purpose}',
                                '{today_date}'
                            ].map(placeholder => (
                                <code
                                    key={placeholder}
                                    onClick={() => onCopyToClipboard(placeholder)}
                                    className="cursor-pointer hover:bg-indigo-100 p-1.5 rounded transition-colors text-center border border-indigo-200/50 bg-white font-mono"
                                    title="คลิกเพื่อคัดลอก"
                                >
                                    {placeholder}
                                </code>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
