-- ==========================================
-- AI作文批改系统 - 登录测试数据
-- 创建日期: 2026-01-12
-- 说明：快速创建测试账号的SQL脚本
-- ==========================================

-- ==========================================
-- 方式一：通过 Supabase Auth Admin API 创建测试账号
-- ==========================================
-- 注意：此脚本需要在 Supabase Dashboard → SQL Editor 中执行
-- 或者通过前端注册页面创建账号（推荐）

-- ==========================================
-- 第一步：创建测试班级（如果尚未创建）
-- ==========================================

INSERT INTO public.classes (id, grade, name, student_count, created_at) VALUES
('c1111111-1111-1111-1111-111111111111', 7, '7年级1班', 0, NOW()),
('c2222222-2222-2222-2222-222222222222', 7, '7年级2班', 0, NOW()),
('c3333333-3333-3333-3333-333333333333', 8, '8年级1班', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 第二步：创建测试用户（需要先在 Supabase Auth 中创建）
-- ==========================================

-- ⚠️ 重要说明：
-- public.users 表的 id 必须引用 auth.users(id)
-- 因此必须先在 auth.users 中创建用户
--
-- 推荐方式：使用前端注册页面 http://localhost:5173/register

-- ==========================================
-- 📋 测试账号信息（请通过前端注册这些账号）
-- ==========================================

/*
【教师账号 1】
邮箱: teacher1@test.com
密码: Test123456
姓名: 张老师
角色: teacher

【教师账号 2】
邮箱: teacher2@test.com
密码: Test123456
姓名: 李老师
角色: teacher

【学生账号 1】
邮箱: student1@test.com
密码: Test123456
姓名: 王小明
角色: student
班级: 7年级1班

【学生账号 2】
邮箱: student2@test.com
密码: Test123456
姓名: 李小红
角色: student
班级: 7年级1班

【学生账号 3】
邮箱: student3@test.com
密码: Test123456
姓名: 张小华
角色: student
班级: 7年级2班

【学生账号 4】
邮箱: student4@test.com
密码: Test123456
姓名: 赵小龙
角色: student
班级: 8年级1班

【学生账号 5】
邮箱: student5@test.com
密码: Test123456
姓名: 周小芳
角色: student
班级: 8年级1班
*/

-- ==========================================
-- 方式二：如果您已经通过前端注册了账号，可以验证数据
-- ==========================================

-- 查看所有测试用户
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    c.name as class_name,
    u.created_at
FROM public.users u
LEFT JOIN public.classes c ON u.class_id = c.id
WHERE u.email LIKE '%@test.com'
ORDER BY u.role DESC, u.email;

-- 查看认证用户（auth schema需要特殊权限）
-- SELECT id, email, email_confirmed_at, created_at
-- FROM auth.users
-- WHERE email LIKE '%@test.com'
-- ORDER BY email;

-- ==========================================
-- 方式三：如果有 service_role 权限，可以通过 SQL 创建
-- ==========================================

-- 警告：以下方式需要 service_role 权限，仅供管理员使用
-- 在生产环境中不推荐使用此方式

/*
-- 创建教师账号示例（需要 service_role 权限）
-- 注意：密码需要使用 crypt() 函数加密
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    'u1111111-1111-1111-1111-111111111111',
    'teacher1@test.com',
    crypt('Test123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"张老师","role":"teacher"}',
    false,
    'authenticated'
);

-- 然后在 public.users 中创建对应记录
INSERT INTO public.users (id, email, full_name, role, created_at) VALUES
('u1111111-1111-1111-1111-111111111111', 'teacher1@test.com', '张老师', 'teacher', NOW());
*/

-- ==========================================
-- ✨ 推荐的测试流程
-- ==========================================

-- 步骤1：执行上面的班级插入SQL（创建测试班级）
-- 步骤2：启动前端项目：cd frontend && npm run dev
-- 步骤3：访问 http://localhost:5173/register
-- 步骤4：依次注册上面列出的测试账号
-- 步骤5：登录教师账号，创建测试作业
-- 步骤6：登录学生账号，提交作业
-- 步骤7：测试AI批改功能

-- ==========================================
-- 🔍 验证脚本
-- ==========================================

-- 注册完成后，运行此查询验证：
DO $$
DECLARE
    teacher_count INT;
    student_count INT;
    class_count INT;
BEGIN
    SELECT COUNT(*) INTO teacher_count FROM public.users WHERE role = 'teacher' AND email LIKE '%@test.com';
    SELECT COUNT(*) INTO student_count FROM public.users WHERE role = 'student' AND email LIKE '%@test.com';
    SELECT COUNT(*) INTO class_count FROM public.classes WHERE grade IN (7, 8, 9);

    RAISE NOTICE '===============================================';
    RAISE NOTICE '测试数据统计：';
    RAISE NOTICE '  教师账号: % 个', teacher_count;
    RAISE NOTICE '  学生账号: % 个', student_count;
    RAISE NOTICE '  测试班级: % 个', class_count;
    RAISE NOTICE '===============================================';

    IF teacher_count = 0 AND student_count = 0 THEN
        RAISE NOTICE '⚠️  尚未创建测试账号';
        RAISE NOTICE '📝 请访问 http://localhost:5173/register 注册测试账号';
    ELSE
        RAISE NOTICE '✅ 测试账号已创建';
        RAISE NOTICE '🔐 可以使用以下账号登录测试：';
        RAISE NOTICE '   - teacher1@test.com / Test123456';
        RAISE NOTICE '   - student1@test.com / Test123456';
    END IF;
END $$;

-- ==========================================
-- 快速登录测试
-- ==========================================

-- 测试账号快速参考表：
--
-- | 邮箱                   | 密码        | 角色   | 姓名   | 班级       |
-- |------------------------|-------------|--------|--------|------------|
-- | teacher1@test.com      | Test123456  | 教师   | 张老师 | -          |
-- | teacher2@test.com      | Test123456  | 教师   | 李老师 | -          |
-- | student1@test.com      | Test123456  | 学生   | 王小明 | 7年级1班   |
-- | student2@test.com      | Test123456  | 学生   | 李小红 | 7年级1班   |
-- | student3@test.com      | Test123456  | 学生   | 张小华 | 7年级2班   |
-- | student4@test.com      | Test123456  | 学生   | 赵小龙 | 8年级1班   |
-- | student5@test.com      | Test123456  | 学生   | 周小芳 | 8年级1班   |
