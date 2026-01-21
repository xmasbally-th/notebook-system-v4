import React from 'react'
import { Mail, Phone, MapPin, Github } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <h3 className="text-white text-lg font-bold">Notebook Lending System</h3>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                            A centralized platform for faculty and students to borrow equipment efficiently.
                            Managed by the IT Department.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors text-white">
                                <Github className="w-4 h-4" />
                            </a>
                            {/* Add more social icons if needed */}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">ลิงก์ด่วน</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/" className="hover:text-blue-400 transition-colors">หน้าแรก</a></li>
                            <li><a href="/equipment" className="hover:text-blue-400 transition-colors">อุปกรณ์</a></li>
                            <li><a href="/user-guide" className="hover:text-blue-400 transition-colors">คู่มือการใช้งาน</a></li>
                            <li><a href="/login" className="hover:text-blue-400 transition-colors">เข้าสู่ระบบ</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Contact Us</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                                <span>ห้องบริการวิชาการ ชั้น 2<br />คณะวิทยาการจัดการ มหาวิทยาลัยราชภัฏลำปาง</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                                <span>089-8555668</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                                <span>xmasball@g.lpru.ac.th</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Notebook Lending System. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
