/**
 * DOCX Template Generator
 * 
 * Uses docxtemplater to generate DOCX files from templates
 * with placeholder replacement.
 * 
 * Required packages:
 * npm install docxtemplater pizzip file-saver
 */

import { SpecialLoan } from '@/lib/specialLoans'

// Format date to Thai locale
function formatThaiDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
}

// Format short date
function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

/**
 * Template data interface for special loans
 */
export interface SpecialLoanTemplateData {
    borrower_name: string
    borrower_phone: string
    title: string
    department: string
    equipment_type: string
    quantity: number
    loan_date: string
    loan_date_short: string
    return_date: string
    return_date_short: string
    purpose: string
    organization: string
    today_date: string
    equipment_list: Array<{
        index: number
        equipment_name: string
        equipment_number: string
        note: string
    }>
}

/**
 * Convert SpecialLoan to template data
 */
export function loanToTemplateData(loan: SpecialLoan, organization: string = 'คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง'): SpecialLoanTemplateData {
    const today = new Date().toISOString()

    return {
        borrower_name: loan.borrower_name,
        borrower_phone: loan.borrower_phone || '',
        title: loan.borrower_title || '',
        department: loan.borrower_department || '',
        equipment_type: loan.equipment_type_name,
        quantity: loan.quantity,
        loan_date: formatThaiDate(loan.loan_date),
        loan_date_short: formatShortDate(loan.loan_date),
        return_date: formatThaiDate(loan.return_date),
        return_date_short: formatShortDate(loan.return_date),
        purpose: loan.purpose,
        organization: organization,
        today_date: formatThaiDate(today),
        equipment_list: loan.equipment_numbers.map((num, idx) => ({
            index: idx + 1,
            equipment_name: loan.equipment_type_name,
            equipment_number: num,
            note: ''
        }))
    }
}

/**
 * Generate DOCX from template URL and loan data
 */
export async function generateDocxFromTemplate(
    templateUrl: string,
    loan: SpecialLoan
): Promise<void> {
    try {
        // Dynamically import required libraries (client-side only)
        const [{ default: Docxtemplater }, { default: PizZip }, { saveAs }] = await Promise.all([
            import('docxtemplater'),
            import('pizzip'),
            import('file-saver')
        ])

        // Fetch template from URL
        const response = await fetch(templateUrl)
        if (!response.ok) {
            throw new Error('ไม่สามารถโหลด template ได้')
        }

        const templateArrayBuffer = await response.arrayBuffer()

        // Load template into PizZip
        const zip = new PizZip(templateArrayBuffer)

        // Create Docxtemplater instance
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        })

        // Convert loan to template data
        const data = loanToTemplateData(loan)

        // Render template with data
        doc.render(data)

        // Generate output
        const outputBlob = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })

        // Download file
        const filename = `ใบยืม_${loan.borrower_name}_${formatShortDate(loan.loan_date)}.docx`
        saveAs(outputBlob, filename)

    } catch (error: any) {
        console.error('[docxGenerator] Error:', error)
        throw new Error(error.message || 'ไม่สามารถสร้างเอกสารได้')
    }
}

/**
 * Check if template URL is valid
 */
export async function validateTemplateUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' })
        return response.ok
    } catch {
        return false
    }
}
