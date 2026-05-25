'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileSpreadsheet, Calendar, Package, AlertCircle, CheckCircle, Download } from 'lucide-react'
import {
    DataType,
    parseImportFile,
    validateImportData,
    importData,
    ImportResult,
    RATE_LIMITS
} from '@/lib/dataManagement'
import { logStaffActivity } from '@/lib/staffActivityLog'

interface ImportTabProps {
    userId: string
}

export default function ImportTab({ userId }: ImportTabProps) {
    const [dataType, setDataType] = useState<DataType>('equipment')
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<any[] | null>(null)
    const [validationErrors, setValidationErrors] = useState<{ row: number; message: string }[]>([])
    const [parseErrors, setParseErrors] = useState<string[]>([])
    const [isValidating, setIsValidating] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const dataTypeOptions = [
        { value: 'loans' as DataType, label: 'รายการยืม-คืน', icon: FileSpreadsheet },
        { value: 'reservations' as DataType, label: 'รายการจอง', icon: Calendar },
        { value: 'equipment' as DataType, label: 'ข้อมูลอุปกรณ์', icon: Package }
    ]

    const handleFileSelect = useCallback(async (selectedFile: File) => {
        setFile(selectedFile)
        setParsedData(null)
        setValidationErrors([])
        setParseErrors([])
        setImportResult(null)
        setIsValidating(true)

        try {
            const { data, errors } = await parseImportFile(selectedFile)
            setParseErrors(errors)

            if (data.length > 0) {
                const validation = await validateImportData(data, dataType)
                setParsedData(validation.valid)
                setValidationErrors(validation.errors)
            }
        } catch (err) {
            setParseErrors([(err as Error).message])
        } finally {
            setIsValidating(false)
        }
    }, [dataType])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.json'))) {
            handleFileSelect(droppedFile)
        }
    }, [handleFileSelect])

    const handleImport = useCallback(async () => {
        if (!parsedData || parsedData.length === 0) return

        setIsImporting(true)
        try {
            const result = await importData(parsedData, dataType)
            setImportResult(result)

            // Log activity
            await logStaffActivity({
                staffId: userId,
                staffRole: 'admin',
                actionType: 'import_data',
                targetType: 'loan',
                targetId: 'bulk',
                details: {
                    dataType,
                    filename: file?.name,
                    totalRecords: parsedData.length,
                    success: result.success,
                    failed: result.failed
                }
            })
        } catch (err) {
            setImportResult({
                success: 0,
                failed: parsedData.length,
                errors: [{ row: 0, message: (err as Error).message }]
            })
        } finally {
            setIsImporting(false)
        }
    }, [parsedData, dataType, userId, file])

    const resetForm = () => {
        setFile(null)
        setParsedData(null)
        setValidationErrors([])
        setParseErrors([])
        setImportResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const downloadCSVTemplate = () => {
        let headers = ''
        let filename = ''
        if (dataType === 'loans') {
            headers = 'user_id,equipment_id,start_date,end_date,status,purpose,notes'
            filename = 'template_loans.csv'
        } else if (dataType === 'reservations') {
            headers = 'user_id,equipment_id,start_date,end_date,status'
            filename = 'template_reservations.csv'
        } else if (dataType === 'equipment') {
            headers = 'equipment_number,name,brand,model,serial_number,status'
            filename = 'template_equipment.csv'
        }

        if (!headers) return

        const BOM = '\uFEFF'
        const blob = new Blob([BOM + headers], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-semibold text-purple-900 mb-1">📥 นำเข้าข้อมูล</h3>
                    <p className="text-sm text-purple-700">
                        อัปโหลดไฟล์ CSV หรือ JSON เพื่อนำเข้าข้อมูล ระบบจะตรวจสอบความถูกต้องก่อนนำเข้า
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                        ⚠️ จำกัด {RATE_LIMITS.import.maxRecords} รายการต่อครั้ง
                    </p>
                </div>
                <button
                    onClick={downloadCSVTemplate}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm self-start sm:self-center"
                >
                    <Download className="w-3.5 h-3.5" />
                    ดาวน์โหลดเทมเพลต CSV
                </button>
            </div>

            {/* Data Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">ประเภทข้อมูล</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {dataTypeOptions.map(option => {
                        const Icon = option.icon
                        const isSelected = dataType === option.value
                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setDataType(option.value)
                                    resetForm()
                                }}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSelected
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                                <span className="font-medium">{option.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* File Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">อัปโหลดไฟล์</label>
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                        ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                    />
                    {isValidating ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-purple-700">กำลังตรวจสอบ...</span>
                        </div>
                    ) : file ? (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                            <span className="font-medium text-green-700">{file.name}</span>
                            <span className="text-sm text-gray-500">คลิกเพื่อเลือกไฟล์ใหม่</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="w-10 h-10 text-gray-400" />
                            <span className="font-medium text-gray-700">ลากไฟล์มาวาง หรือ คลิกเลือก</span>
                            <span className="text-sm text-gray-500">รองรับ .csv และ .json</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Parse Errors */}
            {parseErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                        <AlertCircle className="w-5 h-5" />
                        ไม่สามารถอ่านไฟล์ได้
                    </div>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                        {parseErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                        <AlertCircle className="w-5 h-5" />
                        พบข้อผิดพลาด {validationErrors.length} รายการ (จะถูกข้าม)
                    </div>
                    <ul className="text-sm text-orange-600 max-h-32 overflow-y-auto">
                        {validationErrors.slice(0, 5).map((err, i) => (
                            <li key={i}>แถวที่ {err.row}: {err.message}</li>
                        ))}
                        {validationErrors.length > 5 && (
                            <li className="text-orange-500">...และอีก {validationErrors.length - 5} รายการ</li>
                        )}
                    </ul>
                </div>
            )}

            {/* Preview */}
            {parsedData && parsedData.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">ข้อมูลที่พร้อมนำเข้า</h4>
                        <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            {parsedData.length} รายการ
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                                    {Object.keys(parsedData[0]).slice(0, 4).map(col => (
                                        <th key={col} className="px-3 py-2 text-left font-medium text-gray-600">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {parsedData.slice(0, 5).map((row, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                                        {Object.keys(row).slice(0, 4).map(col => (
                                            <td key={col} className="px-3 py-2 text-gray-700 max-w-[120px] truncate">
                                                {String(row[col] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedData.length > 5 && (
                            <p className="text-sm text-gray-500 mt-2 text-center">
                                แสดง 5 รายการแรกจากทั้งหมด {parsedData.length} รายการ
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Import Result */}
            {importResult && (
                <div className={`rounded-xl p-4 ${importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-2 font-medium mb-2">
                        <CheckCircle className={`w-5 h-5 ${importResult.failed === 0 ? 'text-green-600' : 'text-yellow-600'}`} />
                        <span className={importResult.failed === 0 ? 'text-green-700' : 'text-yellow-700'}>
                            ผลการนำเข้า
                        </span>
                    </div>
                    <div className="text-sm space-y-1">
                        <p className="text-green-700">✓ สำเร็จ: {importResult.success} รายการ</p>
                        {importResult.failed > 0 && (
                            <p className="text-red-600">✗ ล้มเหลว: {importResult.failed} รายการ</p>
                        )}
                    </div>
                    {importResult.errors.length > 0 && (
                        <ul className="text-xs text-red-600 mt-2 max-h-20 overflow-y-auto">
                            {importResult.errors.slice(0, 3).map((err, i) => (
                                <li key={i}>{err.message}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                    onClick={resetForm}
                    disabled={!file}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    ล้างข้อมูล
                </button>
                <button
                    onClick={handleImport}
                    disabled={isImporting || !parsedData || parsedData.length === 0 || importResult !== null}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isImporting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Upload className="w-5 h-5" />
                    )}
                    นำเข้า {parsedData?.length || 0} รายการ
                </button>
            </div>
        </div>
    )
}
