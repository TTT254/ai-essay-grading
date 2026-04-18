-- ============================================
-- AI作文批改系统 - 数据库初始化+测试数据
-- Combined script: creates schema + seeds data
-- ============================================

-- ============================================
-- Step 1: 创建UUID扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Step 2: 创建表结构
-- ============================================

-- users (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    class_id UUID,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 自动更新updated_at触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_class ON public.users(class_id);

-- classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    grade INT NOT NULL CHECK (grade >= 1 AND grade <= 12),
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    student_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade ON public.classes(grade);

ALTER TABLE public.users
ADD CONSTRAINT fk_users_class
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

-- assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    word_count_min INT DEFAULT 0,
    word_count_max INT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON public.assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);

-- submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    word_count INT DEFAULT 0,
    image_url TEXT,
    ocr_result TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'published')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- grading_reports
CREATE TABLE IF NOT EXISTS public.grading_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,
    ai_total_score DECIMAL(5,2),
    ai_scores JSONB,
    ai_errors JSONB,
    ai_comment TEXT,
    teacher_total_score DECIMAL(5,2),
    teacher_scores JSONB,
    teacher_comment TEXT,
    final_total_score DECIMAL(5,2),
    final_scores JSONB,
    final_comment TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_grading_submission ON public.grading_reports(submission_id);

-- mistake_records
CREATE TABLE IF NOT EXISTS public.mistake_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mistake_type VARCHAR(50) NOT NULL,
    mistake_content TEXT,
    correct_content TEXT,
    frequency INT DEFAULT 1,
    last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_mistakes_student ON public.mistake_records(student_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_type ON public.mistake_records(mistake_type);
CREATE INDEX IF NOT EXISTS idx_mistakes_frequency ON public.mistake_records(frequency DESC);

-- ai_conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    messages JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_conversations_student ON public.ai_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_submission ON public.ai_conversations(submission_id);

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 3: RLS策略
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Allow all operations with service role (backend uses service key)
-- These policies let service role bypass RLS
CREATE POLICY "service_role_all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_classes" ON public.classes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_assignments" ON public.assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_submissions" ON public.submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_reports" ON public.grading_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_mistakes" ON public.mistake_records FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_conversations" ON public.ai_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- Step 4: 插入测试数据
-- ============================================

-- 4.1 插入教师用户 (使用固定UUID避免auth.users依赖)
-- 先禁用外键约束以便插入
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS "users_id_fkey";

INSERT INTO public.users (id, email, full_name, role, class_id, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'teacher@example.com', '李老师', 'teacher', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 重新添加外键（忽略失败如果已存在）
DO $$
BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4.2 插入班级
INSERT INTO public.classes (id, name, grade, teacher_id, student_count, created_at)
VALUES
    ('00000000-0000-0000-0001-000000000001', '三年级一班', 3, '00000000-0000-0000-0000-000000000001', 3, NOW()),
    ('00000000-0000-0000-0001-000000000002', '三年级二班', 3, '00000000-0000-0000-0000-000000000001', 2, NOW()),
    ('00000000-0000-0000-0001-000000000003', '五年级一班', 5, '00000000-0000-0000-0000-000000000001', 4, NOW())
ON CONFLICT (id) DO NOTHING;

-- 4.3 插入学生用户
INSERT INTO public.users (id, email, full_name, role, class_id, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0002-000000000001', 'student1@example.com', '王小明', 'student', '00000000-0000-0000-0001-000000000001', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000002', 'student2@example.com', '李小红', 'student', '00000000-0000-0000-0001-000000000001', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000003', 'student3@example.com', '张大力', 'student', '00000000-0000-0000-0001-000000000001', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000004', 'student4@example.com', '陈思思', 'student', '00000000-0000-0000-0001-000000000002', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000005', 'student5@example.com', '刘洋洋', 'student', '00000000-0000-0000-0001-000000000002', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000006', 'student6@example.com', '赵欣欣', 'student', '00000000-0000-0000-0001-000000000003', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000007', 'student7@example.com', '孙浩宇', 'student', '00000000-0000-0000-0001-000000000003', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000008', 'student8@example.com', '周诗琪', 'student', '00000000-0000-0000-0001-000000000003', NOW(), NOW()),
    ('00000000-0000-0000-0002-000000000009', 'student9@example.com', '吴天明', 'student', '00000000-0000-0000-0001-000000000003', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4.4 插入作文任务
INSERT INTO public.assignments (id, title, description, teacher_id, class_id, deadline, word_count_min, word_count_max, status, created_at)
VALUES
    ('00000000-0000-0000-0003-000000000001', '记一件有意义的事',
     '请同学们选择一个让你印象深刻的事件，写一篇记叙文。要注意事情的起因、经过和结果，语句通顺，条理清晰。字数要求300-500字。',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001',
     NOW() + INTERVAL '7 days', 300, 500, 'active', NOW() - INTERVAL '3 days'),

    ('00000000-0000-0000-0003-000000000002', '可爱的动物',
     '请选择一种你最喜欢的动物，写一篇描写动物的文章。要抓住动物的外形、习性或有趣的行为来写，字数要求200-400字。',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001',
     NOW() - INTERVAL '2 days', 200, 400, 'active', NOW() - INTERVAL '10 days'),

    ('00000000-0000-0000-0003-000000000003', '春天的校园',
     '观察春天的校园，写一篇描写校园景色的作文。注意观察花草树木的变化，以及校园里春天的气息，字数要求250-450字。',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002',
     NOW() + INTERVAL '5 days', 250, 450, 'active', NOW() - INTERVAL '5 days'),

    ('00000000-0000-0000-0003-000000000004', '二十年后的我',
     '发挥想象，写一篇关于二十年后的自己的作文。想想那时候你在做什么，生活会是什么样子？字数要求400-600字。',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003',
     NOW() - INTERVAL '1 day', 400, 600, 'active', NOW() - INTERVAL '14 days'),

    ('00000000-0000-0000-0003-000000000005', '我最喜欢的一本书',
     '向大家推荐一本你最喜欢的书，写一篇读书推荐。要写出书名、作者、主要内容，以及你为什么喜欢这本书，字数要求350-550字。',
     '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000003',
     NOW() + INTERVAL '10 days', 350, 550, 'active', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 4.5 插入作文提交
INSERT INTO public.submissions (id, assignment_id, student_id, content, word_count, status, submitted_at)
VALUES
    ('00000000-0000-0000-0004-000000000001',
     '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001',
     E'在这个假期里，我做了一件特别有意义的事——帮邻居王奶奶过马路。\n\n那天早上，我去超市买牛奶。走到十字路口时，我看见一位满头白发的老奶奶站在路边，脸上露出焦急的神情。她手里提着一篮子菜，似乎想要过马路，但是路上车来车往，她迟迟不敢迈步。\n\n我看了看红绿灯，现在是绿灯。但是时间好像不太够了。我想都没想，赶紧跑过去，扶住了王奶奶的胳膊。我说："奶奶，我扶您过马路吧！"王奶奶笑眯眯地看着我，说："谢谢你，好孩子！"\n\n于是，我小心翼翼地搀扶着王奶奶，一步一步地往前走。路过的汽车司机看见了，都停下车来等我们先过。终于，我们顺利地走到了马路对面。王奶奶感激地拉着我的手说："你真是个助人为乐的好孩子！"\n\n那一刻，我的心里比吃了蜜还甜。原来，帮助别人是一件这么快乐的事情。我暗暗下定决心，以后要多多帮助身边有需要的人，让这个世界变得更加美好。',
     380, 'graded', NOW() - INTERVAL '5 days'),

    ('00000000-0000-0000-0004-000000000002',
     '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000001',
     E'我最喜欢的小动物是小狗。\n\n我家养了一只可爱的小狗，名叫"豆豆"。它的毛是金黄色的，摸起来软绵绵的，像一团棉花糖。豆豆的耳朵垂垂的，总是耷拉在脑袋两边。一双圆溜溜的大眼睛，像两颗黑宝石一样闪闪发光。\n\n豆豆非常聪明，也非常贪吃。每次我放学回家，它总是第一个跑出来迎接我，摇着尾巴围着我转圈，好像在说："小主人，你终于回来啦！"这时候，我就会拿出狗粮，它就会乖乖地坐在地上，用期待的眼神看着我。\n\n豆豆最喜欢的游戏是捡球。我把球扔出去，它就会飞快地跑过去，用嘴巴把球叼回来，然后骄傲地放在我面前，好像在说："你看，我厉害吧！"\n\n这就是我家的豆豆，一只可爱、聪明又贪吃的小狗。它是我最好的朋友，给我带来了很多快乐。',
     320, 'graded', NOW() - INTERVAL '12 days'),

    ('00000000-0000-0000-0004-000000000003',
     '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000002',
     E'去年暑假，我做了一件让我至今难忘的事情——和爸爸一起种向日葵。\n\n那天阳光明媚，爸爸从院子里挖来一些泥土，装进花盆里。我帮爸爸运水，给花盆浇水。爸爸把向日葵种子小心翼翼地埋在土里，再盖上一层薄薄的土。\n\n我每天都会去看望它，给它浇水、施肥。过了几天，我惊喜地发现，泥土里钻出了一个小小的绿芽！我高兴得跳了起来，大声喊道："发芽啦！发芽啦！"\n\n随着日子一天天过去，向日葵越长越高，茎秆变得粗壮有力，叶子也越来越多。终于有一天早上，我去浇水的时候，发现向日葵开花了！金黄色的花瓣围着棕色的花盘，像一个小太阳，在阳光下闪闪发光。\n\n看着自己亲手种出的向日葵，我明白了：只要用心付出，就一定会有收获。这件事让我非常开心，也让我学会了耐心和坚持。',
     410, 'graded', NOW() - INTERVAL '4 days'),

    ('00000000-0000-0000-0004-000000000004',
     '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000003',
     E'我家养了一只小乌龟，我给它取名叫"慢慢"。因为它走路总是慢吞吞的，特别可爱。\n\n慢慢有一身深绿色的壳，壳上有漂亮的花纹，像一件坚硬的小铠甲。它的头是椭圆形的，上面有一双小小的眼睛，尖尖的嘴巴总是一张一合。四条小腿短短的，爪子却很锋利。\n\n慢慢最喜欢晒太阳了。每当我把它放在阳台上，它就会找个有阳光的地方，然后把头和四肢都伸出来，懒洋洋地趴在那里，一动不动地享受阳光的温暖。\n\n慢慢吃东西的样子也很有趣。我把龟粮放进水里，它会先用小眼睛盯着食物看一会儿，然后突然伸长脖子，"啊呜"一口把龟粮吞进嘴里。\n\n别看慢慢平时慢吞吞的，在水里游泳的时候可灵活了，四条腿像四只小桨一样划来划去，游得可快啦！\n\n我喜欢我家的小乌龟慢慢，它是我生活中的好伙伴。',
     350, 'submitted', NOW() - INTERVAL '1 day'),

    ('00000000-0000-0000-0004-000000000005',
     '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000004',
     E'春天来了，我们的校园变得格外美丽。\n\n走进校门，首先映入眼帘的是花坛里的迎春花。金黄色的小花竞相开放，像一颗颗小星星缀满枝头，在春风中频频点头，好像在对我们说："春天来啦！"\n\n操场边上的柳树也抽出了嫩绿的新芽，细长的柳枝像春姑娘的长发随风飘舞。柳树下的小草从泥土里探出了尖尖的小脑袋，嫩绿嫩绿的，给大地铺上了一层绿色的地毯。\n\n校园里的玉兰花也开放了，白色的花瓣有的已经完全展开，像一只只白蝴蝶停在枝头；有的还是花骨朵，看起来饱胀得马上要破裂似的，美丽极了。\n\n最热闹的要数花坛边了。同学们脱下了厚厚的冬装，换上了轻盈的春装，在校园里追逐嬉戏。朗朗的读书声从教室里传出，和小鸟的歌声交织在一起，汇成了一首春天的交响曲。\n\n春天的校园真美啊！我爱春天的校园！',
     380, 'graded', NOW() - INTERVAL '6 days'),

    ('00000000-0000-0000-0004-000000000006',
     '00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000005',
     E'二十年后的我，应该已经三十二岁了。那时候的我，会是什么样子呢？\n\n我想，那时候的我一定成为了一名救死扶伤的医生。每天穿着白色的工作服，在医院里忙碌着，为病人解除痛苦。虽然工作很辛苦，但是看到病人康复出院时的笑容，我觉得一切付出都是值得的。\n\n每天早上，我会穿着整洁的西装，开着我喜欢的电动汽车去上班。医院里有很多先进的医疗设备，比如可以三维打印人造器官的机器，还有能够远程诊断的智能系统。工作之余，我会和同事们一起讨论病例，研究更先进的治疗方法。\n\n下了班，我会回到温馨的家中。家里有一个小小的花园，种满了各种各样的花草。我喜欢在花园里给花儿浇水、施肥，享受片刻的宁静。晚饭后，我会和家人一起散步，聊聊天，分享一天中的趣事。\n\n周末的时候，我会带着家人去旅游，看看祖国的大好河山。或者约上几个老同学，一起聚会，回忆美好的学生时代。\n\n为了实现这个梦想，从现在开始，我要好好学习，锻炼身体，为实现二十年后的目标打下坚实的基础。我相信，只要努力，梦想一定会成真！',
     520, 'graded', NOW() - INTERVAL '15 days'),

    ('00000000-0000-0000-0004-000000000007',
     '00000000-0000-0000-0003-000000000004', '00000000-0000-0000-0002-000000000006',
     E'时光飞逝，转眼间二十年过去了。那时候的我，成为了一名光荣的人民教师。\n\n每天清晨，我会站在讲台上，为学生们传授知识。看着那一双双求知若渴的眼睛，我感到无比自豪。我的学生有的成为了科学家，有的成为了医生，有的成为了工程师……每当收到他们的来信或邮件，我都会感到无比幸福。\n\n二十年后，教室里已经没有了黑板，取而代之的是智能大屏幕。老师可以用全息投影展示各种知识，让学生们身临其境地学习。作业也不再是厚厚的试卷，而是一个个有趣的项目学习。\n\n我和我的学生们建立了深厚的师生情谊。他们毕业后，有的成为了我的同事，有的在各个领域取得了杰出的成就。虽然我们已经不在同一间教室了，但我们依然保持着联系，一起怀念那段美好的时光。\n\n现在，我要从身边的小事做起。上课认真听讲，课后主动帮助同学。我相信，只要从小事做起，一步一个脚印，二十年后，我一定能实现当老师的梦想！',
     480, 'submitted', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 4.6 插入批改报告
INSERT INTO public.grading_reports (id, submission_id, ai_total_score, ai_scores, ai_errors, ai_comment, graded_at)
VALUES
    ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0004-000000000001',
     88,
     '{"思想内容": 32, "结构安排": 22, "语言表达": 24, "文字书写": 10}',
     '[{"type": "选材立意", "description": "选材贴近生活，能表达积极向上的主题，立意明确。", "suggestion": "可以更深入地挖掘事件的情感价值。"}, {"type": "语句通顺", "description": "整体语句通顺，叙事清晰。", "suggestion": ""}, {"type": "错别字", "position": "第3段", "description": "小心写成了一心的", "original": "一心的", "correction": "小心翼翼"}]',
     '这篇作文总体质量较好，小作者通过描述扶老奶奶过马路这件小事，表达了助人为乐的主题，叙事完整，条理清晰。语言朴实真挚，能够让人感受到那份纯真的善意。如果在细节描写上再下一些功夫，比如描写老奶奶的表情变化、周围环境的渲染，会让文章更加生动。另外注意不要写错别字。继续保持写作热情！',
     NOW() - INTERVAL '4 days'),

    ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0004-000000000002',
     91,
     '{"思想内容": 33, "结构安排": 23, "语言表达": 25, "文字书写": 10}',
     '[{"type": "外形描写", "description": "对豆豆的外形描写生动具体，从毛色、耳朵、眼睛等方面全面刻画。", "suggestion": ""}, {"type": "事例选择", "description": "选择了迎接主人和捡球两个典型事例，有详有略。", "suggestion": ""}, {"type": "情感表达", "description": "结尾直接表达了对小狗的喜爱之情。", "suggestion": ""}]',
     '这是一篇非常优秀的小动物描写文章！小作者从外形和习性两个方面描写了小狗豆豆，条理清晰，内容丰富。用了像棉花糖、像两颗黑宝石等生动的比喻，让描写更加形象。选取的两个事例都很典型，体现了人与动物之间的感情。建议在今后的写作中，可以尝试加入一些和小狗之间的有趣故事，会让文章更加精彩！',
     NOW() - INTERVAL '11 days'),

    ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0004-000000000003',
     85,
     '{"思想内容": 31, "结构安排": 21, "语言表达": 23, "文字书写": 10}',
     '[{"type": "观察描写", "description": "观察比较仔细，写出了向日葵从小芽到开花的生长过程。", "suggestion": ""}, {"type": "感悟表达", "description": "结尾的感悟自然，有一定的思想深度。", "suggestion": ""}, {"type": "修辞手法", "description": "比喻和拟人的运用不够丰富。", "suggestion": "可以多运用比喻、拟人等修辞手法来丰富语言。"}]',
     '这篇观察日记写得很好！小作者真实记录了种向日葵的过程，从播种到发芽再到开花，描写细致，能让读者感受到种植的乐趣和收获的喜悦。结尾的感悟自然恰当。稍微欠缺的是修辞手法的运用，文章整体以叙述为主，如果能适当加入比喻、拟人等手法，文章会更加优美。继续加油！',
     NOW() - INTERVAL '5 days'),

    ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0004-000000000005',
     93,
     '{"思想内容": 34, "结构安排": 23, "语言表达": 26, "文字书写": 10}',
     '[{"type": "结构布局", "description": "按游览顺序描写，条理清楚。", "suggestion": ""}, {"type": "选景角度", "description": "选取了校园中最有代表性的春天景色来写。", "suggestion": ""}, {"type": "语言优美", "description": "多处运用比喻和拟人，如像春姑娘的长发、汇成一首交响曲。", "suggestion": ""}]',
     '太棒了！这是一篇非常优秀的写景作文！小作者按照游览顺序，选取了校园里最具春天特色的四个场景：迎春花、柳树、玉兰花和热闹的同学们。每个场景都有独特的描写，比喻和拟人运用得恰到好处，语言优美流畅，读起来让人仿佛身临其境。结尾直抒胸臆，表达了对校园的喜爱之情。继续保持这种写作热情，多观察、多积累，一定能写出更多好文章！',
     NOW() - INTERVAL '5 days'),

    ('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0004-000000000006',
     87,
     '{"思想内容": 30, "结构安排": 22, "语言表达": 25, "文字书写": 10}',
     '[{"type": "想象合理", "description": "想象立足现实，合情合理。", "suggestion": ""}, {"type": "细节丰富", "description": "对未来的生活描写很细致具体，有画面感。", "suggestion": ""}, {"type": "首尾呼应", "description": "结尾回到现在，呼应开头，结构完整。", "suggestion": ""}]',
     '这篇想象作文写得很有条理！小作者从职业、生活、家庭、社交四个方面想象了二十年后的自己，层次清晰，内容丰富。电动汽车、全息投影、智能系统等科技元素的加入，让想象既大胆又合理。语言表达流畅自然，感情真挚。稍微可以改进的是：可以把某个场景描写得更详细一些。继续保持写作热情！',
     NOW() - INTERVAL '14 days')
ON CONFLICT (id) DO NOTHING;

-- 4.7 插入错题记录
INSERT INTO public.mistake_records (id, student_id, mistake_type, mistake_content, correct_content, frequency, last_occurred_at, created_at)
VALUES
    ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000001',
     '错别字', '一心的', '小心翼翼', 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

    ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000002',
     '语法错误', '我和爸爸一起种向日葵。', '夏天，我和爸爸一起种向日葵。', 1, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

    ('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0002-000000000003',
     '标点符号', '大声喊道 加油 加油', '"大声喊道：\\"加油！加油！\\""', 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

    ('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0002-000000000005',
     '语句不通', '吃完晚饭后我帮妈妈洗碗，虽然洗得不够干净，但妈妈夸我懂事', '吃完晚饭后，我帮妈妈洗碗，虽然洗得不够干净，但妈妈夸我是个懂事的孩子', 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- 4.8 插入AI对话记录 (messages字段是JSONB数组)
INSERT INTO public.ai_conversations (id, student_id, submission_id, messages, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0004-000000000001',
     '[{"role": "user", "content": "批改报告中说我有一个错别字，一心的应该怎么写？"}, {"role": "assistant", "content": "同学你好！一心的应该是小心翼翼。小心的意思是留神、谨慎，翼翼的意思是严肃认真。小心翼翼形容非常谨慎，一点也不敢疏忽。这个成语出自《诗经》。在句子中应该写成：我小心翼翼地搀扶着王奶奶。你可以把这个错别字记在你的错题本里，下次写作就不会再出错了。加油！"}]',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

    ('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0004-000000000003',
     '[{"role": "user", "content": "批改说我写春天的作文比喻不够多，能给我举一些描写春天的比喻句吗？"}, {"role": "assistant", "content": "同学你好！很高兴你想让文章更生动！以下是一些描写春天的比喻句：1. 春天的雨像牛毛，像花针，像细丝。2. 春天像一位害羞的小姑娘。3. 柳树的嫩芽像碧绿的翡翠。4. 小草像给大地铺上了一层绿色的地毯。5. 花儿绽开了笑脸，像一个个小太阳。试着在自己的作文中用上1-2个比喻，你会发现文章立刻变得生动起来了！"}]',
     NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 5: 验证
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'users: %', (SELECT count(*) FROM public.users);
    RAISE NOTICE 'classes: %', (SELECT count(*) FROM public.classes);
    RAISE NOTICE 'assignments: %', (SELECT count(*) FROM public.assignments);
    RAISE NOTICE 'submissions: %', (SELECT count(*) FROM public.submissions);
    RAISE NOTICE 'grading_reports: %', (SELECT count(*) FROM public.grading_reports);
    RAISE NOTICE 'mistake_records: %', (SELECT count(*) FROM public.mistake_records);
    RAISE NOTICE 'ai_conversations: %', (SELECT count(*) FROM public.ai_conversations);
END $$;
