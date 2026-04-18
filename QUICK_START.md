# AI作文批改系统 - 快速开始

## 📝 配置信息需要填充到哪些文件？

您只需要配置 **2 个文件**：

### 1. 后端配置文件
```
backend/.env
```

### 2. 前端配置文件
```
frontend/.env
```

---

## 🚀 快速配置步骤（3步完成）

### 第 1 步：创建配置文件

```bash
# 在项目根目录执行
cd backend
cp .env.example .env

cd ../frontend
cp .env.example .env
```

### 第 2 步：填写配置信息

打开以下文件并填写您的配置：

**1. 编辑 `backend/.env`**（需要填写 5 项）：
```bash
SUPABASE_URL=你的Supabase项目URL
SUPABASE_SERVICE_KEY=你的Supabase service_role密钥
SUPABASE_ANON_KEY=你的Supabase anon密钥
DASHSCOPE_API_KEY=你的阿里云API密钥
SECRET_KEY=随机生成的密钥
```

**2. 编辑 `frontend/.env`**（需要填写 3 项）：
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=你的Supabase项目URL（与后端相同）
VITE_SUPABASE_ANON_KEY=你的Supabase anon密钥（与后端相同）
```

### 第 3 步：检查配置

```bash
# 在项目根目录执行
./check-config.sh
```

---

## 🔑 配置值获取方法

### Supabase 配置（3 个值）

1. 访问 https://supabase.com 并登录
2. 创建项目或选择已有项目
3. 进入 **Settings** → **API**
4. 复制以下内容：
   - **Project URL** → `SUPABASE_URL`（前后端都需要）
   - **anon public** → `SUPABASE_ANON_KEY`（前后端都需要）
   - **service_role** → `SUPABASE_SERVICE_KEY`（仅后端需要）

### 阿里云 API Key（1 个值）

1. 访问 https://dashscope.aliyun.com
2. 登录并开通服务
3. 创建 API Key → 复制到 `DASHSCOPE_API_KEY`

### 生成 SECRET_KEY（1 个值）

```bash
# 运行此命令生成
python -c "import secrets; print(secrets.token_urlsafe(32))"
# 复制输出结果到 SECRET_KEY
```

---

## 📁 配置文件位置总结

```
ai-essay-grading/
├── backend/
│   ├── .env.example          # 模板文件（不要修改）
│   └── .env                  # ⭐ 您需要创建并填写这个文件
│
├── frontend/
│   ├── .env.example          # 模板文件（不要修改）
│   └── .env                  # ⭐ 您需要创建并填写这个文件
│
├── CONFIG_GUIDE.md           # 详细配置指南
├── check-config.sh           # 配置检查脚本
└── QUICK_START.md            # 本文件
```

---

## ⚡ 一键检查配置

配置完成后，运行检查脚本：

```bash
./check-config.sh
```

看到所有 ✅ 表示配置正确！

---

## 🎯 下一步

配置完成后：

1. **初始化数据库**：在 Supabase SQL Editor 执行 `docs/supabase-init.sql`
2. **安装依赖**：
   ```bash
   cd backend && pip install -r requirements.txt
   cd ../frontend && npm install
   ```
3. **启动项目**：
   ```bash
   # 终端1：启动后端
   cd backend && python main.py

   # 终端2：启动前端
   cd frontend && npm run dev
   ```

---

## 📌 重要提醒

- ⚠️ 不要将 `.env` 文件提交到 Git
- ⚠️ `SUPABASE_SERVICE_KEY` 只能用于后端，不要暴露给前端
- ⚠️ 确保阿里云账号有余额，否则 AI 功能无法使用

---

## 需要帮助？

查看详细配置指南：`CONFIG_GUIDE.md`
