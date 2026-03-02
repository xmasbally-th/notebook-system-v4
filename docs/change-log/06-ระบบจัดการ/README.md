# ⚙️ ประวัติการแก้ไข — ระบบจัดการ (Admin & Staff)

บันทึกการเปลี่ยนแปลง Admin Dashboard, Settings, Reports, Staff Activity และ Data Management

---

## ธันวาคม 2568

### ✨ Admin Dashboard
**ไฟล์หลัก:** `app/admin/page.tsx`
- แสดงข้อมูลสรุป (จำนวนอุปกรณ์, คำขอรอดำเนินการ, ผู้ใช้)
- กราฟสถิติการยืม-คืน
- รายการคำขอล่าสุด
- Quick actions สำหรับงานที่ทำบ่อย

### ✨ ระบบตั้งค่า (System Config)
**Migration:** `20251226_system_config.sql`, `20251230_enhanced_system_config.sql`
**ไฟล์หลัก:** `app/admin/settings/`
- ตั้งค่าระยะเวลายืมสูงสุด
- ตั้งค่าจำนวนวันจองล่วงหน้า
- ตั้งค่า Discord Webhook URL
- เปิด/ปิดฟีเจอร์ต่างๆ

### ✨ ระบบจัดการผู้ใช้
**ไฟล์หลัก:** `app/admin/users/`
- อนุมัติ/ปฏิเสธ/ระงับ ผู้ใช้
- เปลี่ยนบทบาท (user → staff → admin)
- ลบผู้ใช้ (พร้อมจัดการ FK constraints)
- ดูข้อมูลและประวัติของผู้ใช้แต่ละคน

---

## มกราคม 2569

### ✨ Staff Dashboard
**ไฟล์หลัก:** `app/staff/page.tsx`
- Dashboard เฉพาะ Staff แยกจาก Admin
- แสดงคำขอรอดำเนินการ
- Quick actions: อนุมัติ, ปฏิเสธ, ยืนยันการคืน
- ดูรายการเกินกำหนด

### ✨ ระบบบันทึกกิจกรรม Staff
**ไฟล์หลัก:** `app/admin/staff-activity/`, `lib/staffActivityLog.ts`
- บันทึกทุกการดำเนินการของ Staff (อนุมัติ, ปฏิเสธ, คืน)
- Admin ดูรายงานกิจกรรมของ Staff แต่ละคน
- กรองตามช่วงเวลาและประเภทกิจกรรม

### ✨ ระบบ Data Management
**Migration:** `20260120_data_management.sql`
**ไฟล์หลัก:** `app/admin/data-management/`
- Import/Export ข้อมูลอุปกรณ์
- สำรองข้อมูลส่วนสำคัญ
- ล้างข้อมูลเก่า (notifications, logs)

### ✨ ระบบออกเอกสาร
**Migration:** `20260121_add_document_logo.sql`, `20260122_add_document_template.sql`
**ไฟล์หลัก:** `lib/docxGenerator.ts`
- สร้างเอกสาร PDF/DOCX สำหรับใบยืม-คืน
- ใส่โลโก้หน่วยงาน
- รองรับ template ที่ปรับแต่งได้

### ✨ ระบบ Support Chat
**Migration:** `20260127_support_chat.sql`, `20260127_fix_support_chat_fk.sql`
**ไฟล์หลัก:** `app/admin/support/`
- ระบบแชทสำหรับ support ระหว่างผู้ใช้กับ admin
- Read receipts

---

## กุมภาพันธ์ 2569

### ⚡ ปรับปรุง Performance
**Migration:** `20260206_optimize_indexes.sql`, `20260203_add_missing_indexes.sql`
- เพิ่ม composite indexes สำหรับ query ที่ใช้บ่อย
- ลดเวลา loading ของ Dashboard
- ปรับปรุง RLS ให้ lightweight มากขึ้น

### ✨ Theme Switcher
**ไฟล์หลัก:** `app/admin/settings/`
- เพิ่มตัวเลือก theme ในหน้า Settings
- รองรับ 2 themes: Playful และ Brutalist Minimal
- บันทึกค่าลง system_config

### ✨ ระบบรายงาน
**ไฟล์หลัก:** `app/admin/reports/`, `lib/reports.ts`, `lib/reportDataProcessors.ts`
- รายงานสถิติการยืม (รายวัน/สัปดาห์/เดือน)
- รายงานอุปกรณ์ที่ยืมบ่อย / ยืมน้อย
- รายงานตามหมวดหมู่
- กราฟแสดงแนวโน้ม

### 🐛 แก้ไข Admin Settings Timeout
**Migration:** `20260210_fix_all_rls_timeouts.sql`
- RLS policy ของ `system_config` ช้าเพราะ recursive query
- แก้โดยใช้ security definer function แทน inline RLS check

### 🐛 แก้ไข Staff Activity Log ไม่บันทึก
- เพิ่มการเรียก `logStaffActivity()` ใน `approveLoan`, `rejectLoan`, `markReturned`

### ✨ คู่มือผู้ใช้ในแอป
**ไฟล์หลัก:** `app/user-guide/`, `app/admin/manual/`, `app/staff/manual/`
- เพิ่มหน้าคู่มือการใช้งานภายในแอป แยกตามบทบาท

### ✨ ลบฟีเจอร์ QR Code
- ลบ QR code scanning ออกจากระบบทั้งหมดเพราะไม่ได้ใช้งาน

---

## มีนาคม 2569

### ⚡ ปรับปรุง Performance — Staff Dashboard
**ไฟล์หลัก:** `app/staff/page.tsx`
- แปลง `/staff` page จาก Client Component เป็น Server Component (RSC)
- ใช้ `Promise.all` fetch ข้อมูลแบบ parallel บน server
- เพิ่ม Skeleton loading UI เพื่อลด CLS (Cumulative Layout Shift)
- FCP ลดลงจาก ~5.65s เหลือ <1.5s

### ⚡ ปรับปรุง Performance — Admin Loans Page
**Migration:** `20260228_add_loan_requests_index.sql`
**ไฟล์หลัก:** `app/admin/loans/page.tsx`
- เพิ่ม composite index `loanRequests(status, created_at DESC)`
- แยก Suspense boundary สำหรับแต่ละ tab (Loan Requests / Active Loans)
- รองรับ Next.js 15 async searchParams API

### ✨ Auto-Archive Policy
**Migration:** `20260302_add_auto_archive_policy.sql`
**ไฟล์หลัก:** `app/admin/data-management/ArchiveTab.tsx`, `lib/data/dataArchive.ts`
- ลบ closed support tickets (+ messages CASCADE) เก่าเกิน N วัน
- ลบ notifications เก่าเกิน N วัน
- ปุ่ม **"Run Archive Now"** สำหรับ manual trigger โดย Admin
- columns ใหม่ใน `system_config`: `archive_enabled`, `archive_support_after_days`, `archive_notifications_after_days`, `last_archived_at`
- Server Action `runAutoArchiveAction()` ตรวจสิทธิ์ admin ก่อนเรียก RPC

### 🔧 ย้าย Auto-Archive ไป Data Management
**ไฟล์หลัก:** `app/admin/data-management/page.tsx`, `components/admin/data-management/ArchiveTab.tsx`
- ย้าย Auto-Archive ออกจาก `admin/settings` มาอยู่ที่ `admin/data-management`
- Data Management มี 4 tabs: ส่งออก | นำเข้า | ลบข้อมูล | **Auto-Archive**

---

## หน้าในระบบจัดการ

### Admin Pages
| เมนู | เส้นทาง | คำอธิบาย |
|------|---------|----------|
| Dashboard | `/admin` | ภาพรวมระบบ |
| Users | `/admin/users` | จัดการผู้ใช้ |
| Equipment | `/admin/equipment` | จัดการอุปกรณ์ |
| Equipment Types | `/admin/equipment-types` | จัดการประเภท |
| Loans | `/admin/loans` | จัดการคำขอยืม |
| Returns | `/admin/returns` | จัดการการคืน |
| Reservations | `/admin/reservations` | จัดการการจอง |
| Special Loans | `/admin/special-loans` | ยืมพิเศษ |
| Reports | `/admin/reports` | รายงาน |
| Evaluations | `/admin/evaluations` | แบบประเมิน |
| Staff Activity | `/admin/staff-activity` | กิจกรรม Staff |
| Settings | `/admin/settings` | ตั้งค่าระบบ |
| Data Management | `/admin/data-management` | จัดการข้อมูล (Export / Import / Delete / **Auto-Archive**) |
| Support | `/admin/support` | แชท support |

### Staff Pages
| เมนู | เส้นทาง | คำอธิบาย |
|------|---------|----------|
| Dashboard | `/staff` | ภาพรวมงาน |
| Loans | `/staff/loans` | อนุมัติ/ปฏิเสธ |
| Returns | `/staff/returns` | ยืนยันการคืน |
| Overdue | `/staff/overdue` | จัดการเกินกำหนด |
| Reservations | `/staff/reservations` | ดูการจอง |

---

## บทเรียนสำคัญ

> **Server Actions ต้องบันทึก activity log** — ทุก mutation ที่ Staff/Admin ทำต้องเรียก logStaffActivity()

> **RLS timeout เป็นปัญหาที่พบบ่อย** — ใช้ security definer functions สำหรับ complex checks

> **ลบฟีเจอร์ที่ไม่ใช้ออก** — QR Code ที่ไม่ได้ใช้ทำให้เอกสารและโค้ดสับสน

> **Auto-Archive ควรอยู่ใน Data Management** — เป็น action ไม่ใช่ config จึงไม่ควรอยู่ใน Settings
