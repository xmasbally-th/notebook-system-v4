import { redirect } from 'next/navigation'

// /admin/notifications ถูกรวมเข้ากับ /admin/settings แท็บ "แจ้งเตือน"
export default function AdminNotificationsRedirect() {
    redirect('/admin/settings?tab=notifications')
}
