-- ============================================
-- Support Auto-Reply Configuration
-- Created: 2026-02-23
-- Purpose: Add auto-reply settings for support chat
-- ============================================

-- Add auto-reply columns to system_config
ALTER TABLE public.system_config
ADD COLUMN IF NOT EXISTS support_auto_reply_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS support_auto_reply_message TEXT DEFAULT 'สวัสดีครับ🙏 ฝากข้อความไว้ เจ้าหน้าที่จะตอบกลับโดยเร็วที่สุด...';
