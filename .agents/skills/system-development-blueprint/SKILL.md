---
name: system-development-blueprint
description: ต้นแบบ (Blueprint) และมาตรฐานสำหรับการพัฒนาระบบเว็บแอปพลิเคชันด้วย Next.js และ Supabase เพื่อใช้เป็นแนวทางในการขึ้นระบบใหม่
---

# 🏗️ System Development Blueprint (ต้นแบบการพัฒนาระบบ)

เอกสารนี้เป็นต้นแบบ (Blueprint) ที่สรุปจากประสบการณ์จริงในการพัฒนาระบบ **Notebook System V5** — ระบบยืม-คืนอุปกรณ์ที่ใช้งานจริงในองค์กร — เพื่อใช้เป็นแนวทางมาตรฐานในการสร้างระบบอื่น ๆ ด้วย **Next.js (App Router)** + **Supabase** ได้อย่างมีประสิทธิภาพ ปลอดภัย และดูแลรักษาง่าย

---

## 1. 🛠️ Tech Stack (เทคโนโลยีหลัก)

| ชั้น (Layer) | เทคโนโลยี | หน้าที่ |
|---|---|---|
| Framework | **Next.js 16+ (App Router)** | โครงสร้างหลัก, Routing, Server/Client Components |
| Language | **TypeScript** | Type Safety ตลอดทั้งโปรเจกต์ |
| Database & Auth | **Supabase (PostgreSQL)** | ฐานข้อมูล, Authentication (Google OAuth), RLS, Realtime, Storage |
| Styling | **TailwindCSS 4** | จัดการ UI อย่างรวดเร็วและสม่ำเสมอ |
| UI Components | **Custom Components (ไม่ใช้ Shadcn)** | Components เฉพาะระบบ จัดตาม Feature |
| Data Fetching | **React Query (@tanstack/react-query)** | Client-side caching, Realtime bridge |
| Mutation | **Server Actions (co-located `actions.ts`)** | การเปลี่ยนแปลงข้อมูลผ่านฝั่ง Server |
| Validation | **Zod** | Schema Validation สำหรับทุก Input |
| Charts | **Recharts** | กราฟและสถิติสำหรับ Dashboard/Analytics |
| Icons | **Lucide React** | ชุดไอคอน (ใช้ `optimizePackageImports`) |
| Notification | **Discord Webhooks + WeLPRU API + In-App DB** | แจ้งเตือน 3 ช่องทางแบบ Parallel |
| Document Gen | **docxtemplater + PizZip + @react-pdf/renderer** | สร้างเอกสาร Word / PDF |
| Date | **date-fns** + Custom Thai formatter | จัดการวันที่ ภาษาไทย/พุทธศักราช |
| Analytics | **Vercel Analytics + Speed Insights** | วัด Performance จริง |
| CAPTCHA | **Cloudflare Turnstile (react-turnstile)** | ป้องกัน Bot |
| Effects | **canvas-confetti** | เอฟเฟกต์ฉลอง |

---

## 2. 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root Layout (Thai Fonts, Providers, AuthGuard)
│   ├── page.tsx                    # หน้าแรก (Landing)
│   ├── loading.tsx                 # Root Loading State
│   ├── global-error.tsx            # Global Error Boundary
│   ├── not-found.tsx               # หน้า 404
│   ├── globals.css                 # Global Styles
│   │
│   ├── login/                      # หน้า Login
│   ├── register/                   # ลงทะเบียน + Complete Profile
│   │   └── actions.ts              # Server Actions (co-located)
│   ├── auth/
│   │   ├── callback/route.ts       # OAuth Callback (Route Handler)
│   │   └── auth-code-error/        # หน้าแสดง Error จาก Auth
│   │
│   ├── admin/                      # 🔐 ระบบ Admin (role=admin)
│   │   ├── layout.tsx              # Admin Layout + Sidebar
│   │   ├── page.tsx                # Dashboard
│   │   ├── DashboardClient.tsx     # Client Component แยกออกมา
│   │   ├── error.tsx               # Error Boundary
│   │   ├── equipment/              # จัดการอุปกรณ์ + [id] + new
│   │   ├── equipment-types/        # จัดการประเภทอุปกรณ์ + [id] + new
│   │   ├── loans/                  # จัดการยืม-คืน (+ _components/)
│   │   ├── users/                  # จัดการผู้ใช้ / แก้ Role
│   │   ├── reservations/           # อนุมัติ/ปฏิเสธคำจอง
│   │   ├── special-loans/          # ยืมพิเศษ (ยืมแบบกลุ่ม/องค์กร)
│   │   ├── evaluations/            # รายงานการประเมิน
│   │   ├── reports/                # รายงานสถิติ + กราฟ
│   │   ├── settings/               # ตั้งค่าระบบ + departments/
│   │   ├── notifications/          # จัดการระบบแจ้งเตือน
│   │   ├── staff-activity/         # ดู Audit Log
│   │   ├── data-management/        # นำเข้า/ส่งออก/จัดเก็บข้อมูล
│   │   └── manual/                 # คู่มือสำหรับ Admin
│   │
│   ├── staff/                      # 🔐 ระบบ Staff (role=staff|admin)
│   │   ├── layout.tsx              # Staff Layout + Sidebar
│   │   ├── page.tsx                # Staff Dashboard (Server Component)
│   │   ├── loans/                  # ดำเนินการยืม
│   │   ├── returns/                # ดำเนินการคืน
│   │   ├── reservations/           # ดูคำจอง
│   │   ├── overdue/                # ติดตามการเกินกำหนด
│   │   └── manual/                 # คู่มือสำหรับ Staff
│   │
│   ├── equipment/                  # 🌐 หน้ารายการอุปกรณ์ (Public)
│   │   ├── page.tsx
│   │   ├── actions.ts
│   │   └── [id]/                   # รายละเอียดอุปกรณ์ + ฟอร์มยืม/จอง
│   ├── my-loans/                   # 🔐 ประวัติการยืมของผู้ใช้
│   ├── my-reservations/            # 🔐 การจองของผู้ใช้
│   ├── profile/                    # 🔐 โปรไฟล์ + /setup
│   ├── pending-approval/           # หน้ารอ Admin อนุมัติบัญชี
│   ├── user-guide/                 # คู่มือใช้งาน (ทุก Role)
│   └── notifications/              # Actions สำหรับระบบแจ้งเตือน
│
├── components/                     # React Components แยกตาม Feature
│   ├── admin/                      # Admin UI (Sidebar, Headers, Forms)
│   ├── auth/                       # AuthGuard, LoginForm, ProfileCompletion
│   ├── cart/                       # ระบบตะกร้ายืมอุปกรณ์
│   ├── equipment/                  # Card, List, Filters
│   ├── evaluations/                # Modal ให้คะแนน, Prompt
│   ├── home/                       # Sections ของหน้าแรก
│   ├── layout/                     # Header, Footer
│   ├── loans/                      # My Loans Client
│   ├── providers/                  # QueryProvider, ThemeContext, LazyComponents
│   ├── staff/                      # Staff UI (Sidebar, Headers, Skeleton)
│   ├── error/                      # ErrorBoundary Component
│   ├── debug/                      # DebugConsole (Dev only)
│   ├── ui/                         # Shared Primitives (Loading, Pagination, Toast, ImageUpload)
│   └── ThemeToggle.tsx             # สลับธีม
│
├── hooks/                          # Custom React Hooks (18 hooks)
│   ├── useProfile.ts               # ข้อมูลผู้ใช้ปัจจุบัน
│   ├── useEquipment.ts             # React Query: อุปกรณ์
│   ├── useEquipmentTypes.ts        # React Query: ประเภทอุปกรณ์
│   ├── useEquipmentFilters.ts      # สถานะ Filter
│   ├── useEquipmentImages.ts       # จัดการรูปอุปกรณ์
│   ├── useReservations.ts          # React Query: การจอง
│   ├── useReservationValidation.ts # Validation ฟอร์มจอง
│   ├── useLoanValidation.ts        # Validation ฟอร์มยืม
│   ├── useReportData.ts            # ดึงข้อมูลรายงาน
│   ├── useSystemConfig.ts          # การตั้งค่าระบบ
│   ├── useUserNotifications.ts     # แจ้งเตือนสำหรับ User
│   ├── useStaffNotifications.ts    # แจ้งเตือนสำหรับ Staff
│   ├── useSharedNotificationData.ts# แชร์ข้อมูลแจ้งเตือนข้าม Components
│   ├── useRealtimeInvalidator.ts   # ★ Supabase Realtime → React Query Cache
│   ├── useRecentlyBorrowed.ts      # รายการยืมล่าสุด
│   ├── useDuplicateCheck.ts        # ตรวจสอบข้อมูลซ้ำ
│   ├── usePagination.ts            # Pagination State
│   └── useRealtimeUsers.ts         # Realtime รายชื่อ User
│
├── lib/                            # Core Logic
│   ├── supabase/
│   │   ├── client.ts               # Browser Client (Singleton + Proxy Pattern + Mock Fallback)
│   │   └── server.ts               # Server Client + Admin Client (Service Role)
│   ├── schemas/                    # Zod Schemas (แยกตาม Domain, มี barrel export)
│   │   ├── commonSchema.ts
│   │   ├── equipmentSchema.ts
│   │   ├── loanSchema.ts
│   │   ├── reservationSchema.ts
│   │   ├── profileSchema.ts
│   │   ├── specialLoanSchema.ts
│   │   ├── notificationSchema.ts
│   │   └── index.ts                # Barrel export
│   ├── domain/                     # Domain Validation Logic
│   │   └── bookingValidator.ts     # ตรวจสอบความซ้ำซ้อนของการจอง
│   ├── data/                       # Data Access Layer
│   │   ├── dataArchive.ts          # Archive ข้อมูลเก่า
│   │   ├── dataDelete.ts           # ลบข้อมูล
│   │   ├── dataExport.ts           # Export ข้อมูล
│   │   ├── dataImport.ts           # Import ข้อมูล
│   │   ├── my-loans.ts             # ดึงข้อมูลยืมของผู้ใช้
│   │   └── staff-dashboard.ts      # ดึงข้อมูล Dashboard Staff
│   ├── auth-guard.ts               # Server Guards: requireAdmin(), requireStaff(), requireApprovedUser()
│   ├── permissions.ts              # RBAC: Role Hierarchy (admin=3, staff=2, user=1)
│   ├── notifications.ts            # Discord + WeLPRU Push (Low-level)
│   ├── serverNotify.ts             # ★ Orchestration: notifyAndLog() — 3 channels + log in parallel
│   ├── reservations.ts             # Reservation Business Logic
│   ├── specialLoans.ts             # Special Loan Business Logic
│   ├── loans.ts                    # Loan Utilities
│   ├── reports.ts                  # Report Generation
│   ├── reportDataProcessors.ts     # Report Data Processing
│   ├── staffActivityLog.ts         # Audit Trail Logging
│   ├── docxGenerator.ts            # สร้างเอกสาร Word
│   ├── formatThaiDate.ts           # แปลงวันที่เป็นภาษาไทย/พ.ศ.
│   ├── uploadImage.ts              # Upload รูปไป Supabase Storage
│   └── utils.ts                    # cn() utility
│
├── proxy.ts                        # ★ Auth Middleware (Next.js 16 Proxy Pattern)
├── supabase/
│   ├── migrations/                 # SQL Migrations (30 files)
│   └── types.ts                    # Generated TypeScript Types
├── public/                         # Static Assets
└── docs/                           # เอกสารและ Changelogs
    ├── README.md                   # ภาพรวมระบบ
    ├── flowcharts.md               # Flowcharts
    ├── user-guides/                # คู่มือแยกตาม Role (8 ไฟล์)
    └── change-log/                 # Changelogs แยกตาม Domain (6 หมวด)
        ├── 01-ฐานข้อมูล/
        ├── 02-ระบบผู้ใช้/
        ├── 03-ระบบอุปกรณ์/
        ├── 04-ระบบยืมคืน/
        ├── 05-ระบบแจ้งเตือน/
        └── 06-ระบบจัดการ/
```

### หลักการจัดโครงสร้าง:
- **Route แยกตาม Role:** `admin/`, `staff/`, หน้าผู้ใช้ทั่วไป — แต่ละกลุ่มมี `layout.tsx` เฉพาะ
- **Server Actions วางคู่กับ Route (Co-located):** ไฟล์ `actions.ts` อยู่ข้างๆ `page.tsx`
- **Zod Schemas แยกออกจาก Actions:** อยู่ใน `lib/schemas/` พร้อม Barrel export
- **Components แยกตาม Feature:** `components/admin/`, `components/staff/`, `components/equipment/`
- **Hooks แยกเป็นไฟล์เดี่ยว:** 1 Hook = 1 ไฟล์ ตั้งชื่อตาม Domain

---

## 3. 🔐 ระบบ Authentication (Google OAuth + Supabase)

### โครงสร้าง Auth:
```
proxy.ts          → ตรวจสอบ Route + Role (Edge Level)
AuthGuard.tsx     → ตรวจสอบ Auth ฝั่ง Client (Component Level)
auth-guard.ts     → ตรวจสอบ Auth ฝั่ง Server (Server Action Level)
```

### Auth Flow:
```
User คลิก Login → Supabase OAuth (Google) → Redirect /auth/callback
→ route.ts แลก code → เซ็ต Cookie → ตรวจสอบ Profile
→ ถ้าไม่มี → สร้าง Profile อัตโนมัติ (Trigger: handle_new_user)
→ Redirect ไป /register/complete-profile บังคับกรอกข้อมูล
→ รอ Admin อนุมัติ (status: pending → approved)
→ User ที่ยังไม่ approved → Redirect ไป /pending-approval
```

### Supabase Client Setup:
```typescript
// lib/supabase/client.ts — Browser Client
// ★ ใช้ Singleton + JavaScript Proxy Pattern
// ★ มี Mock Fallback ถ้า env vars ไม่มี (ป้องกัน crash ตอน build)
import { createBrowserClient } from '@supabase/ssr'

// lib/supabase/server.ts — Server Client
// createClient()      → ใช้กับ Server Components / Actions (Cookie-based)
// createAdminClient()  → Service Role Client (ข้าม RLS)
//   ★ autoRefreshToken: false, persistSession: false
```

### Next.js 16 Proxy Pattern (แทน middleware.ts):
```typescript
// proxy.ts — ใช้แทน middleware.ts แบบเดิม
// export default async function proxy(request) { ... }
// ตรวจสอบ Route: PUBLIC_ROUTES, ADMIN_ROUTES, STAFF_ROUTES
// Fetch profile (role + status) จาก Supabase
// Redirect ตาม Role: admin → /admin, staff → /staff
```

### หลักสำคัญ:
- ใช้ `@supabase/ssr` เสมอ — Session ผ่าน Cookie (ไม่ใช่ localStorage)
- **Auto-Admin First User:** ผู้ใช้คนแรกที่ลงทะเบียนจะได้ role=admin อัตโนมัติ
- **User Approval Flow:** ผู้ใช้ใหม่ต้องรอ Admin อนุมัติก่อนใช้งาน (pending → approved)
- **Reject Reason:** ถ้า Admin ปฏิเสธ จะบันทึกเหตุผลให้ผู้ใช้ทราบ

---

## 4. 🛡️ Server Actions + Zod Validation (มาตรฐาน Backend)

### โครงสร้างมาตรฐาน (5 ขั้นตอน):
```typescript
// app/admin/equipment/actions.ts (Co-located กับ Route)
'use server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import { notifyAndLog } from '@/lib/serverNotify'

// ขั้นที่ 1: Import Schema จาก lib/schemas/
import { CreateEquipmentSchema } from '@/lib/schemas/equipmentSchema'

export async function createEquipmentAction(formData: FormData) {
    // ขั้นที่ 2: ตรวจสอบ Auth + Role
    const user = await requireAdmin() // throws ถ้าไม่ใช่ Admin

    // ขั้นที่ 3: Validate ด้วย Zod
    const parsed = CreateEquipmentSchema.safeParse({
        name: formData.get('name'),
        categoryId: formData.get('categoryId'),
    })
    if (!parsed.success) {
        return { error: parsed.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
    }

    // ขั้นที่ 4: ดำเนินการกับฐานข้อมูล
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('equipment')
        .insert({ ...parsed.data })
        .select().single()

    if (error) return { error: error.message }

    // ขั้นที่ 5: แจ้งเตือน + Log + คืนค่ามาตรฐาน
    await notifyAndLog({
        eventType: 'equipment_created',
        userId: user.id,
        details: { equipmentName: parsed.data.name }
    })

    return { success: true, data }
}
```

### กฎสำคัญ:
- **Co-locate Server Actions กับ Route** — ไฟล์ `actions.ts` อยู่ข้างๆ `page.tsx`
- **แยก Schema ออกไป `lib/schemas/`** — Reuse ได้ทั้ง Server และ Client validation
- **ใช้ `requireAdmin()` / `requireStaff()` / `requireApprovedUser()`** จาก `lib/auth-guard.ts`
- **Response รูปแบบเดียวกัน:** `{ success?: boolean, data?: any, error?: string }`
- **เรียก `notifyAndLog()`** หลังทุก Mutation ที่สำคัญ

---

## 5. 🔒 ความปลอดภัย 3 ชั้น (3-Layer Security)

### ชั้นที่ 1: Proxy / Middleware (Route Protection)
- ตรวจสอบ Session + Role ก่อนเข้าทุก Route
- Redirect ผู้ใช้ที่ยังไม่ approved ไป `/pending-approval`
- Redirect ผู้ใช้ที่ไม่มี Role เหมาะสมออกจาก `/admin`, `/staff`

### ชั้นที่ 2: Application Level
- **Client:** `AuthGuard.tsx` component ซ่อนปุ่ม/เมนูตาม Role
- **Server:** `auth-guard.ts` — ตรวจสอบ Role ซ้ำใน Server Actions **ทุกครั้ง** (ไม่พึ่งเฉพาะ Proxy)

### ชั้นที่ 3: Database Level (Row Level Security)
- เปิด RLS **ทุกตาราง** — ห้ามข้ามเด็ดขาด
- ★ ใช้ `get_my_role()` — **SECURITY DEFINER, STABLE** function ที่ Cache per-query เพื่อ:
  - ป้องกัน Recursive RLS (ปัญหาหลักที่พบ)
  - ลด N+1 Profile Lookups
  - เป็น Single Source of Truth สำหรับ Role Check
- ใช้ `service_role` key สำหรับ Admin Operations ที่ต้องข้าม RLS
- **Profile Protection Trigger:** ป้องกันผู้ใช้ Escalate Role ตัวเอง

### ★ SQL Pattern สำคัญ: `get_my_role()`
```sql
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE                  -- Cache ผลลัพธ์ภายใน Query เดียวกัน
SECURITY DEFINER        -- รันด้วยสิทธิ์ของ Function Owner (ข้าม RLS)
SET search_path = public -- ป้องกัน search_path injection
AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid()
$$;
```

### Database Triggers สำคัญ:
| Trigger | หน้าที่ |
|---|---|
| `handle_new_user()` | สร้าง Profile อัตโนมัติเมื่อ Sign Up |
| `sync_equipment_status_on_loan()` | อัปเดตสถานะอุปกรณ์เมื่อยืม/คืน |
| `check_combined_reservation_conflict()` | ป้องกันจองซ้ำซ้อน (ข้ามตาราง) |
| `protect_profile_fields_trigger()` | ป้องกัน User แก้ไข Role ตัวเอง |
| `notify_loan_status_change()` | สร้าง In-App Notification อัตโนมัติ |
| `enforce_approved_user()` | บังคับให้เฉพาะ User ที่ approved แล้วเท่านั้นสร้างรายการได้ |

---

## 6. 🗄️ Database Schema & Migration Strategy

### ตาราง (14 ตาราง):
| ตาราง | หน้าที่ |
|---|---|
| `profiles` | ข้อมูลผู้ใช้ (role, status, department, employee_id) |
| `departments` | รายชื่อแผนก/หน่วยงาน |
| `equipment` | รายการอุปกรณ์ (status, category, serial_number, images JSONB) |
| `equipment_types` | ประเภทอุปกรณ์ (Dynamic, DB-driven) |
| `loanRequests` | คำขอยืมอุปกรณ์ |
| `reservations` | คำขอจองอุปกรณ์ (pending → approved/rejected) |
| `special_loan_requests` | การยืมพิเศษแบบกลุ่ม (equipment_ids UUID[]) |
| `evaluations` | การประเมินหลังคืนอุปกรณ์ (1-5 rating) |
| `staff_activity_log` | Audit Trail (ทุกกิจกรรมของ Staff/Admin) |
| `notifications` | In-App Notifications (read/unread) |
| `system_config` | Dynamic Config (key-value) |
| `data_backups` | บันทึกประวัติ Backup ข้อมูล |

### Database Patterns ที่ใช้:
- **Enums:** `user_role`, `user_status`, `equipment_status`, `reservation_status`
- **UUID ทุก Primary Key:** ใช้ `gen_random_uuid()`
- **Timestamps ทุกตาราง:** `created_at`, `updated_at`
- **JSONB สำหรับข้อมูลยืดหยุ่น:** images, specifications, location
- **TEXT[] สำหรับ Search:** `search_keywords TEXT[]` บน equipment
- **GIN Index บน UUID Arrays:** สำหรับ `special_loan_requests.equipment_ids`
- **Denormalization:** เก็บ `user_name`, `equipment_name` ในตารางที่ Query บ่อย — ลด JOIN

### Migration Strategy:
- **V5 Baseline = 4 ไฟล์หลัก** (รวมจาก 70+ ไฟล์เก่า):
  1. `00001_v5_base_schema.sql` — Tables, Enums, Functions, Indexes
  2. `00002_v5_security_and_triggers.sql` — RLS Policies, Triggers
  3. `00003_v5_system_seed.sql` — Initial Seed Data
  4. `00004_v5_security_hardening.sql` — `get_my_role()`, Hardened Policies
- **Incremental Migrations** (26 ไฟล์ต่อมา): แก้ RLS, เพิ่ม Triggers, เพิ่มฟีเจอร์
- **กฎ:** ห้ามแก้ไฟล์ Migration เก่า — สร้างไฟล์ใหม่เสมอ (Forward-Only)
- **แต่ละไฟล์ทำหน้าที่เดียว** — เพื่อ Rollback ง่าย

---

## 7. 📊 Data Fetching Strategy (กลยุทธ์การดึงข้อมูล)

### Server Components (Default — เลือกใช้ก่อนเสมอ):
- ดึงข้อมูลจาก Supabase โดยตรง — **ไม่ต้องทำ API Route**
- Staff Dashboard แปลงจาก Client → Server Component ลด FCP จาก **5.65s → <1.5s** (ลด 73%)

### Client Components + React Query:
- ใช้เมื่อ UI ต้อง Refresh อัตโนมัติ หรือมี Interaction ซับซ้อน
- ห่อด้วย Custom Hook (เช่น `useEquipment`, `useReservations`)

### ★ Realtime Bridge Pattern (Supabase Realtime → React Query):
```typescript
// hooks/useRealtimeInvalidator.ts
// เมื่อ Supabase Realtime ตรวจจับการเปลี่ยนแปลงในตาราง
// → Invalidate React Query Cache อัตโนมัติ
// → UI อัปเดตทันทีโดยไม่ต้อง Manual Refetch
```

### No API Routes:
- ระบบนี้ **ไม่ใช้ API Routes** (ยกเว้น OAuth Callback) — ทุกอย่างผ่าน Server Actions

---

## 8. 🔔 ระบบแจ้งเตือน 3 ช่องทาง (Multi-Channel Notifications)

### สถาปัตยกรรม 3 ชั้น:
```
Server Action → notifyAndLog() → Promise.allSettled([
    1. Discord Webhook (sendDiscordNotification)
    2. WeLPRU Push (sendWeLPRUNotification)  
    3. Activity Log (logStaffActivity)
    4. In-App Notification (DB Trigger)
])
```

### ชั้นที่ 1: Low-Level Transport (`lib/notifications.ts`)
- `sendDiscordNotification()` — Discord Webhooks + Exponential Backoff Retry + Rate Limit Handling
- `sendWeLPRUNotification()` — University Push API (ส่งถึง Student ID)
- `sendWeLPRUGroupBroadcast()` — Broadcast ทั้งกลุ่ม
- Webhook URL / API Key ดึงจาก `system_config` (ไม่ Hardcode)

### ชั้นที่ 2: Orchestration (`lib/serverNotify.ts`)
- `notifyAndLog()` — ฟังก์ชันหลักที่ Server Actions เรียก
- ยิง 3-4 ช่องทาง **พร้อมกัน** ด้วย `Promise.allSettled()`
- อ่าน Template + Toggle จาก `system_config.notification_settings`
- รองรับ **13 Event Types** (loan_approved, loan_rejected, etc.)
- ★ **Fire-and-Forget:** ไม่ Throw Error — ถ้าแจ้งเตือนไม่สำเร็จ ไม่บล็อกการทำงานหลัก

### ชั้นที่ 3: In-App Notifications
- Database Triggers สร้าง Notification อัตโนมัติ
- Client Hooks: `useUserNotifications`, `useStaffNotifications`
- UI: Bell Icons + Dropdown แยกตาม Role
- Auto-Archive ข้อมูลแจ้งเตือนเก่า (จัดการในหน้า Data Management)

---

## 9. ⚙️ Dynamic Configuration & System Management

### Dynamic Config (ตาราง `system_config`):
- เก็บค่า Key-Value ที่ Admin แก้ไขผ่านหน้าเว็บได้ (ไม่ต้อง Re-deploy):
  - Discord Webhook URLs (แยกตาม Channel: general, auth, loan, reservation)
  - WeLPRU API Key
  - จำนวนอุปกรณ์สูงสุดที่ยืมได้ (แยกตาม Role และประเภท)
  - Notification Settings (Toggle เปิด/ปิด + Template ข้อความ)
- ★ RLS: เข้าถึงได้เฉพาะ Admin เท่านั้น (ข้อมูลอ่อนไหว)

### Audit Trail:
- ทุกกิจกรรมของ Staff/Admin ถูกบันทึกลง `staff_activity_log`
- เก็บ: user_id, action_type, target_entity, details (JSONB), timestamp
- มีหน้า `/admin/staff-activity` สำหรับดูย้อนหลัง

### Data Management:
- Import / Export ข้อมูลอุปกรณ์
- Auto-Archive ข้อมูลเก่า (Notifications, Logs)
- Database Backup Tracking

---

## 10. 🎨 UI/UX Patterns

### Theme System:
- รองรับ 2 ธีม: **Playful** (สีสด สนุก) และ **Brutalist Minimal** (เรียบ สะอาด)
- ใช้ CSS Variables + TailwindCSS `class` dark mode strategy
- ★ Inline `<script>` ใน Root Layout ป้องกัน Flash of Unstyled Content (FOSC)
- Thai Fonts: **Kanit** (หัวข้อ) + **Mali** (เนื้อหา)

### UX Patterns สำคัญ:
- **ProfileCompletionPopup:** Modal บังคับกรอกข้อมูลหลัง OAuth — ปิดไม่ได้
- **Cart System:** ใส่อุปกรณ์ลงตะกร้า → ยื่นคำขอยืมทีเดียว (เหมือน e-commerce)
- **Category-First UX:** ให้ผู้ใช้เลือกหมวดหมู่ก่อน → แสดงอุปกรณ์ในหมวดนั้น (ลดข้อมูล)
- **Evaluation Prompt:** แสดงฟอร์มประเมินอัตโนมัติหลังคืนอุปกรณ์
- **Overdue Tracking:** หน้าแสดงรายการเกินกำหนดสำหรับ Staff
- **User Guide In-App:** คู่มือใช้งานเป็นหน้าเว็บในระบบ (แยกตาม Role)

### Loading & Error States:
- `loading.tsx` สำหรับ Suspense Loading
- `error.tsx` สำหรับ Error Boundary (ข้อความภาษาไทย + ปุ่มลองใหม่)
- `global-error.tsx` สำหรับ Uncaught Errors
- **Skeleton Components** แสดงระหว่างรอข้อมูล (เช่น `StaffDashboardSkeleton`)
- **Toast Notifications** แจ้งผลลัพธ์ Action ทุกครั้ง

---

## 11. 🚀 Performance Best Practices

- **Server Components เป็น Default:** ใช้ `'use client'` เฉพาะเมื่อจำเป็น
- **React Query Caching:** ลด Fetch ซ้ำ + Realtime Invalidation
- **`optimizePackageImports`:** ใน `next.config.js` สำหรับ `lucide-react`, `recharts`, `date-fns`
- **Lazy Loading:** ใช้ `LazyComponents.tsx` สำหรับ Components ที่ไม่จำเป็นตอน Initial Load
- **Parallel Data Fetching:** ใช้ `Promise.all()` ดึงข้อมูลหลายตารางพร้อมกัน (Server Components)
- **Image Optimization:** ใช้ `next/image` + Remote Patterns สำหรับ Supabase Storage + Google Photos
- **Standalone Output:** `output: 'standalone'` สำหรับ Container/Docker deployment
- **Security Headers:** CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy
- **Static Asset Caching:** `Cache-Control: public, max-age=31536000, immutable` สำหรับ `/_next/static/*`

---

## 12. 🚢 Deployment Configuration

### Vercel (`vercel.json`):
- Clean URLs, Security Headers, Static Caching
- Framework: `nextjs`

### Next.js (`next.config.js`):
```javascript
// สิ่งที่ต้องตั้งค่าเสมอ:
{
  images: { remotePatterns: [/* Supabase Storage + Google */] },
  experimental: {
    serverActions: { allowedOrigins: ['localhost', 'your-domain.com'] },
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  async headers() { /* Security Headers */ },
  async redirects() { /* Legacy Route Redirects */ },
  output: 'standalone', // สำหรับ Container deployment
}
```

### Environment Variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key          # ใช้ฝั่ง Client (มี RLS คุม)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key       # ★ ฝั่ง Server เท่านั้น!
WELPRU_API_KEY=your-welpru-key                        # Push Notification API
```

---

## 13. 🧪 Testing Strategy (Simulation Scripts)

### วิธีทดสอบที่ใช้จริง:
ใช้ **Node.js Scripts** ที่เรียก Supabase API โดยตรง จำลองการใช้งานจริงทุก Role:

| Script | ทดสอบ |
|---|---|
| `simulate_all_user_flows.js` | ★ ครอบคลุมทั้งระบบ 5 เฟส (477 บรรทัด) |
| `simulate_registration.js` | การลงทะเบียน, Triggers, Notifications |
| `simulate_reservations.js` | Workflow การจอง |
| `simulate_loans.js` | Lifecycle การยืม-คืน (แยกตาม Status) |
| `simulate_special_loans.js` | การยืมพิเศษแบบกลุ่ม |
| `seed_equipment.js` | Seed ข้อมูลอุปกรณ์ตัวอย่าง |

### Pattern:
```javascript
// ใช้ service_role สำหรับ Setup/Teardown
// ใช้ anon_key client จำลอง User จริง
// แต่ละ Test สร้างและ Cleanup ข้อมูลเอง
// ★ ทดสอบ RLS ด้วย User แต่ละ Role — จับบั๊ก RLS ก่อน Deploy
```

---

## 14. 📝 Documentation Strategy

### โครงสร้างเอกสาร:
```
docs/
├── README.md                    # ภาพรวมระบบ + Getting Started
├── flowcharts.md                # System Flowcharts
├── Notebook-System-V5-Report.html # รายงานฉบับเต็ม
├── user-guides/                 # คู่มือแยกตาม Role (8 ไฟล์)
└── change-log/                  # ★ Changelogs แยกตาม Domain (6 หมวด)
    ├── 01-ฐานข้อมูล/
    ├── 02-ระบบผู้ใช้/
    ├── 03-ระบบอุปกรณ์/
    ├── 04-ระบบยืมคืน/
    ├── 05-ระบบแจ้งเตือน/
    └── 06-ระบบจัดการ/
```

### หลักการ:
- **Changelogs แยกตาม Domain** — ไม่รวมไฟล์เดียว ง่ายต่อการค้นหา
- **ตั้งชื่อเป็นภาษาไทย** — เพราะผู้ใช้เอกสารเป็นทีมไทย
- **User Guide อยู่ในระบบ** — หน้า `/user-guide` + `/admin/manual` + `/staff/manual`
- **มีไฟล์ `documentation.md` หลัก** ที่สรุปภาพรวมทางเทคนิค

---

## 15. 💡 บทเรียนจากการพัฒนาจริง (Lessons Learned)

### ✅ สิ่งที่ทำถูกต้องตั้งแต่แรก:
1. **Zod Validation ตั้งแต่เริ่ม** — ลดบั๊กจากข้อมูลผิดรูปแบบ
2. **Audit Trail ตั้งแต่เนิ่นๆ** — ใช้ได้จริงเมื่อต้องตรวจสอบย้อนหลัง
3. **Dynamic Config แทน Hardcode** — Admin ปรับค่าได้เองไม่ต้อง Re-deploy
4. **Server-First Approach** — ประสิทธิภาพดีกว่า Client Components มาก
5. **Auto-Admin First User** — ไม่ต้อง Config DB ด้วยมือตอนติดตั้ง

### ⚠️ ปัญหาที่พบบ่อยและวิธีแก้:

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| **RLS Infinite Recursion** | ตรวจ `profiles.role` ใน RLS ของตาราง `profiles` เอง | สร้าง `get_my_role()` SECURITY DEFINER function |
| **RLS Timeout** | N+1 Profile Lookups ในทุก RLS Check | ใช้ `get_my_role()` ที่ STABLE (cache per-query) |
| **User ค้นหาอุปกรณ์ไม่ได้** | RLS SELECT Policy เข้มเกิน | ปรับ Policy ให้ authenticated SELECT ได้ |
| **Staff คืนอุปกรณ์ไม่ได้** | ลืมเพิ่ม UPDATE Policy สำหรับ Staff | เพิ่ม Policy แยกสำหรับ Staff Role |
| **Service Role ถูก Trigger บล็อก** | `protect_profile_fields_trigger` ไม่เช็ค service_role | เพิ่ม `current_user = 'service_role'` bypass |
| **ลบ User ไม่ได้** | FK Constraints จากหลายตาราง | ใช้ `ON DELETE SET NULL` + Anonymize Logs |
| **User ยกเลิกจองตัวเองไม่ได้** | RLS UPDATE Policy กว้างเกิน | สร้าง Cancellation Policy แยก |
| **สถานะอุปกรณ์ไม่อัปเดต** | ไม่มี Trigger sync status | สร้าง `sync_equipment_status_on_loan()` trigger |
| **Notification Trigger พัง** | เปลี่ยนชื่อ Column แต่ไม่อัปเดต Trigger | ★ ทุกครั้งที่แก้ Column → ต้องตรวจสอบ Triggers ด้วย |

### 🔄 Patterns ที่พัฒนาขึ้นจากประสบการณ์:
1. **เริ่ม Hardcode → ย้ายเป็น DB-driven** — เช่น หมวดหมู่อุปกรณ์ เริ่มจาก `lib/data/` → ย้ายเป็น `equipment_types` table
2. **สร้างฟีเจอร์ → ลบฟีเจอร์ที่ไม่ใช้** — QR Code และ Support Chat ถูกสร้างแล้วลบออก เพราะไม่มีคนใช้
3. **Client Component → Server Component** — Staff Dashboard แปลงหลัง Profiling แล้วเร็วขึ้น 73%
4. **Migration 70+ ไฟล์ → Consolidate เป็น 4 ไฟล์** — V5 Baseline ทำให้ Onboard ง่ายขึ้น

### 📋 ลำดับการพัฒนาที่แนะนำ (Development Phases):
1. **Phase 1:** Database Schema + Auth (Google OAuth) + `get_my_role()` + RLS พื้นฐาน + Profile Flow
2. **Phase 2:** ฟีเจอร์หลัก (CRUD) + Role-based Routes + Layouts
3. **Phase 3:** Workflow (Approval, Status Transitions, Triggers)
4. **Phase 4:** Notifications (Discord + In-App) + Activity Logs
5. **Phase 5:** Analytics, Reports, Charts, Export CSV
6. **Phase 6:** Advanced Features (Special Loans, Cart, Evaluation, Overdue)
7. **Phase 7:** Performance (RSC conversion, Query optimization, Bundle reduction)
8. **Phase 8:** User Guides, Documentation, Cleanup (ลบฟีเจอร์ที่ไม่ใช้)
