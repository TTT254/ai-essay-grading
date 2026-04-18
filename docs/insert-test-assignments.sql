-- ============================================
-- AI作文批改系统 - 测试数据（不含用户）
-- 说明：用户必须通过前端注册创建，因为 users.id 引用 auth.users(id)
-- ============================================

-- ============================================
-- 1. 确保班级数据存在（已在之前的脚本中创建）
-- ============================================

-- 查看现有班级
SELECT id, grade, name, student_count
FROM public.classes
WHERE grade = 7
ORDER BY grade, name;

-- ============================================
-- 2. 为已注册的教师创建测试作业
-- 使用说明：
-- 1. 先通过前端注册一个教师账号
-- 2. 在下面的脚本中替换 'YOUR_TEACHER_EMAIL' 为实际的教师邮箱
-- 3. 然后执行此脚本
-- ============================================

DO $$
DECLARE
    teacher_id UUID;
    class_7_1_id UUID;
    class_7_2_id UUID;
    class_7_3_id UUID;
BEGIN
    -- !!! 重要：在这里替换为你实际注册的教师邮箱 !!!
    -- 例如：SELECT id INTO teacher_id FROM public.users WHERE email = '1806874707@qq.com' AND role = 'teacher';

    -- 查询教师ID（如果已注册）
    SELECT id INTO teacher_id FROM public.users WHERE role = 'teacher' LIMIT 1;

    IF teacher_id IS NULL THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '⚠️  未找到教师账号！';
        RAISE NOTICE '请先通过前端注册一个教师账号，然后再执行此脚本。';
        RAISE NOTICE '========================================';
        RETURN;
    END IF;

    -- 获取班级ID
    SELECT id INTO class_7_1_id FROM public.classes WHERE grade = 7 AND name = '1班' LIMIT 1;
    SELECT id INTO class_7_2_id FROM public.classes WHERE grade = 7 AND name = '2班' LIMIT 1;
    SELECT id INTO class_7_3_id FROM public.classes WHERE grade = 7 AND name = '3班' LIMIT 1;

    -- 删除旧的测试作业（可选）
    DELETE FROM public.assignments WHERE assignments.teacher_id = teacher_id;

    -- 为7年级1班创建作业
    INSERT INTO public.assignments (title, description, teacher_id, class_id, deadline, word_count_min, word_count_max, status, created_at) VALUES
        ('我的暑假生活', '请以"我的暑假生活"为题，描述你在暑假期间的所见所闻，要求语言生动，条理清晰。', teacher_id, class_7_1_id, NOW() + INTERVAL '7 days', 600, 800, 'active', NOW() - INTERVAL '5 days'),
        ('难忘的一件事', '请写一篇记叙文，叙述一件让你印象深刻的事情，注意运用细节描写。', teacher_id, class_7_1_id, NOW() + INTERVAL '5 days', 500, 700, 'active', NOW() - INTERVAL '3 days'),
        ('我最敬佩的人', '写一篇人物描写作文，刻画一个你最敬佩的人，突出人物的性格特点。', teacher_id, class_7_1_id, NOW() + INTERVAL '3 days', 600, 800, 'active', NOW() - INTERVAL '2 days'),
        ('秋天的景色', '观察秋天的自然景色，写一篇写景作文，注意景物描写的顺序和层次。', teacher_id, class_7_1_id, NOW() - INTERVAL '1 day', 500, 700, 'closed', NOW() - INTERVAL '8 days'),
        ('读《西游记》有感', '阅读《西游记》后，写一篇读后感，谈谈你的感悟和体会。', teacher_id, class_7_1_id, NOW() + INTERVAL '10 days', 600, 800, 'active', NOW() - INTERVAL '1 day');

    -- 为7年级2班创建作业
    INSERT INTO public.assignments (title, description, teacher_id, class_id, deadline, word_count_min, word_count_max, status, created_at) VALUES
        ('我的家乡', '介绍你的家乡，包括风景、特产、风俗等，表达对家乡的热爱之情。', teacher_id, class_7_2_id, NOW() + INTERVAL '6 days', 600, 800, 'active', NOW() - INTERVAL '4 days'),
        ('一次有趣的实验', '记录一次科学实验的过程和结果，注意记叙的完整性。', teacher_id, class_7_2_id, NOW() + INTERVAL '4 days', 500, 700, 'active', NOW() - INTERVAL '3 days'),
        ('我的梦想', '写一篇议论文或记叙文，谈谈你的梦想以及如何实现它。', teacher_id, class_7_2_id, NOW() + INTERVAL '8 days', 600, 800, 'active', NOW() - INTERVAL '2 days');

    -- 为7年级3班创建作业
    INSERT INTO public.assignments (title, description, teacher_id, class_id, deadline, word_count_min, word_count_max, status, created_at) VALUES
        ('校园一角', '选择校园中的一个角落进行描写，注意细节刻画和情感表达。', teacher_id, class_7_3_id, NOW() + INTERVAL '5 days', 500, 700, 'active', NOW() - INTERVAL '4 days'),
        ('成长的烦恼', '写一篇关于成长中遇到的烦恼的作文，可以是学习、人际关系等方面。', teacher_id, class_7_3_id, NOW() + INTERVAL '7 days', 600, 800, 'active', NOW() - INTERVAL '2 days');

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 测试作业创建完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '教师ID: %', teacher_id;
    RAISE NOTICE '作业数量: 10';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 查看创建结果
-- ============================================

SELECT
    a.title AS 作业标题,
    c.grade AS 年级,
    c.name AS 班级,
    a.deadline AS 截止时间,
    a.status AS 状态,
    a.created_at AS 创建时间
FROM public.assignments a
JOIN public.classes c ON a.class_id = c.id
ORDER BY c.grade, c.name, a.created_at DESC;
