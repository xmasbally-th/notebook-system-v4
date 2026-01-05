/**
 * Thai Date/Time Formatting Utilities
 * แปลงวันที่และเวลาเป็นรูปแบบไทย (พุทธศักราช)
 */

/**
 * แปลง Date เป็น วว/ดด/ปปปป (พ.ศ.)
 * @example formatThaiDate('2026-01-05') => '05/01/2569'
 */
export function formatThaiDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const buddhistYear = d.getFullYear() + 543

    return `${day}/${month}/${buddhistYear}`
}

/**
 * แปลง Date เป็น HH:mm (24 ชั่วโมง)
 * @example formatThaiTime('2026-01-05T14:30:00') => '14:30'
 */
export function formatThaiTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${hours}:${minutes}`
}

/**
 * แปลง Date เป็น วว/ดด/ปปปป เวลา HH:mm
 * @example formatThaiDateTime('2026-01-05T14:30:00') => '05/01/2569 เวลา 14:30'
 */
export function formatThaiDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    return `${formatThaiDate(d)} เวลา ${formatThaiTime(d)}`
}

/**
 * แปลง Date เป็นข้อความวันที่แบบยาว
 * @example formatThaiDateLong('2026-01-05') => '5 มกราคม 2569'
 */
export function formatThaiDateLong(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]

    const day = d.getDate()
    const month = thaiMonths[d.getMonth()]
    const buddhistYear = d.getFullYear() + 543

    return `${day} ${month} ${buddhistYear}`
}

/**
 * แปลง Date เป็นข้อความวันที่แบบสั้น
 * @example formatThaiDateShort('2026-01-05') => '5 ม.ค. 69'
 */
export function formatThaiDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    const thaiMonthsShort = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
        'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
        'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ]

    const day = d.getDate()
    const month = thaiMonthsShort[d.getMonth()]
    const buddhistYear = (d.getFullYear() + 543) % 100 // แสดงเฉพาะ 2 หลักสุดท้าย

    return `${day} ${month} ${buddhistYear}`
}

/**
 * รวม date กับ time string เป็น Date object
 * @example combineDateAndTime('2026-01-05', '14:30') => Date
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date(dateStr)
    date.setHours(hours, minutes, 0, 0)
    return date
}
