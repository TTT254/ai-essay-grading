# 部署指南 (Deployment Guide)

## 环境要求

- Node.js >= 18
- Python >= 3.10
- Supabase 项目（已配置数据库）
- 阿里云百炼 API Key

---

## 一、本地开发

```bash
# 1. 克隆项目
git clone <repo-url>
cd ai-essay-grading

# 2. 配置后端环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入真实的 SUPABASE_* 和 DASHSCOPE_API_KEY

# 3. 配置前端环境变量
cp frontend/.env.example frontend/.env
# 编辑 frontend/.env，填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY

# 4. 启动后端
cd backend
pip install -r requirements.txt
python main.py   # 访问 http://localhost:8000/docs 查看 API 文档

# 5. 启动前端
cd frontend
npm install
npm run dev      # 访问 http://localhost:5173

# 6. 初始化数据库（在 Supabase SQL Editor 中执行）
# docs/supabase-init.sql       — 创建所有表和 RLS 策略
# docs/test-data-executable.sql — 插入测试班级数据
```

---

## 二、后端部署（Railway / Render / VPS）

### 选项 A: Railway（推荐）

1. 创建新 Project，选择 "Deploy from GitHub repo"
2. 添加环境变量（来自 `backend/.env.example`）
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 设置 Root Directory: `backend`

### 选项 B: Render

1. 创建 Web Service，连接 GitHub
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 选项 C: VPS (Ubuntu)

```bash
# 安装 Python 和依赖
apt update && apt install -y python3 python3-pip nginx
cd backend
pip install -r requirements.txt

# 使用 systemd 管理 uvicorn
# 创建 /etc/systemd/system/ai-essay-grading.service
[Unit]
Description=AI Essay Grading API
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/ai-essay-grading/backend
ExecStart=/usr/local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target

sudo systemctl enable ai-essay-grading
sudo systemctl start ai-essay-grading

# Nginx 反向代理
# /etc/nginx/sites-available/ai-essay-grading
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 后端环境变量清单

| 变量 | 必填 | 说明 |
|------|------|------|
| `SUPABASE_URL` | 是 | Supabase 项目 URL |
| `SUPABASE_SERVICE_KEY` | 是 | Supabase Service Role Key |
| `SUPABASE_ANON_KEY` | 是 | Supabase Anonymous Key |
| `DASHSCOPE_API_KEY` | 是 | 阿里云百炼 API Key |
| `SECRET_KEY` | 是 | JWT 签名密钥（生产环境请使用随机字符串） |
| `DEBUG` | 否 | 设为 `False` 关闭调试模式 |
| `RESEND_API_KEY` | 否 | Resend API Key（发送邮件通知） |
| `EMAIL_VERIFICATION_ENABLED` | 否 | 设为 `True` 启用邮箱验证码注册 |
| `ALLOWED_ORIGINS` | 是 | 前端部署地址（逗号分隔） |
| `LOG_LEVEL` | 否 | 日志级别，默认 `INFO` |

---

## 三、前端部署（Vercel / Netlify）

### Vercel（推荐）

1. 在 [vercel.com](https://vercel.com) 创建新 Project，连接 GitHub 仓库
2. Framework Preset: `Vite`
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. 添加环境变量：
   - `VITE_API_BASE_URL` = `https://your-backend-domain.com`（后端地址）
   - `VITE_SUPABASE_URL` = 你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 Supabase Anonymous Key
   - `VITE_APP_NAME` = `AI作文批改系统`
7. 编辑 `frontend/vercel.json`，将 `your-backend-domain.com` 替换为实际后端域名
8. Deploy

**注意**: `vercel.json` 中的 rewrites 配置用于将 `/api/*` 请求代理到后端。
如果后端和前端不在同一域名，可删除 rewrites 并在前端 `.env` 中设置完整的 API 地址。

### Netlify

1. 在 Netlify 创建新 Site，连接 GitHub
2. Base Directory: `frontend`
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. 环境变量同 Vercel

### 跨域问题

如果前端 (Vercel) 和后端 (Railway/Render) 域名不同：
1. 在后端 `ALLOWED_ORIGINS` 中添加前端域名
2. 前端 `VITE_API_BASE_URL` 设为后端完整 URL（含 https://）
3. 参考 `frontend/vercel.json` 的 rewrites 配置

---

## 四、Supabase 数据库配置

### 执行初始化 SQL

在 Supabase Dashboard -> SQL Editor 中依次执行：

```bash
# 1. 创建所有表和 RLS 策略
docs/supabase-init.sql

# 2. 插入测试数据（可选）
docs/test-data-executable.sql
```

### 验证数据库

```sql
-- 检查所有表是否存在
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

预期输出包含: `users`, `classes`, `assignments`, `submissions`, `grading_reports`, `mistake_records`, `ai_conversations`

---

## 五、邮件通知（可选）

使用 Resend 发送批改完成通知邮件：

1. 在 [resend.com](https://resend.com) 注册并获取 API Key
2. 在后端环境变量中添加 `RESEND_API_KEY=re_xxxxx`
3. 重启后端服务

邮件将在教师发布批改报告时自动发送给学生。

---

## 六、生产环境检查清单

- [ ] 所有环境变量已配置（`.env` 文件已创建，`DEBUG=False`）
- [ ] `SECRET_KEY` 使用强随机值（至少 32 字符）
- [ ] Supabase RLS 策略已验证
- [ ] CORS `ALLOWED_ORIGINS` 只包含信任的域名
- [ ] 前端 API 地址指向生产后端 URL
- [ ] 数据库表已创建并包含初始数据
- [ ] 邮件服务（Resend）已测试
- [ ] HTTPS 已启用（后端和前端）
