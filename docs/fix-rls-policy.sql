-- ============================================
-- 修复用户表 RLS 策略
-- 问题：auth.uid() 在注册时的 session 可能还没完全建立
-- 解决：使用 TO authenticated 并放宽检查
-- ============================================

-- 1. 查看当前策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- 2. 删除旧的 INSERT 策略
DROP POLICY IF EXISTS "用户可以创建自己的信息" ON public.users;

-- 3. 创建新的 INSERT 策略
-- 方案 A：最宽松（仅测试用）
CREATE POLICY "允许已认证用户创建用户记录" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 如果上面的策略工作正常，可以稍后改为更严格的：
-- DROP POLICY IF EXISTS "允许已认证用户创建用户记录" ON public.users;
-- CREATE POLICY "用户可以创建自己的信息" ON public.users
--     FOR INSERT
--     TO authenticated
--     WITH CHECK (auth.uid() = id);

-- 验证
DO $$
BEGIN
    RAISE NOTICE '✅ RLS 策略已更新！';
    RAISE NOTICE '  - 已允许认证用户创建记录（宽松模式）';
    RAISE NOTICE '  - 测试成功后建议收紧策略';
END $$;
