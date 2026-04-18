-- ==========================================
-- 邮箱确认功能数据库迁移脚本
-- 创建日期: 2026-01-12
-- 说明: 在 Supabase SQL Editor 中执行此脚本
-- ==========================================

-- ==========================================
-- 第一步：添加邮箱确认字段
-- ==========================================

-- 为 public.users 表添加邮箱确认时间字段
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_users_email_confirmed
ON public.users(email_confirmed_at);

-- 添加字段注释
COMMENT ON COLUMN public.users.email_confirmed_at IS '邮箱确认时间，NULL 表示未确认';

-- ==========================================
-- 第二步：创建同步触发器函数
-- ==========================================

-- 创建触发器函数：从 auth.users 同步确认状态到 public.users
CREATE OR REPLACE FUNCTION sync_email_confirmed_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 当 auth.users 的 email_confirmed_at 更新时，同步到 public.users
  UPDATE public.users
  SET email_confirmed_at = NEW.email_confirmed_at
  WHERE id = NEW.id;

  RAISE NOTICE '✅ 已同步用户 % 的邮箱确认状态', NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加函数注释
COMMENT ON FUNCTION sync_email_confirmed_status() IS '自动同步 auth.users 的邮箱确认状态到 public.users 表';

-- ==========================================
-- 第三步：创建触发器
-- ==========================================

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- 创建新触发器
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION sync_email_confirmed_status();

-- 添加触发器注释
COMMENT ON TRIGGER on_auth_user_email_confirmed ON auth.users IS '监听 auth.users 的邮箱确认状态变化并同步到 public.users';

-- ==========================================
-- 第四步：同步现有用户数据
-- ==========================================

-- 将现有 auth.users 中已确认的邮箱状态同步到 public.users
UPDATE public.users u
SET email_confirmed_at = au.email_confirmed_at
FROM auth.users au
WHERE u.id = au.id
  AND u.email_confirmed_at IS NULL
  AND au.email_confirmed_at IS NOT NULL;

-- ==========================================
-- 验证和统计
-- ==========================================

-- 统计邮箱确认状态
DO $$
DECLARE
  total_users INT;
  confirmed_users INT;
  unconfirmed_users INT;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO confirmed_users FROM public.users WHERE email_confirmed_at IS NOT NULL;
  SELECT COUNT(*) INTO unconfirmed_users FROM public.users WHERE email_confirmed_at IS NULL;

  RAISE NOTICE '==========================================';
  RAISE NOTICE '邮箱确认功能迁移完成！';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '总用户数: %', total_users;
  RAISE NOTICE '已确认: %', confirmed_users;
  RAISE NOTICE '未确认: %', unconfirmed_users;
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ 已添加 email_confirmed_at 字段';
  RAISE NOTICE '✅ 已创建索引';
  RAISE NOTICE '✅ 已创建同步触发器';
  RAISE NOTICE '✅ 已同步现有用户数据';
  RAISE NOTICE '==========================================';
END $$;

-- ==========================================
-- 查询示例（用于验证）
-- ==========================================

-- 查看最近注册的用户及其确认状态
-- SELECT
--   id,
--   email,
--   name,
--   role,
--   email_confirmed_at,
--   CASE
--     WHEN email_confirmed_at IS NOT NULL THEN '已确认'
--     ELSE '未确认'
--   END as status,
--   created_at
-- FROM public.users
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 对比 auth.users 和 public.users 的确认状态
-- SELECT
--   u.email,
--   u.name,
--   u.email_confirmed_at as public_confirmed_at,
--   au.email_confirmed_at as auth_confirmed_at,
--   CASE
--     WHEN u.email_confirmed_at = au.email_confirmed_at THEN '✅ 一致'
--     WHEN u.email_confirmed_at IS NULL AND au.email_confirmed_at IS NULL THEN '✅ 一致（都未确认）'
--     ELSE '❌ 不一致'
--   END as sync_status
-- FROM public.users u
-- JOIN auth.users au ON u.id = au.id
-- ORDER BY u.created_at DESC
-- LIMIT 10;
