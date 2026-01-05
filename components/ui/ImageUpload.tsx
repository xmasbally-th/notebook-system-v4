'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { uploadEquipmentImage, deleteEquipmentImage } from '@/lib/uploadImage'

interface ImageUploadProps {
    images: string[]
    onChange: (images: string[]) => void
    maxImages?: number
    disabled?: boolean
}

export default function ImageUpload({
    images = [],
    onChange,
    maxImages = 5,
    disabled = false
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return
        if (disabled) return

        setError(null)
        setIsUploading(true)

        try {
            const remainingSlots = maxImages - images.length
            const filesToUpload = Array.from(files).slice(0, remainingSlots)

            if (filesToUpload.length === 0) {
                setError(`อัปโหลดได้สูงสุด ${maxImages} รูป`)
                return
            }

            const uploadPromises = filesToUpload.map(file => uploadEquipmentImage(file))
            const newUrls = await Promise.all(uploadPromises)

            onChange([...images, ...newUrls])
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการอัปโหลด')
        } finally {
            setIsUploading(false)
        }
    }, [images, maxImages, onChange, disabled])

    const handleRemove = useCallback(async (index: number) => {
        if (disabled) return

        const urlToRemove = images[index]
        const newImages = images.filter((_, i) => i !== index)
        onChange(newImages)

        // Try to delete from storage (don't block UI)
        try {
            await deleteEquipmentImage(urlToRemove)
        } catch (err) {
            console.warn('Failed to delete image from storage:', err)
        }
    }, [images, onChange, disabled])

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files)
        }
    }, [handleFiles])

    const canUploadMore = images.length < maxImages

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            {canUploadMore && (
                <div
                    className={`
                        relative border-2 border-dashed rounded-xl p-6 text-center
                        transition-all cursor-pointer
                        ${dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !disabled && inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                        disabled={disabled}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-600">กำลังอัปโหลด...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-blue-50 rounded-full">
                                <Upload className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700">
                                    ลากไฟล์มาวางหรือคลิกเพื่อเลือก
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    รองรับ JPG, PNG, WebP (สูงสุด 5MB ต่อไฟล์)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((url, index) => (
                        <div
                            key={url}
                            className="relative aspect-square group rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                        >
                            <img
                                src={url}
                                alt={`Equipment image ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemove(index)
                                    }}
                                    className="
                                        absolute top-2 right-2 p-1.5 
                                        bg-red-500 text-white rounded-full
                                        opacity-0 group-hover:opacity-100
                                        transition-opacity hover:bg-red-600
                                    "
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                                {index + 1} / {maxImages}
                            </div>
                        </div>
                    ))}

                    {/* Empty slots */}
                    {Array.from({ length: maxImages - images.length }).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50"
                        >
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                    )).slice(0, 3)} {/* Show max 3 empty slots */}
                </div>
            )}

            {/* Upload count indicator */}
            <p className="text-xs text-gray-500 text-right">
                {images.length} / {maxImages} รูป
            </p>
        </div>
    )
}
