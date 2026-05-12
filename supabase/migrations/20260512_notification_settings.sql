-- Migration: 20260512_notification_settings.sql
-- เพิ่ม column notification_settings เพื่อให้ Admin ตั้งค่าการแจ้งเตือนอัตโนมัติได้

ALTER TABLE system_config
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "loan_approved": {
    "discord": true,
    "welpru": true,
    "welpru_title": "คำขอยืมอุปกรณ์ได้รับการอนุมัติ",
    "welpru_body": "คำขอยืมอุปกรณ์ {equipment} ของคุณได้รับการอนุมัติแล้ว กรุณาติดต่อรับอุปกรณ์ตามเวลาที่กำหนด"
  },
  "loan_rejected": {
    "discord": true,
    "welpru": true,
    "welpru_title": "คำขอยืมอุปกรณ์ถูกปฏิเสธ",
    "welpru_body": "คำขอยืมอุปกรณ์ {equipment} ของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อเจ้าหน้าที่สำหรับข้อมูลเพิ่มเติม"
  },
  "loan_returned": {
    "discord": true,
    "welpru": true,
    "welpru_title": "คืนอุปกรณ์เสร็จสิ้น",
    "welpru_body": "บันทึกการรับคืนอุปกรณ์ {equipment} เรียบร้อยแล้ว ขอบคุณที่ใช้บริการ"
  },
  "reservation_approved": {
    "discord": true,
    "welpru": true,
    "welpru_title": "การจองได้รับการอนุมัติ",
    "welpru_body": "การจองอุปกรณ์ {equipment} ของคุณได้รับการอนุมัติแล้ว"
  },
  "reservation_rejected": {
    "discord": true,
    "welpru": true,
    "welpru_title": "การจองถูกปฏิเสธ",
    "welpru_body": "การจองอุปกรณ์ {equipment} ของคุณถูกปฏิเสธ {reason}"
  },
  "reservation_ready": {
    "discord": true,
    "welpru": true,
    "welpru_title": "อุปกรณ์พร้อมรับ",
    "welpru_body": "อุปกรณ์ {equipment} ที่คุณจองพร้อมรับแล้ว กรุณาติดต่อรับภายในเวลาที่กำหนด"
  },
  "reservation_converted": {
    "discord": true,
    "welpru": true,
    "welpru_title": "การจองถูกแปลงเป็นการยืม",
    "welpru_body": "การจองอุปกรณ์ {equipment} ของคุณถูกแปลงเป็นการยืมเรียบร้อยแล้ว"
  },
  "new_registration": { "discord": true },
  "new_loan_request": { "discord": true },
  "new_reservation_request": { "discord": true },
  "special_loan_created": { "discord": true },
  "special_loan_completed": { "discord": true },
  "special_loan_cancelled": { "discord": true }
}'::jsonb;

COMMENT ON COLUMN system_config.notification_settings IS 'Admin-configurable auto-notification toggles and WeLPRU message templates per event';
