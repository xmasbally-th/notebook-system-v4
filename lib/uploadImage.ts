import { createBrowserClient } from '@supabase/ssr'

const BUCKET_NAME = 'equipment-images'

// Get Supabase client for storage operations
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    if (!url || !key) {
        console.error('[uploadImage] Missing Supabase env vars')
        return null
    }
    return createBrowserClient(url, key)
}

/**
 * Compress image before upload
 * Reduces file size while maintaining quality
 */
async function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        img.onload = () => {
            // Calculate new dimensions
            let width = img.width
            let height = img.height

            if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height

            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to compress image'))
                    }
                },
                'image/webp',
                quality
            )
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Generate unique filename with timestamp
 */
function generateFilename(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = 'webp' // Always convert to webp for better compression
    return `${timestamp}-${random}.${extension}`
}

/**
 * Upload image to Supabase Storage
 * - Compresses image before upload
 * - Converts to WebP format
 * - Returns public URL
 */
export async function uploadEquipmentImage(file: File): Promise<string> {
    console.log('[uploadImage] Starting upload for:', file.name)

    const client = getSupabaseClient()
    if (!client) {
        throw new Error('Supabase client not available')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น')
    }

    // Validate file size (max 5MB before compression)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
        throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 5MB')
    }

    // Compress image
    console.log('[uploadImage] Compressing image...')
    const compressedBlob = await compressImage(file)
    console.log('[uploadImage] Compressed to:', compressedBlob.size, 'bytes')

    // Generate filename
    const filename = generateFilename(file.name)
    const filePath = `equipment/${filename}`

    // Upload to Supabase Storage
    console.log('[uploadImage] Uploading to:', filePath)
    const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedBlob, {
            contentType: 'image/webp',
            cacheControl: '31536000', // 1 year cache
            upsert: false
        })

    if (error) {
        console.error('[uploadImage] Upload error:', error)
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้: ' + error.message)
    }

    // Get public URL
    const { data: urlData } = client.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

    console.log('[uploadImage] Success:', urlData.publicUrl)
    return urlData.publicUrl
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteEquipmentImage(url: string): Promise<void> {
    console.log('[uploadImage] Deleting:', url)

    const client = getSupabaseClient()
    if (!client) {
        throw new Error('Supabase client not available')
    }

    // Extract path from URL
    const urlParts = url.split('/')
    const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME)

    if (bucketIndex === -1) {
        console.warn('[uploadImage] Could not find bucket in URL:', url)
        return
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/')

    const { error } = await client.storage
        .from(BUCKET_NAME)
        .remove([filePath])

    if (error) {
        console.error('[uploadImage] Delete error:', error)
        throw new Error('ไม่สามารถลบรูปภาพได้')
    }

    console.log('[uploadImage] Deleted successfully')
}

/**
 * Upload multiple images
 * Returns array of public URLs
 */
export async function uploadMultipleImages(files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => uploadEquipmentImage(file))
    return Promise.all(uploadPromises)
}
