# 测试数据创建指南

## 问题说明

由于 `public.users` 表的 `id` 字段是外键，引用了 `auth.users(id)`，我们不能直接在数据库中插入用户数据。用户必须通过 **Supabase Auth** 创建（即通过前端注册）。

## 📝 创建测试数据步骤

### 第一步：注册教师账号

1. 打开前端注册页面：http://localhost:5173/register
2. 注册一个教师账号，例如：
   - 邮箱：teacher1@gmail.com（使用真实邮箱域名）
   - 密码：Test123456
   - 姓名：张老师
   - 身份：教师

3. 注册成功后，记下这个邮箱

### 第二步：注册学生账号

注册多个学生账号用于测试，例如：

**7年级1班：**
- student701@gmail.com - 王小明
- student702@gmail.com - 李小红
- student703@gmail.com - 张小刚

**7年级2班：**
- student721@gmail.com - 孙小龙
- student722@gmail.com - 郑小燕

（建议至少注册3-5个学生账号）

### 第三步：执行作业数据脚本

1. 打开 Supabase Dashboard → SQL Editor

2. 执行 `docs/insert-test-assignments.sql`
   - 这个脚本会自动查找已注册的教师
   - 为7年级的班级创建10个测试作业

3. 如果提示"未找到教师账号"：
   - 确认已经注册了教师账号
   - 或者修改脚本中的邮箱查询条件

## 🎯 完整测试流程

### 1. 教师端测试流程

```
1. 登录教师账号
2. 查看班级管理页面 (/teacher/classes)
   - 应该能看到7年级1-3班
3. 创建作业 (/teacher/assignments)
   - 或使用 SQL 脚本创建的测试作业
4. 等待学生提交
5. 查看学生提交 (/teacher/assignments/{id}/submissions)
6. 点击"AI批改"按钮（需要配置 API Key）
7. 审核批改结果
8. 发布给学生
```

### 2. 学生端测试流程

```
1. 登录学生账号
2. 选择班级 (/student/select-class)
3. 查看作业列表 (/student/tasks)
4. 点击"开始写作"
5. 提交作文 (/student/submit/{id})
   - 可以输入文本
   - 或上传图片OCR
6. 等待AI批改
7. 查看批改报告 (/student/history)
8. 与AI对话学习 (/student/ai-chat)
9. 查看错题本 (/student/mistakes)
```

## 🔧 手动创建完整的测试提交

如果想要测试批改功能，可以手动创建提交记录：

```sql
-- 1. 找到学生ID和作业ID
SELECT u.id as student_id, u.name as student_name
FROM public.users u
WHERE u.role = 'student'
LIMIT 1;

SELECT a.id as assignment_id, a.title
FROM public.assignments a
LIMIT 1;

-- 2. 创建提交记录（替换下面的 ID）
INSERT INTO public.submissions (
    assignment_id,
    student_id,
    content,
    word_count,
    status,
    submitted_at,
    created_at
) VALUES (
    'YOUR_ASSIGNMENT_ID',  -- 替换为实际的作业ID
    'YOUR_STUDENT_ID',     -- 替换为实际的学生ID
    '今年暑假，我过得特别充实和快乐。爸爸妈妈工作很忙，但还是抽出时间陪我度过了一个难忘的假期。

假期开始，我们全家去了云南旅游。在丽江，我看到了美丽的玉龙雪山，山顶白雪皑皑，半山腰云雾缭绕，就像仙境一样。我们还参观了古城，那里的街道都是青石板铺成的，两旁是古色古香的建筑。

在大理，我们环洱海骑行。清澈的湖水倒映着蓝天白云，微风吹来，带着淡淡的花香。妈妈说这就是"风花雪月"的大理。

除了旅游，我还参加了游泳培训班。刚开始我很紧张，看着深深的游泳池就害怕。但教练很耐心，一步步教我换气、漂浮、蹬腿。经过一个月的训练，我终于学会了蛙泳和自由泳。

暑假作业我也认真完成了。每天上午我都会做2小时的作业，还读了《骆驼祥子》《朝花夕拾》等名著。这个暑假真是太精彩了！',
    650,
    'submitted',
    NOW(),
    NOW()
) RETURNING id;

-- 3. 然后可以在前端点击"AI批改"按钮进行批改
```

## ⚙️ AI 功能配置

在 `backend/.env` 中配置：

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# AI 功能（阿里云通义千问）
DASHSCOPE_API_KEY=your_dashscope_api_key
```

获取 DashScope API Key：
1. 访问：https://dashscope.aliyun.com/
2. 注册/登录阿里云账号
3. 开通通义千问服务
4. 获取 API Key

## 📊 测试建议

### 最小测试集
- 1个教师账号
- 3个学生账号（不同班级）
- 5个作业任务（使用脚本创建）
- 2-3个学生提交

### 完整测试集
- 2-3个教师账号
- 10-15个学生账号（覆盖多个班级）
- 10个作业任务
- 5-8个学生提交
- 包含各种状态：草稿、已提交、已批改、已发布

## 🐛 常见问题

### Q1: 为什么不能直接在数据库插入用户？
A: 因为 `public.users.id` 是外键，引用 `auth.users.id`。Supabase Auth 管理认证，必须通过 API 创建用户。

### Q2: 如何快速创建多个学生账号？
A: 可以使用邮箱别名功能，例如：
- yourname+student1@gmail.com
- yourname+student2@gmail.com
这些都会发送到 yourname@gmail.com

### Q3: 邮箱确认怎么办？
A:
- 如果配置了邮件服务，查收邮件点击确认
- 或者在 Supabase Dashboard → Authentication → Users 中手动确认

### Q4: 测试时如何跳过邮箱确认？
A: 在 Supabase Dashboard → Authentication → Settings → Email Auth 中禁用 "Confirm email"

## 📝 快速测试清单

- [ ] 注册教师账号
- [ ] 注册3个学生账号
- [ ] 学生选择班级
- [ ] 执行作业创建脚本
- [ ] 配置 AI API Key
- [ ] 学生提交作文
- [ ] 点击 AI 批改
- [ ] 教师审核结果
- [ ] 教师发布报告
- [ ] 学生查看报告
- [ ] 测试 AI 对话
- [ ] 查看错题本

## 🎓 推荐测试顺序

1. **基础功能测试**：注册、登录、选择班级
2. **教师功能测试**：创建作业、查看班级
3. **学生功能测试**：查看任务、提交作文
4. **AI 功能测试**：自动批改、AI对话
5. **完整流程测试**：从创建到发布的完整流程
