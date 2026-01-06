const BUCKET_NAME = 'equipment-images'

// Get Supabase credentials
function getSupabaseCredentials() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return { url, key }
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
 * Upload image to Supabase Storage using direct fetch API
 * - Compresses image before upload
 * - Converts to WebP format
 * - Returns public URL
 */
export async function uploadEquipmentImage(file: File): Promise<string> {
    console.log('[uploadImage] Starting upload for:', file.name)

    const { url, key } = getSupabaseCredentials()
    if (!url || !key) {
        throw new Error('Supabase credentials not available')
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

    // Upload using direct fetch API to Supabase Storage
    console.log('[uploadImage] Uploading to:', filePath)
    const uploadUrl = `${url}/storage/v1/object/${BUCKET_NAME}/${filePath}`

    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${key}`,
            'apikey': key,
            'Content-Type': 'image/webp',
            'x-upsert': 'false'
        },
        body: compressedBlob
    })

    console.log('[uploadImage] Response status:', response.status)

    if (!response.ok) {
        const errorText = await response.text()
        console.error('[uploadImage] Upload error:', errorText)
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้: ' + errorText)
    }

    // Construct public URL
    const publicUrl = `${url}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`
    console.log('[uploadImage] Success:', publicUrl)

    return publicUrl
}

/**
 * Delete image from Supabase Storage using direct fetch API
 */
export async function deleteEquipmentImage(imageUrl: string): Promise<void> {
    console.log('[uploadImage] Deleting:', imageUrl)

    const { url, key } = getSupabaseCredentials()
    if (!url || !key) {
        throw new Error('Supabase credentials not available')
    }

    // Extract path from URL
    const urlParts = imageUrl.split('/')
    const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME)

    if (bucketIndex === -1) {
        console.warn('[uploadImage] Could not find bucket in URL:', imageUrl)
        return
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/')
    const deleteUrl = `${url}/storage/v1/object/${BUCKET_NAME}/${filePath}`

    const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${key}`,
            'apikey': key
        }
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('[uploadImage] Delete error:', errorText)
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
