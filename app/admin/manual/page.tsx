'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import Link from 'next/link'
import {
    LayoutDashboard, Users, Package, ClipboardList, RotateCcw,
    CalendarPlus, FileStack, Activity, MessageSquare, Database,
    BarChart3, Settings, HelpCircle, CheckCircle2, AlertTriangle,
    Search, Plus, Edit, Trash2, ArrowRight, Star, Shield, Bell,
    Archive, Printer
} from 'lucide-react'
import React from 'react'

export default function AdminManualPage() {
    return (
        <AdminLayout title="คู่มือการใช้งาน (สำหรับผู้ดูแลระบบ)" subtitle="แนะนำการใช้งานระบบสำหรับผู้ดูแลระบบ (Admin) — Notebook System V5">
            <div className="max-w-6xl mx-auto">
                {/* Introduction */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-8 mb-8 text-white shadow-lg">
                    <div className="flex items-start gap-6">
                        <div className="p-3 bg-white/20 rounded-xl hidden sm:block">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 w-full">
                                <h2 className="text-2xl font-bold">ยินดีต้อนรับสู่ส่วนผู้ดูแลระบบ (Admin)</h2>
                                <button 
                                    onClick={() => window.print()}
                                    className="print-hidden inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 backdrop-blur-sm self-start sm:self-auto text-sm font-medium"
                                >
                                    <Printer className="w-4 h-4" />
                                    Export PDF
                                </button>
                            </div>
                            <p className="text-blue-100 leading-relaxed text-lg">
                                คู่มือนี้ครอบคลุมทุกฟีเจอร์สำหรับ Admin ตั้งแต่การจัดการผู้ใช้, อุปกรณ์, การอนุมัติคำขอ,
                                ดูรายงานสถิติ, ไปจนถึง Support Chat และการตั้งค่า Discord Webhook
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-3 mb-10 text-center">
                    <QuickNavLink href="#dashboard" icon={LayoutDashboard} label="Dashboard" color="blue" />
                    <QuickNavLink href="#users" icon={Users} label="ผู้ใช้งาน" color="indigo" />
                    <QuickNavLink href="#equipment" icon={Package} label="อุปกรณ์" color="orange" />
                    <QuickNavLink href="#loans" icon={ClipboardList} label="การยืม-คืน" color="green" />
                    <QuickNavLink href="#reports" icon={BarChart3} label="รายงาน" color="purple" />
                    <QuickNavLink href="#support" icon={MessageSquare} label="Support Chat" color="teal" />
                    <QuickNavLink href="#welpru" icon={Bell} label="แจ้งเตือน" color="blue" />
                    <QuickNavLink href="#data" icon={Database} label="จัดการข้อมูล" color="amber" />
                    <QuickNavLink href="#settings" icon={Settings} label="ตั้งค่า" color="gray" />
                </div>

                <div className="space-y-12">
                    {/* 1. Dashboard */}
                    <Section id="dashboard" title="1. ภาพรวมระบบ (Dashboard)" icon={LayoutDashboard} color="blue">
                        <p className="mb-4 text-gray-600">
                            หน้า <strong>Dashboard</strong> สรุปข้อมูลสำคัญเพื่อให้ผู้ดูแลระบบทราบสถานการณ์ปัจจุบันในทันที
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureItem title="สถิติหลัก" desc="จำนวนอุปกรณ์ทั้งหมด แยกสถานะว่าง/ถูกยืม/ซ่อมบำรุง, คำขอรออนุมัติ, และผู้ใช้งานในระบบ" />
                            <FeatureItem title="กราฟแสดงผล" desc="แสดงแนวโน้มการยืม-คืนรายเดือน เพื่อวิเคราะห์การใช้งานในภาพรวม" />
                            <FeatureItem title="คำขอยืมล่าสุด" desc="รายการคำขอที่เพิ่งเข้ามาใหม่ เพื่อให้ดำเนินการได้ทันที" />
                            <FeatureItem title="อุปกรณ์ค้างคืน" desc="รายการที่เลยกำหนดส่งคืน — ต้องดำเนินการติดตามผู้ยืม" />
                        </ul>
                    </Section>

                    {/* 2. User Management */}
                    <Section id="users" title="2. การจัดการผู้ใช้งาน (User Management)" icon={Users} color="indigo">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการผู้ใช้"</strong> ช่วยให้คุณดูแลบัญชีผู้ใช้งานทั้งหมดในระบบ
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Card title="อนุมัติ / ระงับ" icon={CheckCircle2} color="green">
                                <p className="text-sm text-gray-600">
                                    ผู้ใช้ใหม่ที่ลงทะเบียนเข้ามาจะรอการอนุมัติจากคุณก่อน สามารถ <strong>อนุมัติ</strong> หรือ <strong>ระงับ</strong> สิทธิ์การใช้งานได้ที่นี่
                                </p>
                            </Card>
                            <Card title="แก้ไขข้อมูล / Role" icon={Edit} color="blue">
                                <p className="text-sm text-gray-600">
                                    แก้ไขชื่อ, หน่วยงาน, เบอร์โทร หรือเปลี่ยน Role ได้ทันที
                                    <br />บทบาท: <strong>User / Staff / Admin</strong>
                                </p>
                            </Card>
                            <Card title="ลบ / จำกัดสิทธิ์" icon={Trash2} color="red">
                                <p className="text-sm text-gray-600">
                                    ลบบัญชีผู้ใช้ที่ออกจากองค์กรแล้ว หรือระงับชั่วคราวแทนการลบ เพื่อรักษาประวัติการยืม
                                </p>
                            </Card>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-800">
                            💡 <strong>ทิป:</strong> ใช้ <strong>"ระงับ"</strong> แทนการลบเสมอ เพื่อเก็บประวัติการยืม-คืนไว้อ้างอิงภายหลัง
                        </div>
                    </Section>

                    {/* 3. Equipment Management */}
                    <Section id="equipment" title="3. การจัดการอุปกรณ์ (Equipment)" icon={Package} color="orange">
                        <p className="mb-6 text-gray-600">
                            เมนู <strong>"จัดการอุปกรณ์"</strong> และ <strong>"ประเภทอุปกรณ์"</strong> คือหัวใจสำคัญของระบบ
                        </p>

                        <div className="space-y-4">
                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-5">
                                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                                    <Plus className="w-5 h-5" /> การเพิ่มอุปกรณ์ใหม่
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    <li>ไปที่หน้าจัดการอุปกรณ์ → กดปุ่ม <strong>"+ เพิ่มอุปกรณ์"</strong></li>
                                    <li>กรอกรายละเอียด: ชื่ออุปกรณ์, Serial Number, ประเภท, ตำแหน่งเก็บ, คำอธิบาย</li>
                                    <li>อัปโหลดรูปภาพอุปกรณ์ (แนะนำ เพื่อให้ผู้ใช้เห็นชัดเจน)</li>
                                    <li>กำหนดสถานะเริ่มต้น → บันทึก</li>
                                </ol>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-gray-800 mb-2">สถานะอุปกรณ์</h5>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>🟢 <strong>ว่าง (ready)</strong> — พร้อมให้ยืม</li>
                                        <li>🔵 <strong>ถูกยืม (borrowed)</strong> — มีผู้ยืมอยู่</li>
                                        <li>🟡 <strong>ซ่อมบำรุง (maintenance)</strong> — ระหว่างซ่อม</li>
                                        <li>⚫ <strong>เลิกใช้งาน (retired)</strong> — ปลดระวาง</li>
                                    </ul>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h5 className="font-semibold text-gray-800 mb-2">ประเภทอุปกรณ์</h5>
                                    <p className="text-sm text-gray-600">
                                        จัดการหมวดหมู่ผ่านเมนู <strong>"ประเภทอุปกรณ์"</strong> — เพิ่ม, แก้ไข, หรือลบประเภท
                                        (ลบได้เฉพาะประเภทที่ไม่มีอุปกรณ์ผูกอยู่)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 4. Loan & Reservation */}
                    <Section id="loans" title="4. การจัดการคำขอยืมและจอง" icon={ClipboardList} color="green">
                        <p className="mb-4 text-gray-600">
                            Admin มีสิทธิ์จัดการทุกขั้นตอน ทั้งอนุมัติ, ปฏิเสธ, และยกเลิกคำขอทุกสถานะ
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <FeatureItem
                                title="อนุมัติ / ปฏิเสธคำขอ"
                                desc="ตรวจสอบข้อมูลผู้ยืม, วันที่, เหตุผล → อนุมัติหรือปฏิเสธพร้อมระบุเหตุผล ระบบแจ้งเตือนผู้ยืมอัตโนมัติ"
                            />
                            <FeatureItem
                                title="แก้ไขรายการจอง (Edit Reservations)"
                                desc="แก้ไขวันที่รับ/คืน, เปลี่ยนเวลา, สถานะ, หรือระบุเหตุผลได้โดยตรงที่หน้าการจัดการการจอง"
                            />
                            <FeatureItem
                                title="ยืมพิเศษ (Special Loans)"
                                desc="สำหรับบันทึกการยืมนอกเหนือระเบียบปกติ (สถานะอุปกรณ์จะติดตามอัตโนมัติ)"
                            />
                            <FeatureItem
                                title="ติดตามอุปกรณ์ค้างคืน"
                                desc="กรองสถานะ 'กำลังยืม' และดูวันครบกำหนด อุปกรณ์ที่เลยกำหนดจะแสดงสีแดง"
                            />
                            <FeatureItem
                                title="บันทึกกิจกรรม Staff (Activity Log)"
                                desc="ตรวจสอบว่าใครเป็นผู้อนุมัติ, ปฏิเสธ หรือรับคืนรายการไหน — ใช้สำหรับ Audit Trail"
                            />
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800">
                            💡 <strong>Auto-Approve:</strong> เมื่อ Staff หรือ Admin ยืมเอง ระบบจะ<strong>อนุมัติอัตโนมัติ</strong>โดยไม่ต้องรอขั้นตอนอนุมัติ
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
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> สรุปยอดการยืม-คืน รายวัน / รายเดือน / รายปี</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> อุปกรณ์ที่ได้รับความนิยมสูงสุด (Top Borrowed)</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> สถิติการส่งคืนล่าช้า (Overdue)</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> กรองช่วงวันที่ด้วย Date Picker</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> <strong>Export ข้อมูลเป็น CSV / Excel</strong></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Star className="w-5 h-5" />
                                    แบบประเมินผล (Evaluations)
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                    รวบรวมแบบประเมินความพึงพอใจหลังคืนอุปกรณ์ ดูคะแนนและข้อเสนอแนะจากผู้ใช้งาน
                                    เพื่อนำมาปรับปรุงการให้บริการ
                                </p>
                                <p className="text-sm text-gray-600">
                                    สามารถ <strong>Export ข้อมูลแบบประเมิน</strong> เป็น CSV เพื่อนำไปวิเคราะห์เพิ่มเติมได้
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* 6. Support Chat */}
                    <Section id="support" title="6. Support Chat (ระบบแชทกับผู้ใช้)" icon={MessageSquare} color="teal">
                        <p className="mb-6 text-gray-600">
                            Admin สามารถเปิดการสนทนาและส่งข้อความถึงผู้ใช้งานโดยตรงผ่านระบบ — ผู้ใช้จะเห็น Badge แจ้งเตือนทันที
                        </p>
                        <div className="space-y-4">
                            <div className="bg-teal-50 border border-teal-100 rounded-lg p-5">
                                <h4 className="font-semibold text-teal-900 mb-3 flex items-center gap-2">
                                    <Plus className="w-5 h-5" /> ขั้นตอนเปิด Ticket ใหม่
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                                    <li>ไปที่ <strong>Admin → Support Chat</strong></li>
                                    <li>คลิก <strong>"สร้าง Ticket ใหม่"</strong></li>
                                    <li>เลือกผู้ใช้ที่ต้องการติดต่อ</li>
                                    <li>พิมพ์ข้อความ → คลิก <strong>"ส่ง"</strong></li>
                                    <li>ผู้ใช้จะเห็นไอคอนแจ้งเตือน (🔴 Badge) บนปุ่ม Support ในหน้าหลักทันที</li>
                                </ol>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FeatureItem
                                    title="ดูประวัติการสนทนา"
                                    desc="คลิกที่ Ticket ในรายการเพื่อดูบริบทการสนทนาทั้งหมดและตอบกลับ"
                                />
                                <FeatureItem
                                    title="Admin เป็นผู้เริ่มเสมอ"
                                    desc="ผู้ใช้ทั่วไปไม่สามารถเปิด Ticket ใหม่เองได้ — เฉพาะ Admin เท่านั้นที่เริ่มบทสนทนาได้"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* 7. WeLPRU Notifications */}
                    <Section id="welpru" title="7. ระบบแจ้งเตือน WeLPRU (Push Notifications)" icon={Bell} color="blue">
                        <p className="mb-4 text-gray-600">
                            หน้า <strong>แจ้งเตือน (Notifications)</strong> สามารถส่งข้อความแบบ Push Notification ไปยังแอปพลิเคชัน WeLPRU ในโทรศัพท์ของผู้รับได้
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FeatureItem
                                title="ส่งแบบกลุ่ม (Broadcast)"
                                desc="ส่งข้อความให้ผู้ใช้งานทั้งหมด, เฉพาะนักศึกษา หรือเฉพาะบุคลากรพร้อมกันในครั้งเดียว"
                            />
                            <FeatureItem
                                title="ระบุบุคคล (Direct)"
                                desc="ส่งข้อความแจ้งเตือนหาบุคคลเฉพาะผ่านรหัสประจำตัว (นักศึกษา/บุคลากร) ได้โดยตรง"
                            />
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                            💡 <strong>เพิ่มเติม:</strong> ต้องเปิดใช้งานฟีเจอร์ "WeLPRU Notifications" ไว้ในหน้า "ตั้งค่า (Settings)" ก่อนจึงจะสามารถใช้งานระบบส่งข้อความได้
                        </div>
                    </Section>

                    {/* 8. Data Management */}
                    <Section id="data" title="8. จัดการข้อมูล (Data Management)" icon={Database} color="amber">
                        <p className="mb-4 text-gray-600">
                            หน้า <strong>Data Management</strong> รวมเครื่องมือสำหรับบริหารข้อมูลทุกประเภทในระบบ — Export, Import, ลบข้อมูล และ Auto-Archive
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FeatureItem
                                title="ส่งออกข้อมูล (Export)"
                                desc="Export ข้อมูลการยืม, อุปกรณ์, ผู้ใช้ เป็น CSV/Excel เพื่อรายงานหรือสำรองข้อมูล"
                            />
                            <FeatureItem
                                title="นำเข้าข้อมูล (Import)"
                                desc="Import ข้อมูลอุปกรณ์จากไฟล์ Excel/CSV สำหรับเพิ่มอุปกรณ์จำนวนมากในครั้งเดียว"
                            />
                            <FeatureItem
                                title="ลบข้อมูล (Hard Delete)"
                                desc="ลบข้อมูลเก่าแบบ manual เลือกช่วงวันที่ ประเภท และยืนยันก่อนลบ — รองรับ: การยืม, การจอง, อุปกรณ์, แจ้งเตือน, ประเมิน, และการสนทนา"
                            />
                            <FeatureItem
                                title="Auto-Archive"
                                desc="ลบข้อมูลเก่าตาม retention policy โดยอัตโนมัติ — ตั้งจำนวนวัน แล้วกด Run Archive Now เพื่อลบ closed tickets และ notifications เก่าในครั้งเดียว"
                            />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                            <p className="font-semibold text-amber-900 mb-1">🗄️ Auto-Archive ลบอะไรบ้าง?</p>
                            <ul className="text-amber-800 space-y-1">
                                <li>✅ Support Ticket ที่ปิดแล้ว เก่ากว่าที่กำหนด (พร้อมข้อความทั้งหมด)</li>
                                <li>✅ Notification ที่เก่ากว่าที่กำหนด</li>
                                <li className="text-amber-600">❌ ไม่ลบข้อมูลการยืม-คืน, อุปกรณ์, หรือผู้ใช้</li>
                            </ul>
                        </div>
                    </Section>

                    {/* 9. Settings */}
                    <Section id="settings" title="9. ตั้งค่าระบบ (Settings)" icon={Settings} color="gray">
                        <p className="mb-4 text-gray-600">
                            กำหนดค่าพื้นฐานของระบบผ่านหน้า Settings — เฉพาะ Admin เท่านั้นที่เข้าถึงได้
                        </p>
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <li className="flex items-start gap-2">
                                    <Bell className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                                    <span className="text-sm">
                                        <strong>Discord Webhook URL:</strong> ตั้งค่า URL แยกตามช่อง (General, Auth, Reservation)
                                        สำหรับรับการแจ้งเตือนอัตโนมัติจากระบบ
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Settings className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                                    <span className="text-sm">
                                        <strong>ขีดจำกัดการยืม:</strong> กำหนดจำนวนอุปกรณ์ที่ยืมได้พร้อมกันต่อคน แยกตามบทบาท (User / Staff)
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Shield className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                                    <span className="text-sm">
                                        <strong>ความปลอดภัย:</strong> ค่า Webhook URLs ถูกปกป้องด้วย RLS — เข้าถึงได้เฉพาะ Admin
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Database className="w-4 h-4 text-gray-500 mt-1 shrink-0" />
                                    <span className="text-sm">
                                        <strong>จัดการข้อมูล:</strong> Export ข้อมูลผู้ใช้, อุปกรณ์, ประวัติการยืม ผ่านเมนู Data Management
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Daily Checklist */}
                        <div className="mt-6">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                รายการตรวจสอบที่ควรทำประจำ
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                    <p className="font-medium text-blue-900 text-sm mb-2">ทุกวัน</p>
                                    <ul className="text-xs text-blue-800 space-y-1">
                                        <li>✅ ดูคำขอยืมที่รอนุมัติ</li>
                                        <li>✅ ตรวจสอบอุปกรณ์ค้างคืน</li>
                                        <li>✅ ดู Support Chat ใหม่</li>
                                    </ul>
                                </div>
                                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                                    <p className="font-medium text-purple-900 text-sm mb-2">ทุกสัปดาห์</p>
                                    <ul className="text-xs text-purple-800 space-y-1">
                                        <li>✅ ดูรายงานสถิติรายสัปดาห์</li>
                                        <li>✅ ตรวจสอบสถานะอุปกรณ์</li>
                                        <li>✅ ดูบันทึกกิจกรรม Staff</li>
                                    </ul>
                                </div>
                                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                                    <p className="font-medium text-gray-800 text-sm mb-2">ทุกเดือน</p>
                                    <ul className="text-xs text-gray-700 space-y-1">
                                        <li>✅ Export รายงานสรุปเดือน</li>
                                        <li>✅ ทบทวนค่าตั้งค่าระบบ</li>
                                        <li>✅ ตรวจสอบแบบประเมิน</li>
                                        <li>✅ รัน Auto-Archive ลบข้อมูลเก่า</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Footer Help */}
                <div className="mt-16 text-center border-t border-gray-200 pt-10 pb-8">
                    <p className="text-gray-500 text-sm">
                        คู่มือนี้เป็นแนวทางสำหรับ Notebook System V5 — อัปเดตล่าสุด 2 เมษายน 2569
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
        teal: 'text-teal-700 bg-teal-100',
        amber: 'text-amber-700 bg-amber-100',
        gray: 'text-gray-700 bg-gray-100',
    }
    const parts = colors[color].split(' ')
    const textClass = parts[0]
    const bgClass = parts[1]

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
        teal: 'hover:text-teal-600 hover:bg-teal-50',
        amber: 'hover:text-amber-600 hover:bg-amber-50',
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
    const parts = colors[color].split(' ')
    const textClass = parts[0]
    const bgClass = parts[1]

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
