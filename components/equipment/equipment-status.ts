import { CheckCircle, Users, Wrench, Package } from 'lucide-react'

export const STATUS_CONFIG = {
    active: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700', icon: CheckCircle, canBorrow: true },
    ready: { label: 'พร้อมให้ยืม', color: 'bg-green-100 text-green-700', icon: CheckCircle, canBorrow: true },
    borrowed: { label: 'กำลังถูกยืม', color: 'bg-orange-100 text-orange-700', icon: Users, canBorrow: false },
    maintenance: { label: 'ซ่อมบำรุง', color: 'bg-yellow-100 text-yellow-700', icon: Wrench, canBorrow: false },
    retired: { label: 'เลิกใช้งาน', color: 'bg-gray-100 text-gray-600', icon: Package, canBorrow: false },
}
