-- ============================================
-- 修复用户表 RLS 策略
-- 添加 INSERT 策略（允许用户创建自己的记录）
-- ============================================

-- 先删除旧策略（如果存在）
DROP POLICY IF EXISTS "用户可以创建自己的信息" ON public.users;

-- 重新创建用户表的 INSERT 策略
CREATE POLICY "用户可以创建自己的信息" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 验证修改
DO $$
BEGIN
    RAISE NOTICE '✅ 用户表修复完成！';
    RAISE NOTICE '  - 已添加 INSERT 策略';
END $$;
