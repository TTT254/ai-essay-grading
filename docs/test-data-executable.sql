-- ==========================================
-- AI作文批改系统 - 测试数据（可直接执行版本）
-- 创建日期: 2026-01-12
-- 说明：此文件可以在 Supabase SQL Editor 中直接执行
-- ==========================================

-- ==========================================
-- 第一步：创建测试班级（可直接执行）
-- ==========================================

-- 清理旧数据（可选，首次执行请注释掉）
-- DELETE FROM public.classes WHERE grade IN (7, 8, 9);

-- 插入5个测试班级
INSERT INTO public.classes (id, grade, name, student_count, created_at) VALUES
('c1111111-1111-1111-1111-111111111111', 7, '7年级1班', 0, NOW()),
('c2222222-2222-2222-2222-222222222222', 7, '7年级2班', 0, NOW()),
('c3333333-3333-3333-3333-333333333333', 8, '8年级1班', 0, NOW()),
('c4444444-4444-4444-4444-444444444444', 8, '8年级2班', 0, NOW()),
('c5555555-5555-5555-5555-555555555555', 9, '9年级1班', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 验证插入结果
SELECT id, grade, name, teacher_id, student_count, created_at
FROM public.classes
WHERE grade IN (7, 8, 9)
ORDER BY grade, name;

-- ==========================================
-- 📋 下一步操作指南
-- ==========================================

-- ✅ 班级数据已创建成功！

-- 📌 接下来请通过前端页面注册以下测试账号：

-- 【教师账号】
--   邮箱: teacher1@test.com
--   密码: Test123456
--   姓名: 张老师
--   角色: 教师

-- 【学生账号 1】
--   邮箱: student1@test.com
--   密码: Test123456
--   姓名: 王小明
--   角色: 学生
--   班级: 7年级1班

-- 【学生账号 2】
--   邮箱: student2@test.com
--   密码: Test123456
--   姓名: 李小红
--   角色: 学生
--   班级: 7年级1班

-- 【学生账号 3】
--   邮箱: student3@test.com
--   密码: Test123456
--   姓名: 张小华
--   角色: 学生
--   班级: 7年级2班

-- ==========================================
-- 🔍 注册后的数据验证
-- ==========================================

-- 注册完成后，可以运行以下SQL查询验证：

-- 1. 查看所有测试用户
-- SELECT id, email, full_name, role, class_id, created_at
-- FROM public.users
-- WHERE email LIKE '%@test.com'
-- ORDER BY role, email;

-- 2. 查看班级及其学生数量
-- SELECT
--   c.id,
--   c.grade,
--   c.name,
--   COUNT(u.id) as actual_student_count,
--   c.student_count as recorded_count
-- FROM public.classes c
-- LEFT JOIN public.users u ON u.class_id = c.id AND u.role = 'student'
-- WHERE c.grade IN (7, 8, 9)
-- GROUP BY c.id, c.grade, c.name, c.student_count
-- ORDER BY c.grade, c.name;

-- 3. 查看教师ID（用于关联班级）
-- SELECT id as teacher_id, email, full_name
-- FROM public.users
-- WHERE role = 'teacher' AND email LIKE '%@test.com';

-- ==========================================
-- 🔧 注册后需要手动执行的SQL（可选）
-- ==========================================

-- 如果需要将班级关联到教师，注册教师后执行：
-- 1. 先查询教师ID：
--    SELECT id FROM public.users WHERE email = 'teacher1@test.com';
-- 2. 将得到的UUID替换下面的 '<teacher_id_here>'，然后执行：

/*
UPDATE public.classes
SET teacher_id = '<teacher_id_here>'
WHERE id IN (
  'c1111111-1111-1111-1111-111111111111',
  'c2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333'
);
*/

-- ==========================================
-- 💡 完整测试流程建议
-- ==========================================

-- 步骤1：执行上面的班级插入SQL ✅（已完成）
-- 步骤2：访问 http://localhost:5173/register 注册教师账号
-- 步骤3：访问 http://localhost:5173/register 注册学生账号（选择对应班级）
-- 步骤4：登录教师账号，创建作业：
--         标题: 我的家乡
--         要求: 写一篇关于家乡的作文，字数600-800字
--         班级: 7年级1班
--         截止时间: 7天后
-- 步骤5：登录学生账号，查看并提交作业
-- 步骤6：测试AI批改功能
-- 步骤7：测试AI对话辅导功能

-- ==========================================
-- ✨ 完成！
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '===============================================';
    RAISE NOTICE '✅ 测试班级数据创建成功！';
    RAISE NOTICE '📝 请访问前端页面注册测试账号';
    RAISE NOTICE '🌐 前端地址: http://localhost:5173';
    RAISE NOTICE '===============================================';
END $$;
