'use client'

import AdminPageHeader from '@/components/admin/AdminPageHeader'
import Link from 'next/link'
import {
    LayoutDashboard, Users, Package, ClipboardList, RotateCcw,
    CalendarPlus, FileStack, Activity, MessageSquare, Database,
    BarChart3, Settings, HelpCircle, CheckCircle2, AlertTriangle,
    Search, Plus, Edit, Trash2, ArrowRight, Star, Shield, Bell,
    Archive, Printer, UserPlus, Clock, XCircle, Check, Box, Calendar,
    Tag, Sparkles, Filter, Sliders, ShieldCheck, Smartphone
} from 'lucide-react'
import React, { useState } from 'react'

export default function AdminManualPage() {
    const [activeAdminWorkflow, setActiveAdminWorkflow] = useState<'rbac' | 'special' | 'retention'>('rbac')

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="คู่มือการใช้งาน (สำหรับผู้ดูแลระบบ)"
                subtitle="แนะนำการบริหารจัดการระบบและฟังก์ชันทั้งหมดสำหรับผู้ดูแลระบบ (Admin) — Notebook System V5"
            />

            <div className="max-w-6xl mx-auto">
                {/* Introduction Banner */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-950 rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-xl">
                    <div className="flex items-start gap-5">
                        <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 hidden sm:block shadow-inner shrink-0">
                            <HelpCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2.5 w-full">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/40 text-blue-100 text-xs font-medium border border-blue-400/30 mb-1">
                                        <Sparkles className="w-3 h-3" /> System Administrator Handbook
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">คู่มือบริหารจัดการระบบสำหรับ Admin</h2>
                                </div>
                                <button
                                    onClick={() => window.print()}
                                    className="print-hidden inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/25 backdrop-blur-sm self-start sm:self-auto text-sm font-medium shadow-sm active:scale-95"
                                >
                                    <Printer className="w-4 h-4" />
                                    พิมพ์ / Export PDF
                                </button>
                            </div>
                            <p className="text-blue-100 leading-relaxed text-sm sm:text-base max-w-4xl">
                                คู่มือฉบับสมบูรณ์ครอบคลุมทั้ง 12 เมนูหลักของ Admin ตั้งแต่การจัดการผู้ใช้และสิทธิ์, ครุภัณฑ์และหมวดหมู่,
                                การอนุมัติคำขอ, การยืมพิเศษ, การตรวจสอบประวัติการทำงาน (Audit Trail), การประเมินผล, การจัดการข้อมูล (Auto-Archive),
                                ระบบรายงานสถิติ และการตั้งค่าความปลอดภัย
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Navigation - All 12 Modules */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mb-10 text-center">
                    <QuickNavLink href="#dashboard" icon={LayoutDashboard} label="Dashboard" color="blue" />
                    <QuickNavLink href="#users" icon={Users} label="ผู้ใช้งาน" color="indigo" />
                    <QuickNavLink href="#equipment" icon={Package} label="อุปกรณ์" color="orange" />
                    <QuickNavLink href="#types" icon={Tag} label="ประเภท" color="teal" />
                    <QuickNavLink href="#loans" icon={ClipboardList} label="ยืม-คืน" color="green" />
                    <QuickNavLink href="#reservations" icon={CalendarPlus} label="การจอง" color="purple" />
                    <QuickNavLink href="#special" icon={FileStack} label="ยืมพิเศษ" color="blue" />
                    <QuickNavLink href="#activity" icon={Activity} label="ประวัติงาน" color="teal" />
                    <QuickNavLink href="#evaluations" icon={MessageSquare} label="ประเมินผล" color="amber" />
                    <QuickNavLink href="#data" icon={Database} label="จัดการข้อมูล" color="slate" />
                    <QuickNavLink href="#reports" icon={BarChart3} label="รายงาน" color="violet" />
                    <QuickNavLink href="#settings" icon={Settings} label="ตั้งค่า" color="gray" />
                </div>

                {/* Detailed Sections */}
                <div className="space-y-10">
                    {/* 1. Dashboard */}
                    <Section id="dashboard" title="1. ภาพรวมระบบ (Dashboard & Quick Metrics)" icon={LayoutDashboard} color="blue">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            หน้า <strong>Dashboard (`/admin`)</strong> สรุปตัวชี้วัดสำคัญแบบ Real-time เพื่อให้ผู้ดูแลระบบมองเห็นสถานะปัจจุบันของสถาบันได้ทันที:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                            <StatCard title="อุปกรณ์ทั้งหมด" desc="จำนวนอุปกรณ์ในระบบ แยกตามประเภทและสถานะความพร้อมใช้งาน" />
                            <StatCard title="คำขอรอการอนุมัติ" desc="คำขอยืมและจองใหม่ที่รอการพิจารณา สามารถคลิกเพื่อไปจัดการได้ทันที" />
                            <StatCard title="อุปกรณ์ที่กำลังยืม" desc="จำนวนเครื่องที่อยู่ระหว่างการยืมใช้งานจริง และความเสี่ยงต่อการค้างคืน" />
                            <StatCard title="ผู้ใช้งานในระบบ" desc="จำนวนผู้ใช้ที่ลงทะเบียน แยกตามบทบาทและผู้ใช้ที่รออนุมัติบัญชี" />
                        </div>
                    </Section>

                    {/* 2. User Management */}
                    <Section id="users" title="2. การจัดการผู้ใช้งาน (User Management & Roles)" icon={Users} color="indigo">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"จัดการผู้ใช้ (`/admin/users`)"</strong> ช่วยควบคุมการเข้าถึงระบบและกำหนดบทบาทสิทธิ์ (RBAC):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                            <ActionBox title="อนุมัติ / ระงับการใช้งาน" icon={CheckCircle2} color="green">
                                ตรวจสอบผู้สมัครใหม่ที่มีสถานะ <code>pending</code> สามารถกด <strong>อนุมัติ (Approve)</strong> หรือ <strong>ระงับ (Suspend)</strong> สิทธิ์ได้ทันที รองรับการเลือกหลายรายการ (Bulk Action)
                            </ActionBox>
                            <ActionBox title="ปรับเปลี่ยน Role & ประเภท" icon={Edit} color="blue">
                                กำหนดระดับสิทธิ์: <strong>User</strong> (ผู้ใช้ทั่วไป), <strong>Staff</strong> (เจ้าหน้าที่ปฏิบัติการ), <strong>Admin</strong> (ผู้ดูแลระบบ) และระบุประเภท <strong>Student / Lecturer / Staff</strong>
                            </ActionBox>
                            <ActionBox title="ความปลอดภัยและการลบบัญชี" icon={Trash2} color="red">
                                แนะนำให้ใช้การ <strong>"ระงับสิทธิ์ (Suspend)"</strong> แทนการลบบัญชี เพื่อรักษาประวัติการยืม-คืน (Audit Trail) ไว้สำหรับตรวจสอบความโปร่งใส
                            </ActionBox>
                        </div>
                    </Section>

                    {/* 3. Equipment Management */}
                    <Section id="equipment" title="3. การจัดการอุปกรณ์ (Equipment Management)" icon={Package} color="orange">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"จัดการอุปกรณ์ (`/admin/equipment`)"</strong> จัดการฐานข้อมูลครุภัณฑ์ อัปโหลดภาพ และติดตามสถานะเครื่อง:
                        </p>
                        <div className="bg-orange-50/70 border border-orange-200 p-5 rounded-xl mb-4">
                            <h4 className="font-bold text-orange-950 text-sm mb-2 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-orange-600" /> ขั้นตอนการเพิ่มอุปกรณ์ใหม่เข้าสู่ระบบ
                            </h4>
                            <ol className="list-decimal list-inside space-y-1.5 text-xs text-orange-900">
                                <li>คลิกปุ่ม <strong>"+ เพิ่มอุปกรณ์"</strong> ที่มุมขวาบน</li>
                                <li>กรอกข้อมูลจำเป็น: ชื่ออุปกรณ์, หมายเลขครุภัณฑ์ (Equipment Number), Serial Number, หมวดหมู่ และสถานที่จัดเก็บ</li>
                                <li>อัปโหลดรูปภาพอุปกรณ์ (รองรับภาพความละเอียดสูงเพื่อความชัดเจนของผู้ยืม)</li>
                                <li>กำหนดสถานะเริ่มต้น (ค่าเริ่มต้น: 🟢 ว่าง / available) จากนั้นกดบันทึก</li>
                            </ol>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">สถานะอุปกรณ์ทั้ง 5 สถานะในระบบ:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                                <span className="p-2 rounded-lg bg-white border border-emerald-200 font-semibold text-emerald-800">🟢 available (ว่าง)</span>
                                <span className="p-2 rounded-lg bg-white border border-blue-200 font-semibold text-blue-800">🔵 borrowed (ถูกยืม)</span>
                                <span className="p-2 rounded-lg bg-white border border-purple-200 font-semibold text-purple-800">🟣 reserved (ถูกจอง)</span>
                                <span className="p-2 rounded-lg bg-white border border-amber-200 font-semibold text-amber-800">🟡 maintenance (ซ่อมบำรุง)</span>
                                <span className="p-2 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700">⚫ retired (เลิกใช้งาน)</span>
                            </div>
                        </div>
                    </Section>

                    {/* 4. Equipment Types */}
                    <Section id="types" title="4. ประเภทและหมวดหมู่อุปกรณ์ (Equipment Types)" icon={Tag} color="teal">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"ประเภทอุปกรณ์ (`/admin/equipment-types`)"</strong> ใช้สำหรับจัดกลุ่มหมวดหมู่อุปกรณ์:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-2">
                                <h5 className="font-bold text-sm text-teal-950">การจัดการหมวดหมู่</h5>
                                <p>• เพิ่มประเภทอุปกรณ์ใหม่ เช่น โน้ตบุ๊กสำหรับกราฟิก, โน้ตบุ๊กสำหรับเขียนโค้ด, แท็บเล็ต, โปรเจกเตอร์</p>
                                <p>• กำหนดชื่อภาษาไทย/อังกฤษ และเลือกไอคอนประจำหมวดหมู่เพื่อให้แสดงผลสวยงามในหน้าค้นหา</p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
                                <h5 className="font-bold text-sm text-slate-800">เงื่อนไขความปลอดภัยในการลบ</h5>
                                <p>• ระบบมีระบบ Integrity Guard: หมวดหมู่ใดที่มีอุปกรณ์ผูกอยู่ จะ<strong>ไม่สามารถลบได้</strong></p>
                                <p>• หากต้องการลบ ต้องทำการย้ายหรือลบอุปกรณ์ที่อยู่ในหมวดหมู่นั้นออกก่อนเสมอ</p>
                            </div>
                        </div>
                    </Section>

                    {/* 5. Loans Management */}
                    <Section id="loans" title="5. การยืม-คืนอุปกรณ์ (Loans Management)" icon={ClipboardList} color="green">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"ยืม-คืนอุปกรณ์ (`/admin/loans`)"</strong> มีสิทธิ์ระดับสูงสุดในการจัดการคำขอทุกสถานะ:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FeatureCard
                                title="อนุมัติและปฏิเสธ (Single & Bulk)"
                                desc="ตรวจสอบคำขอยืมที่รอดำเนินการ สามารถอนุมัติทีละรายการหรือเลือกหลายรายการพร้อมกันเพื่ออนุมัติในครั้งเดียว หากปฏิเสธต้องระบุเหตุผล"
                            />
                            <FeatureCard
                                title="ติดตาม Active Loans & ค้างคืน"
                                desc="ดูรายการอุปกรณ์ที่กำลังยืมอยู่ทั้งหมด วันที่ต้องคืน และคัดกรองอุปกรณ์ที่เกินกำหนดส่งคืนเพื่อดำเนินการติดตาม"
                            />
                        </div>
                    </Section>

                    {/* 6. Reservations Management */}
                    <Section id="reservations" title="6. จัดการการจองล่วงหน้า (Reservations Management)" icon={CalendarPlus} color="purple">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"จัดการการจอง (`/admin/reservations`)"</strong> ช่วยบริหารคิวการจองอุปกรณ์ในอนาคต:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FeatureCard
                                title="อนุมัติ / ปฏิเสธ / ยกเลิกคิวจอง"
                                desc="พิจารณาคำขอจองล่วงหน้า ล็อกสิทธิ์อุปกรณ์ให้ผู้ใช้ตามช่วงวัน หรือยกเลิกการจองเมื่อมีเหตุฉุกเฉิน"
                            />
                            <FeatureCard
                                title="แก้ไขรายการจอง (Edit Reservation)"
                                desc="Admin สามารถแก้ไขวันที่นัดรับ, วันที่ส่งคืน, เวลาคืน หรือเปลี่ยนรายละเอียดของผู้จองได้โดยตรงโดยไม่ต้องให้ผู้ใช้ส่งคำขอใหม่"
                            />
                        </div>
                    </Section>

                    {/* 7. Special Loans (NEW & CRITICAL) */}
                    <Section id="special" title="7. การยืมพิเศษ (Special Loans Management)" icon={FileStack} color="blue">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"ยืมพิเศษ (`/admin/special-loans`)"</strong> ออกแบบมาสำหรับการยืมนอกเหนือกฎระเบียบปกติ
                            เช่น การยืมเพื่อจัดงานสัมมนาขนาดใหญ่, การยืมโดยหน่วยงานภายนอก หรือโครงการพิเศษ:
                        </p>
                        <div className="space-y-3">
                            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
                                <h5 className="font-bold text-sm text-blue-950">ความสามารถของระบบยืมพิเศษ:</h5>
                                <p>• บันทึกชื่อผู้ยืมและองค์กรภายนอกได้โดยไม่ต้องมีบัญชี Google ในระบบ</p>
                                <p>• รองรับการเลือกอุปกรณ์แบบ <strong>Manual (เลือกทีละชิ้น)</strong> หรือ <strong>Bulk (เลือกตามหมวดหมู่และจำนวนที่ต้องการ)</strong></p>
                                <p>• กำหนดระยะเวลายืมพิเศษได้ตามต้องการโดยไม่ติดขีดจำกัดจำนวนวันของระบบปกติ</p>
                                <p>• บันทึกการส่งคืนการยืมพิเศษ (Return Special Loan) พร้อมบันทึกหมายเหตุสภาพเครื่อง</p>
                            </div>
                        </div>
                    </Section>

                    {/* 8. Staff Activity Log (NEW & CRITICAL) */}
                    <Section id="activity" title="8. ประวัติการทำงานของเจ้าหน้าที่ (Staff Activity & Audit Trail)" icon={Activity} color="teal">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"ประวัติการทำงาน (`/admin/staff-activity`)"</strong> คือระบบ Audit Trail สำหรับตรวจสอบความโปร่งใส:
                        </p>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-2">
                            <p>• บันทึกทุกกิจกรรมสำคัญ: ใครเป็นผู้อนุมัติคำขอ, ใครเป็นผู้ปฏิเสธ, ใครเป็นผู้รับคืน หรือใครแก้ไขข้อมูล</p>
                            <p>• ระบุวัน-เวลาที่เกิดการกระทำ (Timestamp) อย่างแม่นยำ</p>
                            <p>• สามารถค้นหาและกรองตามชื่อเจ้าหน้าที่ หรือประเภทกิจกรรม เพื่อใช้ในการสอบสวนหรือตรวจสอบย้อนหลัง</p>
                        </div>
                    </Section>

                    {/* 9. Evaluations */}
                    <Section id="evaluations" title="9. ระบบการประเมินผลความพึงพอใจ (Evaluations)" icon={MessageSquare} color="amber">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"การประเมินผล (`/admin/evaluations`)"</strong> รวบรวมผลการประเมินจากผู้ใช้งานหลังคืนอุปกรณ์:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
                                <h5 className="font-bold text-sm text-amber-950">สถิติคะแนนความพึงพอใจ</h5>
                                <p>• แสดงคะแนนเฉลี่ย (Rating 1-5 ดาว) ของอุปกรณ์แต่ละรุ่นและการให้บริการ</p>
                                <p>• ติดตามข้อคิดเห็นและข้อเสนอแนะจากผู้ใช้จริงเพื่อนำมาปรับปรุงการทำงาน</p>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                                <h5 className="font-bold text-sm text-slate-800">ส่งออกข้อมูล (Export CSV)</h5>
                                <p>• คลิกปุ่ม <strong>"Export CSV"</strong> เพื่อดาวน์โหลดข้อมูลผลการประเมินทั้งหมดไปเปิดใน Microsoft Excel เพื่อทำรายงานสรุปเสนอผู้บริหาร</p>
                            </div>
                        </div>
                    </Section>

                    {/* 10. Data Management & Auto-Archive */}
                    <Section id="data" title="10. จัดการข้อมูลและระบบจัดเก็บถาวร (Data Management & Auto-Archive)" icon={Database} color="slate">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"จัดการข้อมูล (`/admin/data-management`)"</strong> รวม 4 เครื่องมือสำคัญในการบริหารฐานข้อมูล:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4 text-xs">
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <strong className="block text-slate-900 font-bold mb-1">1. ส่งออกข้อมูล (Export)</strong>
                                ดาวน์โหลดประวัติการยืม, ฐานข้อมูลอุปกรณ์ และรายชื่อผู้ใช้เป็นไฟล์ CSV/Excel
                            </div>
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <strong className="block text-slate-900 font-bold mb-1">2. นำเข้าข้อมูล (Import)</strong>
                                นำเข้าอุปกรณ์จำนวนมากพร้อมกันผ่านเทมเพลต Excel/CSV ประหยัดเวลาคีย์ข้อมูล
                            </div>
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <strong className="block text-slate-900 font-bold mb-1">3. ลบข้อมูล (Hard Delete)</strong>
                                ลบข้อมูลประวัติเก่าตามช่วงวันที่อย่างระมัดระวัง (ต้องพิมพ์ยืนยันก่อนลบ)
                            </div>
                            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                                <strong className="block text-indigo-950 font-bold mb-1">4. Auto-Archive (ระบบอัตโนมัติ)</strong>
                                ตั้งค่านโยบาย Retention ลบการแจ้งเตือนเก่าเกิน N วัน พร้อมปุ่ม <strong>"Run Archive Now"</strong>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                            🛡️ <strong>ความปลอดภัย:</strong> นโยบาย Auto-Archive จะลบเฉพาะ Notification เก่าเท่านั้น <u>ไม่มีการลบข้อมูลการยืม, อุปกรณ์ หรือผู้ใช้</u> โดยเด็ดขาด
                        </div>
                    </Section>

                    {/* 11. Reports */}
                    <Section id="reports" title="11. ระบบรายงานและสถิติ (Reports & Analytics)" icon={BarChart3} color="violet">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"รายงาน (`/admin/reports`)"</strong> ใช้สำหรับวิเคราะห์แนวโน้มและจัดทำสถิติประจำรอบปี:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className="p-3.5 bg-violet-50/60 border border-violet-200 rounded-xl">
                                <strong className="font-bold text-violet-950 block mb-1">สถิติยอดการยืม</strong>
                                รายงานยอดการยืมแยกตามรายวัน, รายสัปดาห์, รายเดือน และรายปี พร้อมกราฟแสดงแนวโน้ม
                            </div>
                            <div className="p-3.5 bg-violet-50/60 border border-violet-200 rounded-xl">
                                <strong className="font-bold text-violet-950 block mb-1">อุปกรณ์ยอดนิยม (Top Borrowed)</strong>
                                วิเคราะห์ว่าอุปกรณ์หรือหมวดหมู่ใดถูกยืมมากที่สุด และอุปกรณ์ใดไม่ค่อยมีการใช้งาน
                            </div>
                            <div className="p-3.5 bg-violet-50/60 border border-violet-200 rounded-xl">
                                <strong className="font-bold text-violet-950 block mb-1">รายงานการคืนล่าช้า (Overdue)</strong>
                                สถิติอัตราการคืนตรงเวลาและการส่งคืนล่าช้า พร้อมส่งออกไฟล์สรุป
                            </div>
                        </div>
                    </Section>

                    {/* 12. Settings */}
                    <Section id="settings" title="12. การตั้งค่าระบบ (System Settings)" icon={Settings} color="gray">
                        <p className="mb-4 text-slate-600 text-sm leading-relaxed">
                            เมนู <strong>"ตั้งค่าระบบ (`/admin/settings`)"</strong> กำหนดค่าการทำงานพื้นฐานและความปลอดภัยทั้งหมด:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <h5 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-600" /> เวลาทำการและขีดจำกัดการยืม
                                </h5>
                                <p>• สวิตช์เปิด/ปิดระบบการยืม-คืนทั้งระบบในวันหยุดราชการ</p>
                                <p>• กำหนดเวลาเปิด-ปิดทำการ (Operating Hours)</p>
                                <p>• กำหนดจำนวนเครื่องสูงสุดและระยะเวลาสูงสุดที่ยืมได้ต่อคน แยกตามประเภท (Student / Lecturer / Staff)</p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <h5 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    <Bell className="w-4 h-4 text-slate-600" /> Discord & WeLPRU Notifications
                                </h5>
                                <p>• <strong>Discord Webhooks:</strong> ตั้งค่า URL แยก 3 แชนเนล (General, Auth, Reservation)</p>
                                <p>• <strong>WeLPRU Mobile Push:</strong> ส่งข้อความแจ้งเตือนตรงถึงโทรศัพท์รายบุคคลหรือทั้งกลุ่ม</p>
                                <p>• <strong>ธีม (Theme):</strong> เลือกธีม Playful หรือ Brutalist Minimal</p>
                            </div>
                        </div>

                        {/* Admin Checklist */}
                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> รายการตรวจสอบประจำงวดของผู้ดูแลระบบ (Admin Routine Checklist)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                                    <strong className="block font-bold mb-1.5">📅 ประจำวัน (Daily)</strong>
                                    <p>• ดูยอดคำขอรออนุมัติที่ค้าง</p>
                                    <p>• ตรวจสอบรายการค้างคืนที่เลยกำหนด</p>
                                </div>
                                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900">
                                    <strong className="block font-bold mb-1.5">📆 ประจำสัปดาห์ (Weekly)</strong>
                                    <p>• ตรวจสอบ Audit Trail ใน Staff Activity</p>
                                    <p>• ตรวจสอบสถานะอุปกรณ์ที่ส่งซ่อม</p>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                                    <strong className="block font-bold mb-1.5">🗓️ ประจำเดือน (Monthly)</strong>
                                    <p>• Export รายงานสถิติประจำเดือน</p>
                                    <p>• ตรวจสอบคะแนนความพึงพอใจ</p>
                                    <p>• รันคำสั่ง Auto-Archive ล้างข้อความเก่า</p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 13. Workflows Pipeline */}
                    <Section id="workflows" title="13. แผนผังขั้นตอนการทำงานภาพรวม (Master Workflows Pipeline)" icon={FileStack} color="teal">
                        <div className="space-y-6">
                            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                                แผนผังกระบวนการระดับบริหารจัดการ (Master Admin Operations) ในระบบ Notebook System V5 แสดงขั้นตอนการควบคุมระบบ การจัดสรรทรัพยากร และ <strong>จุดแยกตัดสินใจ (Decision Branches)</strong> ทั้งหมด:
                            </p>

                            {/* Touch-friendly Workflow Tabs */}
                            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-slate-100">
                                <button
                                    onClick={() => setActiveAdminWorkflow('rbac')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeAdminWorkflow === 'rbac' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>สิทธิ์ผู้ใช้ & โควตา (RBAC & Lifecycle)</span>
                                </button>
                                <button
                                    onClick={() => setActiveAdminWorkflow('special')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeAdminWorkflow === 'special' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <FileStack className="w-3.5 h-3.5" />
                                    <span>การยืมพิเศษ (Special Loans)</span>
                                </button>
                                <button
                                    onClick={() => setActiveAdminWorkflow('retention')}
                                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${activeAdminWorkflow === 'retention' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Database className="w-3.5 h-3.5" />
                                    <span>บำรุงรักษาข้อมูล (Data Retention)</span>
                                </button>
                            </div>

                            {/* Admin Workflow 1: User RBAC & Lifecycle */}
                            {activeAdminWorkflow === 'rbac' && (
                                <div className="space-y-5 animate-fadeIn">
                                    <WorkflowMetaBar
                                        title="วงจรชีวิตผู้ใช้งานและการจัดการสิทธิ์ตามบทบาท (User RBAC, Quota & Approval Lifecycle)"
                                        actors="👤 ผู้ลงทะเบียน (User), 🛡️ Admin, 🤖 ระบบ Auth"
                                        channels="Discord Webhook (ห้อง Auth), WeLPRU Mobile Push, Supabase RLS"
                                    />
                                    <ResponsiveWorkflowFlowchart
                                        steps={[
                                            {
                                                stepNum: 1,
                                                actor: '👤 ผู้ใช้งาน',
                                                actorRole: 'user',
                                                title: 'ลงทะเบียนผ่าน Google OAuth & ส่งโปรไฟล์',
                                                desc: 'ผู้ใช้เข้าสู่ระบบด้วย Google และกรอกข้อมูลโปรไฟล์ รหัสนักศึกษา/บุคลากร สถานะเริ่มต้นเป็น Pending',
                                                statusBadge: '🟡 pending',
                                            },
                                            {
                                                stepNum: 2,
                                                actor: '🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'ตรวจสอบข้อมูล & กำหนดบทบาทใน /admin/users',
                                                desc: 'ตรวจสอบความถูกต้องของรหัสและคณะ จากนั้นกำหนด Role (User / Staff / Admin) และ User Type (Student / Lecturer / Staff) ซึ่งจะผูกกับโควตายืมอุปกรณ์โดยอัตโนมัติ',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 อนุมัติบัญชี (Approved)',
                                                        text: 'เปิดสิทธิ์การใช้งานทันที ผู้ใช้จะสามารถเริ่มยืมและจองอุปกรณ์ได้ตามโควตาที่กำหนด',
                                                        status: '🟢 approved',
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '🔴 ไม่อนุมัติ (Rejected)',
                                                        text: 'ข้อมูลไม่ถูกต้อง ระบุเหตุผลการไม่อนุมัติ บัญชีจะถูกปฏิเสธและแจ้งเตือนกลับไปยังผู้ใช้',
                                                        status: '🔴 rejected',
                                                    },
                                                ],
                                            },
                                            {
                                                stepNum: 3,
                                                actor: '👤 ผู้ใช้ + 🤖 ระบบ',
                                                actorRole: 'user',
                                                title: 'การใช้งานระบบตามขีดจำกัดโควตา (Enforced Quotas)',
                                                desc: 'ระบบกั้นสิทธิ์ตามโควตาสูงสุด: นักศึกษา 1 เครื่อง (คืนวันต่อวัน), อาจารย์ 2 เครื่อง (ยืมได้สูงสุด 7 วัน), เจ้าหน้าที่ 2 เครื่อง (ยืมได้สูงสุด 5 วัน)',
                                                statusBadge: 'Active Enforcement',
                                            },
                                            {
                                                stepNum: 4,
                                                actor: '🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'การควบคุมกำกับดูแลและระงับสิทธิ์ (Governance & Suspension)',
                                                desc: 'Admin สามารถบริหารจัดการและลงโทษบัญชีผู้ใช้เมื่อพบพฤติกรรมผิดระเบียบ:',
                                                branches: [
                                                    {
                                                        type: 'alert',
                                                        label: '🟡 ปรับเปลี่ยน Role / ข้อมูล',
                                                        text: 'เลื่อนขั้นเป็น Staff หรือแก้ไขข้อมูลคณะ/เบอร์โทรศัพท์ที่ผู้ใช้แจ้งขอเปลี่ยนแปลง',
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '🔴 สั่งระงับบัญชี (Suspended)',
                                                        text: 'กรณีมีรายการค้างส่งนาน หรือไม่ชำระค่าเสียหาย ระงับสิทธิ์การยืม-จองอุปกรณ์ทั้งหมดในระบบทันที',
                                                        status: '🔴 suspended',
                                                    },
                                                ],
                                            },
                                        ]}
                                    />
                                </div>
                            )}

                            {/* Admin Workflow 2: Special Loans */}
                            {activeAdminWorkflow === 'special' && (
                                <div className="space-y-5 animate-fadeIn">
                                    <WorkflowMetaBar
                                        title="วงจรการยืมอุปกรณ์กรณีพิเศษสำหรับโครงการ/หน่วยงาน (Special Project Loan Lifecycle)"
                                        actors="🛡️ Admin, 🏢 หน่วยงาน / โครงการพิเศษ, 🤖 Audit Trail"
                                        channels="Discord Webhook (ห้อง Special Loans), Staff Activity Log View"
                                    />
                                    <ResponsiveWorkflowFlowchart
                                        steps={[
                                            {
                                                stepNum: 1,
                                                actor: '🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'สร้างสัญญาการยืมพิเศษ (/admin/special-loans/new)',
                                                desc: 'ระบุชื่อโครงการ หน่วยงานผู้รับผิดชอบ ผู้ติดต่อ และช่วงวันที่ยืม-คืนตามหนังสือขอความอนุเคราะห์จากหน่วยงาน',
                                                statusBadge: 'Draft',
                                            },
                                            {
                                                stepNum: 2,
                                                actor: '🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'เลือกอุปกรณ์แบบเดี่ยวหรือแบบกลุ่ม (Bulk Equipment Selection)',
                                                desc: 'เลือกอุปกรณ์หลายเครื่องพร้อมกัน ระบบจะปรับสถานะอุปกรณ์ทั้งหมดที่เลือกเป็น "ถูกยืม (borrowed)" ทันทีเพื่อกันสิทธิ์',
                                                statusBadge: '🔵 borrowed',
                                            },
                                            {
                                                stepNum: 3,
                                                actor: '🛡️ Admin + 🏢 หน่วยงาน',
                                                actorRole: 'counter',
                                                title: 'ส่งมอบอุปกรณ์ & บันทึกสัญญา Active',
                                                desc: 'ตรวจเช็คอุปกรณ์ร่วมกับผู้แทนโครงการ พิมพ์เอกสารส่งมอบ และบันทึกสัญญาเป็น Active ในระบบ',
                                                statusBadge: '🟢 Active Loan',
                                            },
                                            {
                                                stepNum: 4,
                                                actor: '🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'ปิดสัญญาการยืมพิเศษ (Closure & Condition Check)',
                                                desc: 'เมื่อสิ้นสุดโครงการ ตรวจรับอุปกรณ์คืนตามรายการ:',
                                                branches: [
                                                    {
                                                        type: 'success',
                                                        label: '🟢 อุปกรณ์ครบถ้วนสมบูรณ์',
                                                        text: 'อุปกรณ์ทั้งหมดกลับสู่สถานะว่าง (available) ทันที -> ปิดสัญญาเป็น Completed',
                                                        status: '⚪ completed',
                                                    },
                                                    {
                                                        type: 'alert',
                                                        label: '🟡 มีอุปกรณ์ชำรุด หรือสูญหาย',
                                                        text: 'แยกบันทึกเครื่องที่ชำรุดส่งฝ่ายซ่อมบำรุง (maintenance) และดำเนินการติดตามชดใช้ตามระเบียบ',
                                                        status: '🟡 maintenance',
                                                    },
                                                    {
                                                        type: 'danger',
                                                        label: '⚪ ขอยกเลิกสัญญาก่อนส่งมอบ (Cancelled)',
                                                        text: 'ยกเลิกรายการ อุปกรณ์ทั้งหมดถูกปลดล็อกกลับมาว่างทันที',
                                                        status: '⚪ cancelled',
                                                    },
                                                ],
                                            },
                                        ]}
                                    />
                                </div>
                            )}

                            {/* Admin Workflow 3: Data Retention & Audit Trail */}
                            {activeAdminWorkflow === 'retention' && (
                                <div className="space-y-5 animate-fadeIn">
                                    <WorkflowMetaBar
                                        title="วงจรการบำรุงรักษาข้อมูลและประวัติการปฏิบัติงาน (Data Retention & Audit Trail Lifecycle)"
                                        actors="🛡️ Admin, 🤖 Supabase Engine, 🤖 Smart Cron"
                                        channels="staff_activity_log_view, Security Alerts, Performance Monitor"
                                    />
                                    <ResponsiveWorkflowFlowchart
                                        steps={[
                                            {
                                                stepNum: 1,
                                                actor: '🤖 ระบบ Supabase',
                                                actorRole: 'system',
                                                title: 'บันทึก Audit Log ทุกความเคลื่อนไหว',
                                                desc: 'ทุกการกดอนุมัติ ส่งมอบ รับคืน หรือแก้ไขข้อมูล จะถูกบันทึกลง staff_activity_log โดยอัตโนมัติพร้อม IP และ User ID',
                                                statusBadge: 'Real-time Log',
                                            },
                                            {
                                                stepNum: 2,
                                                actor: '🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'เรียกดู Audit Trail ผ่าน staff_activity_log_view',
                                                desc: 'ตรวจสอบความโปร่งใส ค้นหาย้อนหลังตามชื่อเจ้าหน้าที่ หมายเลขครุภัณฑ์ หรือช่วงเวลา โดยใช้ Database View ที่ปรับแต่งความเร็วแล้ว',
                                            },
                                            {
                                                stepNum: 3,
                                                actor: '🛡️ Admin',
                                                actorRole: 'staff',
                                                title: 'กำหนดนโยบาย Data Retention ใน /admin/data-retention',
                                                desc: 'ตั้งค่าระยะเวลาเก็บรักษาข้อมูลแจ้งเตือน (เช่น 30 วัน, 60 วัน, 90 วัน หรือ 180 วัน) เพื่อรักษาขนาดฐานข้อมูลให้อยู่ในเกณฑ์เหมาะสม',
                                            },
                                            {
                                                stepNum: 4,
                                                actor: '🤖 Smart Cron / 🛡️ Admin',
                                                actorRole: 'system',
                                                title: 'กระบวนการ Archive & Clean-up ข้อมูล',
                                                desc: 'ดำเนินการกวาดล้างข้อมูลเก่าตามเงื่อนไขที่กำหนด:',
                                                branches: [
                                                    {
                                                        type: 'special',
                                                        label: '⚡ รันอัตโนมัติ (Automated Retention)',
                                                        text: 'ระบบลบการแจ้งเตือนที่เก่าเกินกำหนดอย่างปลอดภัย โดยไม่ลบประวัติคำขอยืมจริงหรือ Audit Log',
                                                    },
                                                    {
                                                        type: 'alert',
                                                        label: '🧹 กดปุ่ม "Run Archive Now"',
                                                        text: 'Admin สั่งรันกวาดล้างทันทีเพื่อลดพื้นที่จัดเก็บ พร้อมแสดงสรุปจำนวนแถวที่ถูกทำความสะอาด',
                                                    },
                                                    {
                                                        type: 'success',
                                                        label: '🟢 ฐานข้อมูลสะอาด & ปลอดภัย',
                                                        text: 'ลด Index bloat ระบบตอบสนองรวดเร็ว ปฏิบัติตามมาตรฐาน PDPA อย่างเคร่งครัด',
                                                        status: 'Optimal DB',
                                                    },
                                                ],
                                            },
                                        ]}
                                    />
                                </div>
                            )}
                        </div>
                    </Section>
                </div>

                {/* Footer Note */}
                <div className="mt-14 text-center border-t border-slate-200 pt-8 pb-4">
                    <p className="text-slate-500 text-xs sm:text-sm mb-1">
                        คู่มือการบริหารจัดการระบบสำหรับผู้ดูแลระบบ (Admin) — Notebook System V5
                    </p>
                    <p className="text-slate-400 text-xs">
                        อัปเดตล่าสุดให้สอดคล้องกับโครงสร้างระบบและฐานข้อมูลปัจจุบัน
                    </p>
                </div>
            </div>
        </div>
    )
}

/* ─── Helper Components ─── */

function QuickNavLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200',
        indigo: 'hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200',
        orange: 'hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200',
        teal: 'hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200',
        green: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200',
        purple: 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200',
        amber: 'hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200',
        slate: 'hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300',
        violet: 'hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200',
        gray: 'hover:bg-gray-100 hover:text-gray-800 hover:border-gray-300',
    }

    return (
        <a
            href={href}
            className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-all shadow-2xs active:scale-95 ${colorClasses[color]}`}
        >
            <Icon className="w-4 h-4 mb-1 shrink-0" />
            <span className="text-[11px] font-semibold leading-tight truncate w-full">{label}</span>
        </a>
    )
}

function Section({ id, title, icon: Icon, children, color }: { id: string; title: string; icon: any; children: React.ReactNode; color: string }) {
    const headerColors: Record<string, string> = {
        blue: 'text-blue-800',
        indigo: 'text-indigo-800',
        orange: 'text-orange-800',
        teal: 'text-teal-800',
        green: 'text-emerald-800',
        purple: 'text-purple-800',
        amber: 'text-amber-800',
        slate: 'text-slate-800',
        violet: 'text-violet-800',
        gray: 'text-slate-800',
    }
    const bgColors: Record<string, string> = {
        blue: 'bg-blue-100 text-blue-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        orange: 'bg-orange-100 text-orange-700',
        teal: 'bg-teal-100 text-teal-700',
        green: 'bg-emerald-100 text-emerald-700',
        purple: 'bg-purple-100 text-purple-700',
        amber: 'bg-amber-100 text-amber-700',
        slate: 'bg-slate-200 text-slate-700',
        violet: 'bg-violet-100 text-violet-700',
        gray: 'bg-slate-200 text-slate-700',
    }

    return (
        <section id={id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl ${bgColors[color]} shrink-0 shadow-2xs`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${headerColors[color]} tracking-tight`}>{title}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
                {children}
            </div>
        </section>
    )
}

function StatCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <h5 className="font-bold text-sm text-slate-900 mb-1">{title}</h5>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
        </div>
    )
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h5 className="font-bold text-sm text-slate-900 mb-1.5">{title}</h5>
            <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
        </div>
    )
}

function ActionBox({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
    const borderColors: Record<string, string> = {
        green: 'border-emerald-200 bg-emerald-50/50 text-emerald-950',
        blue: 'border-blue-200 bg-blue-50/50 text-blue-950',
        red: 'border-rose-200 bg-rose-50/50 text-rose-950',
    }

    return (
        <div className={`p-4 rounded-xl border ${borderColors[color]}`}>
            <h5 className="font-bold text-sm mb-2 flex items-center gap-1.5">
                <Icon className="w-4 h-4" /> {title}
            </h5>
            <p className="text-xs text-slate-600 leading-relaxed">{children}</p>
        </div>
    )
}

function WorkflowMetaBar({ title, actors, channels }: { title: string; actors: string; channels: string }) {
    return (
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-2">{title}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-700 shrink-0">👥 ผู้เกี่ยวข้อง:</span>
                    <span>{actors}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-700 shrink-0">📡 ช่องทางแจ้งเตือน:</span>
                    <span className="text-teal-700 font-medium">{channels}</span>
                </div>
            </div>
        </div>
    )
}

interface FlowchartBranch {
    type: 'success' | 'danger' | 'alert' | 'special' | 'neutral'
    label: string
    text: string
    status?: string
}

interface FlowchartStep {
    stepNum: number
    actor: string
    actorRole?: 'user' | 'staff' | 'counter' | 'system'
    title: string
    desc: string
    statusBadge?: string
    branches?: FlowchartBranch[]
}

const branchStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    success: {
        bg: 'bg-emerald-50/70',
        border: 'border-emerald-200',
        text: 'text-emerald-900',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    danger: {
        bg: 'bg-rose-50/70',
        border: 'border-rose-200',
        text: 'text-rose-900',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    alert: {
        bg: 'bg-amber-50/70',
        border: 'border-amber-200',
        text: 'text-amber-900',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    special: {
        bg: 'bg-indigo-50/70',
        border: 'border-indigo-200',
        text: 'text-indigo-900',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    neutral: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-800',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
}

const actorRoleStyles: Record<string, string> = {
    user: 'bg-blue-50 text-blue-700 border-blue-200',
    staff: 'bg-teal-50 text-teal-700 border-teal-200',
    counter: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    system: 'bg-purple-50 text-purple-700 border-purple-200',
}

function ResponsiveWorkflowFlowchart({ steps }: { steps: FlowchartStep[] }) {
    return (
        <div>
            {/* Mobile View: Vertical Connected Timeline (320px - 767px) */}
            <div className="block md:hidden relative pl-6 border-l-2 border-slate-200 ml-3.5 space-y-5">
                {steps.map((step) => {
                    const actorStyle = actorRoleStyles[step.actorRole || 'user'] || actorRoleStyles.user
                    return (
                        <div key={step.stepNum} className="relative">
                            {/* Step Badge positioned on the timeline line */}
                            <div className="absolute -left-[35px] top-0 w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-4 ring-white">
                                {step.stepNum}
                            </div>

                            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${actorStyle}`}>
                                        {step.actor}
                                    </span>
                                    {step.statusBadge && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                                            {step.statusBadge}
                                        </span>
                                    )}
                                </div>
                                <h5 className="font-bold text-slate-900 text-sm">{step.title}</h5>
                                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{step.desc}</p>

                                {step.branches && step.branches.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-2">
                                        {step.branches.map((b, bIdx) => {
                                            const bStyle = branchStyles[b.type] || branchStyles.neutral
                                            return (
                                                <div key={bIdx} className={`p-2.5 rounded-lg border ${bStyle.bg} ${bStyle.border} ${bStyle.text}`}>
                                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                                        <span className="font-bold text-xs">{b.label}</span>
                                                        {b.status && (
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${bStyle.badge}`}>
                                                                {b.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] opacity-90 leading-relaxed">{b.text}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Desktop View: Expanded Stepper with Decision Branches (768px+) */}
            <div className="hidden md:block space-y-3.5">
                {steps.map((step) => {
                    const actorStyle = actorRoleStyles[step.actorRole || 'user'] || actorRoleStyles.user
                    return (
                        <div key={step.stepNum} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors shadow-2xs">
                            <div className="flex items-start gap-3.5">
                                <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                                    {step.stepNum}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${actorStyle}`}>
                                                {step.actor}
                                            </span>
                                            <h5 className="font-bold text-slate-900 text-sm">{step.title}</h5>
                                        </div>
                                        {step.statusBadge && (
                                            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                                                {step.statusBadge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>

                                    {step.branches && step.branches.length > 0 && (
                                        <div className={`mt-3 pt-3 border-t border-slate-100 grid gap-2.5 ${step.branches.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                            {step.branches.map((b, bIdx) => {
                                                const bStyle = branchStyles[b.type] || branchStyles.neutral
                                                return (
                                                    <div key={bIdx} className={`p-2.5 rounded-lg border ${bStyle.bg} ${bStyle.border} ${bStyle.text}`}>
                                                        <div className="flex items-center justify-between gap-1 mb-1">
                                                            <span className="font-bold text-xs">{b.label}</span>
                                                            {b.status && (
                                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${bStyle.badge}`}>
                                                                    {b.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs opacity-90 leading-relaxed">{b.text}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
