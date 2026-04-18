-- ============================================
-- AI作文批改系统 - 完整测试数据
-- ============================================

-- 清理旧数据（可选，谨慎使用）
-- DELETE FROM public.ai_conversations;
-- DELETE FROM public.mistake_records;
-- DELETE FROM public.grading_reports;
-- DELETE FROM public.submissions;
-- DELETE FROM public.assignments;
-- DELETE FROM public.users WHERE email LIKE '%test%';

-- ============================================
-- 1. 创建测试用户（10个教师 + 30个学生）
-- ============================================

-- 插入教师账号
INSERT INTO public.users (id, email, name, role, created_at) VALUES
    (gen_random_uuid(), 'teacher1@test.com', '张老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher2@test.com', '李老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher3@test.com', '王老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher4@test.com', '刘老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher5@test.com', '陈老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher6@test.com', '杨老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher7@test.com', '赵老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher8@test.com', '黄老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher9@test.com', '周老师', 'teacher', NOW()),
    (gen_random_uuid(), 'teacher10@test.com', '吴老师', 'teacher', NOW())
ON CONFLICT (email) DO NOTHING;

-- 获取班级ID（7年级1-3班）
DO $$
DECLARE
    class_7_1_id UUID;
    class_7_2_id UUID;
    class_7_3_id UUID;
BEGIN
    -- 获取班级ID
    SELECT id INTO class_7_1_id FROM public.classes WHERE grade = 7 AND name = '1班' LIMIT 1;
    SELECT id INTO class_7_2_id FROM public.classes WHERE grade = 7 AND name = '2班' LIMIT 1;
    SELECT id INTO class_7_3_id FROM public.classes WHERE grade = 7 AND name = '3班' LIMIT 1;

    -- 插入学生（7年级1班 - 10人）
    INSERT INTO public.users (id, email, name, role, class_id, created_at) VALUES
        (gen_random_uuid(), 'student701@test.com', '王小明', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student702@test.com', '李小红', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student703@test.com', '张小刚', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student704@test.com', '刘小芳', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student705@test.com', '陈小军', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student706@test.com', '杨小梅', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student707@test.com', '赵小强', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student708@test.com', '黄小丽', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student709@test.com', '周小华', 'student', class_7_1_id, NOW()),
        (gen_random_uuid(), 'student710@test.com', '吴小英', 'student', class_7_1_id, NOW())
    ON CONFLICT (email) DO NOTHING;

    -- 插入学生（7年级2班 - 10人）
    INSERT INTO public.users (id, email, name, role, class_id, created_at) VALUES
        (gen_random_uuid(), 'student721@test.com', '孙小龙', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student722@test.com', '郑小燕', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student723@test.com', '林小杰', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student724@test.com', '何小兰', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student725@test.com', '罗小峰', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student726@test.com', '梁小慧', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student727@test.com', '宋小涛', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student728@test.com', '唐小娟', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student729@test.com', '韩小宇', 'student', class_7_2_id, NOW()),
        (gen_random_uuid(), 'student730@test.com', '冯小霞', 'student', class_7_2_id, NOW())
    ON CONFLICT (email) DO NOTHING;

    -- 插入学生（7年级3班 - 10人）
    INSERT INTO public.users (id, email, name, role, class_id, created_at) VALUES
        (gen_random_uuid(), 'student731@test.com', '曹小波', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student732@test.com', '袁小婷', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student733@test.com', '邓小辉', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student734@test.com', '许小静', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student735@test.com', '傅小鹏', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student736@test.com', '沈小玲', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student737@test.com', '彭小雷', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student738@test.com', '吕小倩', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student739@test.com', '苏小东', 'student', class_7_3_id, NOW()),
        (gen_random_uuid(), 'student740@test.com', '卢小云', 'student', class_7_3_id, NOW())
    ON CONFLICT (email) DO NOTHING;

    -- 更新班级学生人数
    UPDATE public.classes SET student_count = 10 WHERE id = class_7_1_id;
    UPDATE public.classes SET student_count = 10 WHERE id = class_7_2_id;
    UPDATE public.classes SET student_count = 10 WHERE id = class_7_3_id;
END $$;

-- ============================================
-- 2. 创建作业任务（每个班级5个作业）
-- ============================================

DO $$
DECLARE
    teacher_id UUID;
    class_7_1_id UUID;
    class_7_2_id UUID;
    class_7_3_id UUID;
    assignment_id UUID;
BEGIN
    -- 获取第一个教师ID
    SELECT id INTO teacher_id FROM public.users WHERE role = 'teacher' AND email = 'teacher1@test.com' LIMIT 1;

    -- 获取班级ID
    SELECT id INTO class_7_1_id FROM public.classes WHERE grade = 7 AND name = '1班' LIMIT 1;
    SELECT id INTO class_7_2_id FROM public.classes WHERE grade = 7 AND name = '2班' LIMIT 1;
    SELECT id INTO class_7_3_id FROM public.classes WHERE grade = 7 AND name = '3班' LIMIT 1;

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

END $$;

-- ============================================
-- 3. 创建学生提交记录（部分学生完成了作业）
-- ============================================

DO $$
DECLARE
    assignment_id UUID;
    student_id UUID;
    submission_id UUID;
BEGIN
    -- 获取第一个作业ID（我的暑假生活）
    SELECT id INTO assignment_id FROM public.assignments WHERE title = '我的暑假生活' LIMIT 1;

    -- 学生1提交
    SELECT id INTO student_id FROM public.users WHERE email = 'student701@test.com' LIMIT 1;
    INSERT INTO public.submissions (assignment_id, student_id, content, word_count, status, submitted_at, created_at)
    VALUES (
        assignment_id,
        student_id,
        '我的暑假生活真是丰富多彩。七月初，爸爸妈妈带我去了海南三亚旅游。那里的大海真美啊！碧蓝的海水一望无际，海浪轻轻拍打着沙滩，发出"哗哗"的声音。我和爸爸一起在海边堆沙堡，还捡了好多漂亮的贝壳。妈妈说，这些贝壳是大海的礼物。

八月份，我参加了学校组织的夏令营活动。在夏令营里，我认识了很多新朋友，我们一起爬山、野炊、做游戏。最让我难忘的是晚上的篝火晚会，大家围着火堆唱歌跳舞，星空下，我们的笑声飘得好远好远。

暑假里，我还学会了游泳。刚开始的时候，我很害怕，总是呛水。但是在教练的耐心指导下，我慢慢掌握了技巧。当我第一次独立游完25米时，心里别提有多高兴了！那种成功的感觉真是太美妙了。

除了玩乐，我也没有忘记学习。每天上午我都会做暑假作业，还读了好几本课外书。《骆驼祥子》让我认识到旧社会劳动人民的不易，《海底两万里》带我畅游了神奇的海底世界。这些书让我的暑假更加充实。

这个暑假真是太精彩了！我不仅玩得开心，还学到了很多东西，认识了新朋友。新学期，我一定要更加努力学习，不辜负这个美好的暑假！',
        750,
        'submitted',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ) RETURNING id INTO submission_id;

    -- 创建批改报告
    INSERT INTO public.grading_reports (
        submission_id,
        ai_total_score,
        ai_scores,
        ai_errors,
        ai_comment,
        final_total_score,
        final_scores,
        final_comment,
        graded_at,
        published_at
    ) VALUES (
        submission_id,
        85.5,
        '{"content": 25, "structure": 22, "language": 20, "innovation": 18.5}'::jsonb,
        '[
            {"type": "typo", "original": "妈妈说，这些贝壳是大海的礼物", "correct": "妈妈说："这些贝壳是大海的礼物。"", "position": "第一段", "description": "对话应使用冒号和引号"},
            {"type": "punctuation", "original": "心里别提有多高兴了", "correct": "心里别提有多高兴了！", "position": "第三段", "description": "感叹句应使用感叹号"}
        ]'::jsonb,
        '这是一篇优秀的记叙文。文章结构清晰，按照时间顺序叙述了暑假的主要活动，层次分明。语言生动活泼，运用了比喻、拟声等修辞手法，如"哗哗"的海浪声，让读者仿佛身临其境。文章不仅记录了游玩的快乐，还写到了学习和成长，体现了作者是一个全面发展的好学生。建议：在描写游泳学习过程时，可以再详细一些，把心理变化写得更细腻。标点符号使用有两处小瑕疵，需要注意。',
        85.5,
        '{"content": 25, "structure": 22, "language": 20, "innovation": 18.5}'::jsonb,
        '这是一篇优秀的记叙文。文章结构清晰，按照时间顺序叙述了暑假的主要活动，层次分明。语言生动活泼，运用了比喻、拟声等修辞手法，如"哗哗"的海浪声，让读者仿佛身临其境。',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day'
    );

    -- 为该学生创建错题记录
    INSERT INTO public.mistake_records (student_id, mistake_type, mistake_content, correct_content, frequency, last_occurred_at)
    VALUES
        (student_id, 'punctuation', '对话未使用冒号和引号', '对话应使用冒号和引号', 1, NOW() - INTERVAL '1 day'),
        (student_id, 'punctuation', '感叹句未使用感叹号', '感叹句应使用感叹号', 1, NOW() - INTERVAL '1 day');

    -- 学生2提交（草稿状态）
    SELECT id INTO student_id FROM public.users WHERE email = 'student702@test.com' LIMIT 1;
    INSERT INTO public.submissions (assignment_id, student_id, content, word_count, status, created_at)
    VALUES (
        assignment_id,
        student_id,
        '暑假我去了很多地方玩。先去了北京，看了天安门广场，还爬了长城。长城真的很长，爬到一半我就累得不行了...',
        150,
        'draft',
        NOW() - INTERVAL '1 day'
    );

    -- 学生3提交（已提交）
    SELECT id INTO student_id FROM public.users WHERE email = 'student703@test.com' LIMIT 1;
    INSERT INTO public.submissions (assignment_id, student_id, content, word_count, status, submitted_at, created_at)
    VALUES (
        assignment_id,
        student_id,
        '今年暑假，我过得特别充实和快乐。爸爸妈妈工作很忙，但还是抽出时间陪我度过了一个难忘的假期。

假期开始，我们全家去了云南旅游。在丽江，我看到了美丽的玉龙雪山，山顶白雪皑皑，半山腰云雾缭绕，就像仙境一样。我们还参观了古城，那里的街道都是青石板铺成的，两旁是古色古香的建筑。晚上，古城灯火通明，各种民族特色的小店铺热闹非凡。

在大理，我们环洱海骑行。清澈的湖水倒映着蓝天白云，微风吹来，带着淡淡的花香。妈妈说这就是"风花雪月"的大理。我们还品尝了当地的美食，白族的三道茶真是别有风味。

除了旅游，我还参加了游泳培训班。刚开始我很紧张，看着深深的游泳池就害怕。但教练很耐心，一步步教我换气、漂浮、蹬腿。经过一个月的训练，我终于学会了蛙泳和自由泳。现在我已经可以在深水区自由游泳了，那种感觉太棒了！

暑假作业我也认真完成了。每天上午我都会做2小时的作业，还读了《骆驼祥子》《朝花夕拾》等名著。这些书让我了解了不同时代的生活，也懂得了很多道理。

这个暑假，我不仅开阔了眼界，锻炼了身体，还充实了知识。我真希望时间能过得慢一点，让这美好的暑假再长一些！',
        690,
        'submitted',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    );

END $$;

-- ============================================
-- 4. 统计信息
-- ============================================

DO $$
DECLARE
    teacher_count INT;
    student_count INT;
    class_count INT;
    assignment_count INT;
    submission_count INT;
    report_count INT;
BEGIN
    SELECT COUNT(*) INTO teacher_count FROM public.users WHERE role = 'teacher';
    SELECT COUNT(*) INTO student_count FROM public.users WHERE role = 'student';
    SELECT COUNT(*) INTO class_count FROM public.classes;
    SELECT COUNT(*) INTO assignment_count FROM public.assignments;
    SELECT COUNT(*) INTO submission_count FROM public.submissions;
    SELECT COUNT(*) INTO report_count FROM public.grading_reports;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 测试数据插入完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '教师账号数: %', teacher_count;
    RAISE NOTICE '学生账号数: %', student_count;
    RAISE NOTICE '班级数: %', class_count;
    RAISE NOTICE '作业任务数: %', assignment_count;
    RAISE NOTICE '学生提交数: %', submission_count;
    RAISE NOTICE '批改报告数: %', report_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '测试账号信息：';
    RAISE NOTICE '教师账号: teacher1@test.com ~ teacher10@test.com (密码需通过前端注册)';
    RAISE NOTICE '学生账号: student701@test.com ~ student740@test.com (密码需通过前端注册)';
    RAISE NOTICE '========================================';
END $$;
