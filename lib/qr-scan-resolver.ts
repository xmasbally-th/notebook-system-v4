/**
 * Helper to extract equipment UUID or identifier from a scanned QR text, URL, or Barcode
 */
export function extractEquipmentIdentifier(scannedText: string): string {
    if (!scannedText) return ''
    const clean = scannedText.trim()

    // 1. Matches UUID in /eq/<uuid> or /equipment/<uuid>
    const urlUuidMatch = clean.match(/\/(?:equipment|eq)\/([0-9a-fA-F-]{36})/)
    if (urlUuidMatch && urlUuidMatch[1]) {
        return urlUuidMatch[1]
    }

    // 2. Matches path param in /eq/<id> or /equipment/<id>
    const pathMatch = clean.match(/\/(?:equipment|eq)\/([^\/\?#]+)/)
    if (pathMatch && pathMatch[1]) {
        return decodeURIComponent(pathMatch[1])
    }

    // 3. Raw UUID string
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clean)
    if (isUuid) {
        return clean
    }

    // 4. Return trimmed raw text (e.g. equipment_number like NB-001)
    return clean
}
