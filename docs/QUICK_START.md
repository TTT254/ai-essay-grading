# 快速开始指南

## 📦 项目已创建完成！

恭喜！项目骨架已经成功创建。以下是完整的设置和启动步骤。

---

## ✅ 已完成的工作

### 1. 项目结构
```
ai-essay-grading/
├── frontend/          # React前端（Vite + TypeScript）
├── backend/           # FastAPI后端
├── docs/              # 文档和SQL脚本
├── README.md
└── .gitignore
```

### 2. 前端配置
- ✅ React 18 + TypeScript
- ✅ Vite 构建工具
- ✅ 依赖包：Ant Design、Zustand、Axios、ECharts、React Quill
- ✅ 环境变量模板（`.env.example`）

### 3. 后端配置
- ✅ FastAPI 框架
- ✅ 配置管理（Pydantic Settings）
- ✅ 阿里云百炼API封装（含AI批改、OCR识别）
- ✅ 环境变量模板
- ✅ 依赖清单（`requirements.txt`）

### 4. 数据库
- ✅ Supabase初始化SQL脚本（`docs/supabase-init.sql`）
- ✅ 7张表结构
- ✅ RLS安全策略
- ✅ 索引优化

---

## 🚀 启动步骤

### 第一步：设置Supabase

1. **创建Supabase项目**
   - 访问 https://supabase.com
   - 创建新项目
   - 记录以下信息：
     - Project URL: `https://xxxxx.supabase.co`
     - Anon Key
     - Service Key

2. **执行数据库初始化**
   - 进入Supabase Dashboard → SQL Editor
   - 复制 `docs/supabase-init.sql` 的内容
   - 执行SQL脚本
   - 确认7张表创建成功

### 第二步：配置环境变量

#### 前端环境变量
```bash
cd frontend
cp .env.example .env
```

编辑 `frontend/.env`：
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # 替换为你的Supabase URL
VITE_SUPABASE_ANON_KEY=eyJhbGc...             # 替换为你的Anon Key
```

#### 后端环境变量
```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`：
```bash
# Supabase配置
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service Key
SUPABASE_ANON_KEY=eyJhbGc...     # Anon Key

# 阿里云百炼API
DASHSCOPE_API_KEY=sk-xxxxx      # 替换为你的阿里云API Key

# FastAPI密钥（随机生成一个）
SECRET_KEY=your-random-secret-key-here

# 其他配置
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173
```

### 第三步：安装依赖

#### 前端
```bash
cd frontend
npm install
```

#### 后端
```bash
cd backend
pip install -r requirements.txt
```

或者使用虚拟环境（推荐）：
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
# 或 venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 第四步：启动项目

#### 启动后端
```bash
cd backend
python main.py
```

后端将运行在 `http://localhost:8000`

访问 API 文档：`http://localhost:8000/docs`

#### 启动前端
```bash
cd frontend
npm run dev
```

前端将运行在 `http://localhost:5173`

---

## 🧪 测试API

### 健康检查
```bash
curl http://localhost:8000/health
```

应返回：
```json
{"status": "healthy"}
```

### 测试阿里云百炼API（可选）

创建测试脚本 `backend/test_api.py`：
```python
import asyncio
from external.dashscope_service import dashscope_service

async def test():
    # 测试对话
    result = await dashscope_service.chat_completion(
        messages=[{"role": "user", "content": "你好"}]
    )
    print("对话测试:", result)

    # 测试批改（需要提供作文内容）
    grading = await dashscope_service.grade_essay(
        essay_content="我的家乡是一个美丽的地方...",
        assignment_title="我的家乡"
    )
    print("批改测试:", grading)

if __name__ == "__main__":
    asyncio.run(test())
```

运行：
```bash
python test_api.py
```

---

## 📋 下一步开发计划

根据待办事项，接下来应该实现：

### 优先级 P0（核心功能）
1. ✅ 项目骨架搭建（已完成）
2. 🔄 认证系统（Supabase Auth + 验证码）
3. 🔄 学生端：作文提交页面
4. 🔄 AI批改引擎集成
5. 🔄 教师端：批改审核页面

### 优先级 P1（基础功能）
6. 🔄 入口模块（角色选择+班级选择）
7. 🔄 学生端：任务列表、历史记录
8. 🔄 教师端：任务管理、班级管理
9. 🔄 OCR识别集成

### 优先级 P2（高级功能）
10. 🔄 数据可视化（学情分析）
11. 🔄 教学大屏
12. 🔄 AI对话辅导（亮点功能）
13. 🔄 错题本功能（亮点功能）

---

## 🎯 Vibe Coding 方法论总结

### 胶水编程实践

本项目严格遵循"能抄不写，能连不造"原则：

**前端（90%使用现成库）**
- ✅ Ant Design → UI组件
- ✅ React Router → 路由
- ✅ Zustand → 状态管理
- ✅ Axios → HTTP请求
- ✅ ECharts → 数据可视化
- ✅ React Quill → 富文本编辑器

**后端（90%使用现成库）**
- ✅ FastAPI → Web框架
- ✅ SQLAlchemy → ORM
- ✅ Pydantic → 数据验证
- ✅ OpenAI SDK → 调用阿里云百炼
- ✅ Supabase SDK → 数据库和认证

**核心业务代码量**：预计 < 4000 行

---

## ❓ 常见问题

### Q1: 如何获取阿里云百炼API Key？
1. 访问 https://dashscope.aliyun.com
2. 登录/注册阿里云账号
3. 开通百炼服务
4. 创建API Key

### Q2: Supabase有什么限制？
- 免费版：500MB数据库，1GB文件存储，50000次API请求/月
- 足够MVP开发和小规模使用

### Q3: 如何部署到生产环境？
- 前端：Vercel一键部署
- 后端：Railway/Render一键部署
- 详见README.md的部署章节

---

## 📚 参考文档

- [产品需求文档 (PRD)](../PRD.md)
- [FastAPI 文档](http://localhost:8000/docs)
- [Supabase 文档](https://supabase.com/docs)
- [阿里云百炼文档](https://help.aliyun.com/zh/model-studio/)
- [Vibe Coding 方法论](../../README.md)

---

## 🎉 开始开发吧！

项目骨架已经完成，所有基础设施已就绪。

现在可以开始实现具体功能了！

**祝开发顺利！** 🚀
