-- ============================================
-- 修复类型不匹配问题
-- ============================================

-- 1. 删除可能有问题的旧策略
DROP POLICY IF EXISTS "允许用户删除自己的图片" ON storage.objects;
DROP POLICY IF EXISTS "允许用户更新自己的信息" ON public.users;
DROP POLICY IF EXISTS "用户可以更新自己的信息" ON public.users;

-- 2. 检查并修复 users 表的 id 字段类型
-- 如果 users.id 是 text 类型，需要确保与 auth.users.id (uuid) 匹配
DO $$
BEGIN
    -- 检查 users.id 的类型
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'id'
          AND data_type = 'text'
    ) THEN
        RAISE NOTICE '⚠️  users.id 是 text 类型，应该是 uuid 类型';
        RAISE NOTICE '请确认 users 表的 id 字段应该引用 auth.users(id)';
    END IF;
END $$;

-- 3. 重新创建 RLS 策略（使用正确的类型转换）

-- users 表策略
DROP POLICY IF EXISTS "允许用户查看所有用户信息" ON public.users;
DROP POLICY IF EXISTS "允许已认证用户创建用户记录" ON public.users;
DROP POLICY IF EXISTS "允许用户删除自己的账号" ON public.users;

CREATE POLICY "允许用户查看所有用户信息" ON public.users
    FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "允许已认证用户创建用户记录" ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 使用 ::text 进行显式类型转换
CREATE POLICY "允许用户更新自己的信息" ON public.users
    FOR UPDATE
    TO authenticated
    USING (id::text = auth.uid()::text)
    WITH CHECK (id::text = auth.uid()::text);

CREATE POLICY "允许用户删除自己的账号" ON public.users
    FOR DELETE
    TO authenticated
    USING (id::text = auth.uid()::text);

-- assignments 表策略
DROP POLICY IF EXISTS "允许教师查看自己创建的作业" ON public.assignments;
CREATE POLICY "允许教师查看自己创建的作业" ON public.assignments
    FOR SELECT
    TO authenticated
    USING (
        teacher_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'student'
            AND users.class_id::text = assignments.class_id::text
        )
    );

DROP POLICY IF EXISTS "允许教师创建作业" ON public.assignments;
CREATE POLICY "允许教师创建作业" ON public.assignments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'teacher'
        )
    );

DROP POLICY IF EXISTS "允许教师更新自己的作业" ON public.assignments;
CREATE POLICY "允许教师更新自己的作业" ON public.assignments
    FOR UPDATE
    TO authenticated
    USING (teacher_id::text = auth.uid()::text)
    WITH CHECK (teacher_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "允许教师删除自己的作业" ON public.assignments;
CREATE POLICY "允许教师删除自己的作业" ON public.assignments
    FOR DELETE
    TO authenticated
    USING (teacher_id::text = auth.uid()::text);

-- submissions 表策略
DROP POLICY IF EXISTS "允许学生查看自己的提交" ON public.submissions;
CREATE POLICY "允许学生查看自己的提交" ON public.submissions
    FOR SELECT
    TO authenticated
    USING (
        student_id::text = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.assignments
            WHERE assignments.id::text = submissions.assignment_id::text
            AND assignments.teacher_id::text = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "允许学生创建自己的提交" ON public.submissions;
CREATE POLICY "允许学生创建自己的提交" ON public.submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id::text = auth.uid()::text
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id::text = auth.uid()::text
            AND users.role = 'student'
        )
    );

DROP POLICY IF EXISTS "允许学生更新自己的提交" ON public.submissions;
CREATE POLICY "允许学生更新自己的提交" ON public.submissions
    FOR UPDATE
    TO authenticated
    USING (student_id::text = auth.uid()::text)
    WITH CHECK (student_id::text = auth.uid()::text);

-- Storage 策略（如果 owner 是 text 类型）
CREATE POLICY "允许用户删除自己的图片" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'essays' AND owner::text = auth.uid()::text);

-- 4. 显示修复结果
SELECT '✅ RLS 策略已更新，使用显式类型转换' as status;
