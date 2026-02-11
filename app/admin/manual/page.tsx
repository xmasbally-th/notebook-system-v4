'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'
import {
    LayoutDashboard, Users, Package, ClipboardList, RotateCcw,
    CalendarPlus, FileStack, Activity, MessageSquare, Database,
    BarChart3, Settings, HelpCircle, CheckCircle2, AlertTriangle,
    Search, Plus, Edit, Trash2, ArrowRight
} from 'lucide-react'
import React from 'react'

export default function AdminManualPage() {
    return (
        <AdminLayout title="คู่มือการใช้งาน (สำหรับผู้ดูแลระบบ)" subtitle="แนะนำการใช้งานระบบสำหรับผู้ดูแลระบบ (Admin)">
            <div className="max-w-6xl mx-auto">
                {/* Introduction */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 mb-8 text-white shadow-lg">
                    <div className="flex items-start gap-6">
                        <div className="p-3 bg-white/20 rounded-xl hidden sm:block">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-3">ยินดีต้อนรับสู่ส่วนผู้ดูแลระบบ (Admin)</h2>
                            <p className="text-blue-100 leading-relaxed text-lg">
                                คู่มือนี้จะช่วยให้คุณบริหารจัดการระบบได้อย่างเต็มประสิทธิภาพ ครอบคลุมตั้งแต่การจัดการผู้ใช้,
                                การจัดการอุปกรณ์, การอนุมัติคำขอ, ไปจนถึงการดูรายงานและการตั้งค่าระบบ
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Nav */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10 text-center">
                    <QuickNavLink href="#dashboard" icon={LayoutDashboard} label="Dashboard" color="blue" />
                    <QuickNavLink href="#users" icon={Users} label="ผู้ใช้งาน" color="indigo" />
                    <QuickNavLink href="#equipment" icon={Package} label="อุปกรณ์" color="orange" />
                    <QuickNavLink href="#loans" icon={ClipboardList} label="การยืม-คืน" color="green" />
                    <QuickNavLink href="#reports" icon={BarChart3} label="รายงาน" color="purple" />
                    <QuickNavLink href="#settings" icon={Settings} label="ตั้งค่าฯ" color="gray" />
                </div>

                <div className="space-y-12">
                    {/* 1. Dashboard */}
                    <Section id="dashboard" title="1. ภาพรวมระบบ (Dashboard)" icon={LayoutDashboard} color="blue">
                        <p className="mb-4 text-gray-600">
                            หน้า <strong>Dashboard</strong> สรุปข้อมูลสำคัญเพื่อให้ผู้ดูแลระบบทราบสถานการณ์ปัจจุบันของระบบ
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureItem title="สถิติหลัก" desc="จำนวนอุปกรณ์ทั้งหมด, คำขอรออนุมัติ, เครื่องที่กำลังถูกยืม, และผู้ใช้งานในระบบ" />
                            <FeatureItem title="กราฟแสดงผล" desc="แสดงแนวโน้มการยืม-คืนในช่วงเวลาที่ผ่านมา" />
                            <FeatureItem title="คำขอล่าสุด" desc="รายการคำขอยืมที่เพิ่งเข้ามาใหม่ เพื่อให้จัดการได้ทันที" />
                            <FeatureItem title="การคืนที่ใกล้ถึงกำหนด" desc="รายการที่กำลังจะครบกำหนดส่งคืน" />
                        </ul>
                    </Section>

                    {/* 2. User Management */}
                    <Section id="users" title="2. การจัดการผู้ใช้งาน (User Management)" icon={Users} color="indigo">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการผู้ใช้"</strong> ช่วยให้คุณดูแลบัญชีผู้ใช้งานทั้งหมดในระบบ
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card title="การยืนยันตัวตน" icon={CheckCircle2} color="green">
                                <p className="text-sm text-gray-600">
                                    ผู้ใช้ใหม่ที่ลงทะเบียนเข้ามา อาจต้องรอการอนุมัติ (ขึ้นอยู่กับการตั้งค่า)
                                    คุณสามารถ 'อนุมัติ' หรือ 'ระงับ' สิทธิ์การใช้งานได้ที่นี่
                                </p>
                            </Card>
                            <Card title="แก้ไขข้อมูล" icon={Edit} color="blue">
                                <p className="text-sm text-gray-600">
                                    ดูรายละเอียดและแก้ไขข้อมูลส่วนตัวของผู้ใช้ เช่น ชื่อ, หน่วยงาน, เบอร์โทรศัพท์, หรือเปลี่ยน Role (Admin/Staff/User)
                                </p>
                            </Card>
                            <Card title="ลบผู้ใช้" icon={Trash2} color="red">
                                <p className="text-sm text-gray-600">
                                    ลบบัญชีผู้ใช้ที่ออกจากองค์กรไปแล้ว (ระบบจะเก็บประวัติการยืมคืนไว้อ้างอิง แต่ข้อมูลส่วนตัวจะถูกลบ/Anonymize)
                                </p>
                            </Card>
                        </div>
                    </Section>

                    {/* 3. Equipment Management */}
                    <Section id="equipment" title="3. การจัดการอุปกรณ์ (Equipment)" icon={Package} color="orange">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการอุปกรณ์"</strong> และ <strong>"ประเภทอุปกรณ์"</strong> คือหัวใจสำคัญของระบบ
                        </p>

                        <div className="space-y-4">
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-5">
                                <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                                    <Plus className="w-5 h-5" /> การเพิ่มอุปกรณ์ใหม่
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    <li>ไปที่หน้าจัดการอุปกรณ์ กดปุ่ม "เพิ่มอุปกรณ์"</li>
                                    <li>กรอกรายละเอียด: ชื่อ, Serial Number, ประเภท, สถานะเริ่มต้น</li>
                                    <li>อัปโหลดรูปภาพอุปกรณ์ (ถ้ามี) เพื่อให้ผู้ใช้เห็นภาพชัดเจน</li>
                                    <li>บันทึกข้อมูล</li>
                                </ol>
                            </div>

                            <div className="flex gap-4 flex-col md:flex-row">
                                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-gray-800 mb-2">สถานะอุปกรณ์</h5>
                                    <p className="text-sm text-gray-600">
                                        สามารถปรับสถานะได้ เช่น "พร้อมใช้งาน", "ส่งซ่อม", หรือ "จำหน่ายออก"
                                        (เครื่องที่ส่งซ่อมจะไม่แสดงให้ผู้ใช้กดจอง/ยืม)
                                    </p>
                                </div>
                                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-gray-800 mb-2">QR Code</h5>
                                    <p className="text-sm text-gray-600">
                                        ระบบสามารถสร้าง QR Code สำหรับติดที่ตัวอุปกรณ์ เพื่อให้ง่ายต่อการสแกนตรวจสอบ
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 4. Loan & Reservation Operations */}
                    <Section id="loans" title="4. การจัดการคำขอยืมและจอง" icon={ClipboardList} color="green">
                        <p className="mb-4 text-gray-600">
                            ส่วนงานนี้คล้ายกับของเจ้าหน้าที่ (Staff) แต่ Admin มีสิทธิ์จัดการได้ทุกขั้นตอน
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureItem
                                title="คิวอาร์โค้ด & การค้นหา"
                                desc="ค้นหารายการยืมได้ง่ายๆ ผ่านชื่อผู้ใช้, รหัสอุปกรณ์ หรือเลขที่คำขอ"
                            />
                            <FeatureItem
                                title="การยกเลิกคำขอ"
                                desc="Admin สามารถยกเลิกคำขอยืมหรือการจองได้ทุกสถานะ กรณีมีเหตุจำเป็นฉุกเฉิน"
                            />
                            <FeatureItem
                                title="ยืมพิเศษ (Special Loans)"
                                desc="สำหรับบันทึกการยืมที่อยู่นอกเหนือระเบียบปกติ หรือการยืมเพื่อใช้ในกิจการส่วนกลาง"
                            />
                            <FeatureItem
                                title="ประวัติการทำงาน (Staff Activity)"
                                desc="ตรวจสอบ Log การทำงานของเจ้าหน้าที่ ว่าใครเป็นผู้อนุมัติหรือรับคืนรายการไหน"
                            />
                        </div>
                    </Section>

                    {/* 5. Reports & Evaluations */}
                    <Section id="reports" title="5. รายงานและการประเมินผล" icon={BarChart3} color="purple">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    ระบบรายงาน
                                </h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> สรุปยอดการยืม-คืน ประจำวัน/เดือน/ปี</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> อุปกรณ์ยอดนิยม (Top Borrowed)</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> สถิติการส่งคืนล่าช้า</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> Export ข้อมูลเป็น Excel/CSV</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    การประเมินผล
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                    ดูคะแนนความพึงพอใจและข้อเสนอแนะจากผู้ใช้งาน เพื่อนำมาปรับปรุงการให้บริการ
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* 6. Settings */}
                    <Section id="settings" title="6. ตั้งค่าระบบ (Settings)" icon={Settings} color="gray">
                        <p className="mb-4 text-gray-600">
                            กำหนดค่าพื้นฐานของระบบเพื่อให้สอดคล้องกับระเบียบขององค์กร
                        </p>
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <li className="flex items-start gap-2">
                                    <Settings className="w-4 h-4 text-gray-500 mt-1" />
                                    <span className="text-sm"><strong>กำหนดระยะเวลายืม:</strong> ตั้งค่าจำนวนวันที่อนุญาตให้ยืมสูงสุดต่อครั้ง</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Settings className="w-4 h-4 text-gray-500 mt-1" />
                                    <span className="text-sm"><strong>ขีดจำกัดการยืม:</strong> จำกัดจำนวนอุปกรณ์ที่ยืมได้พร้อมกันต่อคน</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Settings className="w-4 h-4 text-gray-500 mt-1" />
                                    <span className="text-sm"><strong>การแจ้งเตือน:</strong> ตั้งค่าข้อความแจ้งเตือนผ่าน Line หรือ Email</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Settings className="w-4 h-4 text-gray-500 mt-1" />
                                    <span className="text-sm"><strong>จัดการสิทธิ์:</strong> กำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ของ Staff และ User</span>
                                </li>
                            </ul>
                        </div>
                    </Section>
                </div>

                {/* Footer Help */}
                <div className="mt-16 text-center border-t border-gray-200 pt-10 pb-8">
                    <p className="text-gray-500 text-sm">
                        คู่มือนี้เป็นเพียงแนวทางเบื้องต้น หากมีข้อสงสัยเชิงเทคนิค โปรดติดต่อทีมพัฒนาระบบ
                    </p>
                </div>
            </div>
        </AdminLayout>
    )
}

function Section({ id, title, icon: Icon, children, color }: { id: string; title: string; icon: any; children: React.ReactNode; color: string }) {
    const colors: Record<string, string> = {
        blue: 'text-blue-700 bg-blue-100',
        indigo: 'text-indigo-700 bg-indigo-100',
        orange: 'text-orange-700 bg-orange-100',
        green: 'text-green-700 bg-green-100',
        purple: 'text-purple-700 bg-purple-100',
        gray: 'text-gray-700 bg-gray-100',
    }
    const [textClass, bgClass] = colors[color].split(' ')

    return (
        <section id={id} className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-lg ${bgClass}`}>
                    <Icon className={`w-6 h-6 ${textClass}`} />
                </div>
                <h3 className={`text-xl font-bold ${textClass}`}>{title}</h3>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                {children}
            </div>
        </section>
    )
}

function FeatureItem({ title, desc }: { title: string; desc: string }) {
    return (
        <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-1.5 h-1.5 mt-2 rounded-full bg-blue-500 shrink-0" />
            <div>
                <strong className="block text-gray-900 text-sm mb-0.5">{title}</strong>
                <span className="text-xs text-gray-500 leading-relaxed">{desc}</span>
            </div>
        </li>
    )
}

function QuickNavLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'hover:text-blue-600 hover:bg-blue-50',
        indigo: 'hover:text-indigo-600 hover:bg-indigo-50',
        orange: 'hover:text-orange-600 hover:bg-orange-50',
        green: 'hover:text-green-600 hover:bg-green-50',
        purple: 'hover:text-purple-600 hover:bg-purple-50',
        gray: 'hover:text-gray-600 hover:bg-gray-50',
    }

    return (
        <a href={href} className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all text-gray-600 ${colorClasses[color]}`}>
            <div className="p-2 rounded-full bg-white shadow-sm border border-gray-100 mb-2">
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">{label}</span>
        </a>
    )
}

function Card({ title, icon: Icon, children, color }: { title: string; icon: any; children: React.ReactNode; color: string }) {
    const colors: Record<string, string> = {
        green: 'text-green-600 bg-green-50',
        blue: 'text-blue-600 bg-blue-50',
        red: 'text-red-600 bg-red-50',
    }
    const [textClass, bgClass] = colors[color].split(' ')

    return (
        <div className="p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${bgClass}`}>
                    <Icon className={`w-4 h-4 ${textClass}`} />
                </div>
                <h4 className="font-bold text-gray-800">{title}</h4>
            </div>
            {children}
        </div>
    )
}
