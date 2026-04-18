# 🔧 配置指南

## 需要配置的文件清单

您需要创建并配置以下 2 个文件：

### 1️⃣ 后端配置文件
**位置**: `backend/.env`

### 2️⃣ 前端配置文件
**位置**: `frontend/.env`

---

## 📝 详细配置步骤

### 步骤 1: 配置后端 `backend/.env`

```bash
# 1. 复制模板文件
cd backend
cp .env.example .env

# 2. 编辑 .env 文件
# 使用任何文本编辑器打开 backend/.env
```

**填写内容**（请替换为您的实际值）：

```bash
# ===== Supabase 配置 =====
# 从 https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api 获取
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...（完整的 service_role key）
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...（完整的 anon key）

# ===== 阿里云百炼 API =====
# 从 https://dashscope.aliyun.com 获取
DASHSCOPE_API_KEY=sk-your-actual-api-key

# ===== FastAPI 配置 =====
# 使用以下命令生成随机密钥：python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-generated-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ===== 应用配置 =====
DEBUG=True
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
API_V1_PREFIX=/api

# ===== 日志配置 =====
LOG_LEVEL=INFO
```

---

### 步骤 2: 配置前端 `frontend/.env`

```bash
# 1. 复制模板文件
cd frontend
cp .env.example .env

# 2. 编辑 .env 文件
```

**填写内容**（请替换为您的实际值）：

```bash
# API 基础 URL（后端地址）
VITE_API_BASE_URL=http://localhost:8000

# Supabase 配置（与后端相同的项目）
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...（完整的 anon key）

# 应用配置
VITE_APP_NAME=AI作文批改系统
VITE_APP_VERSION=1.0.0
```

---

## 🔑 如何获取各项配置值

### 1. **Supabase 配置**

1. 访问 [https://supabase.com](https://supabase.com) 并登录
2. 创建新项目或选择现有项目
3. 进入 **Project Settings** → **API**
4. 复制以下内容：
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`（前后端都需要）
   - **service_role key** → `SUPABASE_SERVICE_KEY`（仅后端需要）

**重要**: service_role key 拥有完全访问权限，千万不要暴露给前端或提交到 Git！

### 2. **阿里云百炼 API Key**

1. 访问 [https://dashscope.aliyun.com](https://dashscope.aliyun.com)
2. 登录阿里云账号
3. 开通 DashScope 服务
4. 进入 **API-KEY管理** 创建新的 API Key
5. 确保开通了以下模型：
   - `qwen-plus`（用于 AI 批改和对话）
   - `qwen-vl-plus`（用于 OCR 图像识别）

### 3. **SECRET_KEY（后端密钥）**

使用以下命令生成：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

复制输出的字符串到 `SECRET_KEY`

---

## 📋 配置检查清单

完成配置后，请检查：

- [ ] `backend/.env` 文件已创建并填写完整
- [ ] `frontend/.env` 文件已创建并填写完整
- [ ] Supabase URL 格式正确（https://xxxxx.supabase.co）
- [ ] Supabase Keys 已复制完整（很长的字符串）
- [ ] 阿里云 API Key 以 `sk-` 开头
- [ ] SECRET_KEY 已生成并填写
- [ ] 前后端的 Supabase URL 和 ANON_KEY 一致
- [ ] 没有将 `.env` 文件提交到 Git（已在 .gitignore 中）

---

## ⚠️ 安全提示

1. **永远不要**将 `.env` 文件提交到 Git
2. **永远不要**将 `SUPABASE_SERVICE_KEY` 暴露给前端
3. **永远不要**将 API Keys 分享给他人
4. 生产环境请设置 `DEBUG=False`
5. 生产环境请更新 `ALLOWED_ORIGINS` 为实际域名

---

## 🐛 配置错误排查

### 后端无法启动

- 检查 `SUPABASE_URL` 和 `DASHSCOPE_API_KEY` 是否正确
- 检查端口 8000 是否被占用
- 查看终端错误信息

### 前端无法连接后端

- 检查 `VITE_API_BASE_URL` 是否为 `http://localhost:8000`
- 确认后端已成功启动
- 检查浏览器控制台的 CORS 错误

### Supabase 连接失败

- 确认 Supabase 项目已创建
- 确认已执行 `docs/supabase-init.sql` 初始化数据库
- 检查 Keys 是否复制完整（很长的字符串）

### AI API 调用失败

- 确认阿里云账号有余额
- 确认已开通 qwen-plus 和 qwen-vl-plus 模型
- 检查 API Key 是否正确

---

## 📞 需要帮助？

如果配置过程中遇到问题，请：

1. 检查终端/控制台的完整错误信息
2. 确认所有必填配置项都已填写
3. 尝试重新启动后端和前端服务
