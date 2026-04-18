-- ============================================
-- AI作文批改系统 - Supabase数据库初始化SQL
-- 创建日期: 2026-01-11
-- 说明: 在Supabase SQL Editor中执行此脚本
-- ============================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户扩展表 (users)
-- 说明: 扩展Supabase Auth的用户信息
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    class_id UUID,  -- 外键在班级表创建后添加
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_class ON public.users(class_id);

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

-- ============================================
-- 2. 班级表 (classes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,  -- 如"一年级1班"
    grade INT NOT NULL CHECK (grade >= 1 AND grade <= 12),  -- 年级：1-12
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,  -- 班主任
    student_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade ON public.classes(grade);

-- 现在添加users表的外键约束
ALTER TABLE public.users
ADD CONSTRAINT fk_users_class
FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

-- ============================================
-- 3. 作文任务表 (assignments)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,  -- 作文题目
    description TEXT,  -- 作文要求
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    word_count_min INT DEFAULT 0,  -- 最少字数
    word_count_max INT,  -- 最多字数
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON public.assignments(deadline);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);

-- ============================================
-- 4. 作文提交表 (submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,  -- 作文正文
    word_count INT DEFAULT 0,
    image_url TEXT,  -- 手写作文图片（如有）
    ocr_result TEXT,  -- OCR 识别结果
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded', 'published')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    UNIQUE(assignment_id, student_id)  -- 一个学生一个任务只能提交一次
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- 触发器：自动更新updated_at
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 批改报告表 (grading_reports)
-- ============================================
CREATE TABLE IF NOT EXISTS public.grading_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,

    -- AI 批改结果
    ai_total_score DECIMAL(5,2),  -- AI 总分
    ai_scores JSONB,  -- AI 分项得分
    ai_errors JSONB,  -- AI 识别的错误列表
    ai_comment TEXT,  -- AI 综合评语

    -- 教师批改结果
    teacher_total_score DECIMAL(5,2),  -- 教师最终总分
    teacher_scores JSONB,  -- 教师分项得分
    teacher_comment TEXT,  -- 教师评语

    -- 最终发布的结果（以教师为准，如果教师未修改则用 AI）
    final_total_score DECIMAL(5,2),
    final_scores JSONB,
    final_comment TEXT,

    graded_at TIMESTAMP WITH TIME ZONE,  -- AI 批改时间
    reviewed_at TIMESTAMP WITH TIME ZONE,  -- 教师审核时间
    published_at TIMESTAMP WITH TIME ZONE,  -- 发布时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_grading_submission ON public.grading_reports(submission_id);

-- ============================================
-- 6. 错题本表 (mistake_records)
-- 亮点功能：自动收集学生常见错误
-- ============================================
CREATE TABLE IF NOT EXISTS public.mistake_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mistake_type VARCHAR(50) NOT NULL,  -- 错误类型：typo/grammar/logic/structure
    mistake_content TEXT,  -- 错误内容
    correct_content TEXT,  -- 正确内容
    frequency INT DEFAULT 1,  -- 出现频次
    last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_mistakes_student ON public.mistake_records(student_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_type ON public.mistake_records(mistake_type);
CREATE INDEX IF NOT EXISTS idx_mistakes_frequency ON public.mistake_records(frequency DESC);

-- ============================================
-- 7. AI对话记录表 (ai_conversations)
-- 亮点功能：学生与AI对话辅导
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,  -- 关联的作文（可选）
    messages JSONB NOT NULL,  -- 对话消息列表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_conversations_student ON public.ai_conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_submission ON public.ai_conversations(submission_id);

-- 触发器：自动更新updated_at
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- 用户表策略：用户只能查看和更新自己的信息
CREATE POLICY "用户可以查看自己的信息" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户可以更新自己的信息" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 提交表策略：学生只能查看自己的提交
CREATE POLICY "学生可以查看自己的提交" ON public.submissions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "学生可以创建提交" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "学生可以更新自己的草稿" ON public.submissions
    FOR UPDATE USING (auth.uid() = student_id AND status = 'draft');

-- 教师可以查看本班级的提交
CREATE POLICY "教师可以查看本班级提交" ON public.submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.classes c ON a.class_id = c.id
            WHERE a.id = submissions.assignment_id
            AND c.teacher_id = auth.uid()
        )
    );

-- 批改报告策略：学生可以查看已发布的报告
CREATE POLICY "学生可以查看已发布的批改报告" ON public.grading_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.id = grading_reports.submission_id
            AND s.student_id = auth.uid()
            AND grading_reports.published_at IS NOT NULL
        )
    );

-- 错题本策略：学生只能查看自己的错题
CREATE POLICY "学生可以查看自己的错题" ON public.mistake_records
    FOR SELECT USING (auth.uid() = student_id);

-- AI对话策略：学生只能查看自己的对话
CREATE POLICY "学生可以查看自己的对话" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "学生可以创建对话" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "学生可以更新自己的对话" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = student_id);

-- ============================================
-- 初始化数据（可选）
-- ============================================

-- 插入测试班级
INSERT INTO public.classes (name, grade, student_count) VALUES
    ('一年级1班', 1, 0),
    ('一年级2班', 1, 0),
    ('二年级1班', 2, 0),
    ('二年级2班', 2, 0),
    ('三年级1班', 3, 0),
    ('三年级2班', 3, 0)
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ 数据库初始化完成！';
    RAISE NOTICE '已创建以下表：';
    RAISE NOTICE '  - users (用户扩展表)';
    RAISE NOTICE '  - classes (班级表)';
    RAISE NOTICE '  - assignments (作文任务表)';
    RAISE NOTICE '  - submissions (作文提交表)';
    RAISE NOTICE '  - grading_reports (批改报告表)';
    RAISE NOTICE '  - mistake_records (错题本表)';
    RAISE NOTICE '  - ai_conversations (AI对话表)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS策略已配置！';
    RAISE NOTICE '✅ 测试数据已插入！';
END $$;
