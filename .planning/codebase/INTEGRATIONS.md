# External Integrations

## Overview

The system integrates with 2 external services: **Supabase** (BaaS — database, auth, storage) and **Alibaba Cloud DashScope** (LLM API). No webhooks, no third-party OAuth, no payment providers.

---

## 1. Supabase

### Purpose

Full backend-as-a-service: PostgreSQL database, authentication, file storage, and Row Level Security.

### Connection Points

| Layer | Client | Key Type | File |
|-------|--------|----------|------|
| Frontend | `@supabase/supabase-js` v2 | Anon key (RLS-restricted) | `frontend/src/services/supabase.ts` |
| Backend | `supabase` Python SDK v2 | Service key (full access) | `backend/external/supabase_service.py` |

### Configuration

| Variable | Location | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | `frontend/.env` | Project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | `frontend/.env` | Public anon JWT |
| `SUPABASE_URL` | `backend/.env` | Same project URL |
| `SUPABASE_SERVICE_KEY` | `backend/.env` | Service role JWT (bypasses RLS) |
| `SUPABASE_ANON_KEY` | `backend/.env` | Anon key (stored but not used directly) |

### 1a. Supabase Auth

**Frontend authentication** via Supabase Auth — the backend does NOT handle auth directly.

| Operation | Method | File |
|-----------|--------|------|
| Sign up (email/password) | `supabase.auth.signUp()` | `frontend/src/services/supabase.ts` → `authService.signUp` |
| Sign in (email/password) | `supabase.auth.signInWithPassword()` | `frontend/src/services/supabase.ts` → `authService.signIn` |
| Sign out | `supabase.auth.signOut()` | `frontend/src/services/supabase.ts` → `authService.signOut` |
| Get current user | `supabase.auth.getUser()` | `frontend/src/services/supabase.ts` → `authService.getCurrentUser` |
| Reset password | `supabase.auth.resetPasswordForEmail()` | `frontend/src/services/supabase.ts` → `authService.resetPassword` |
| Update password | `supabase.auth.updateUser()` | `frontend/src/services/supabase.ts` → `authService.updatePassword` |
| Resend confirmation | `supabase.auth.resend()` | `frontend/src/services/supabase.ts` → `authService.resendConfirmation` |
| Auth state listener | `supabase.auth.onAuthStateChange()` | `frontend/src/services/supabase.ts` → `authService.onAuthStateChange` |
| Get session | `supabase.auth.getSession()` | `frontend/src/pages/AuthCallback.tsx` |

**Auth flow**:
1. User registers → Supabase creates `auth.users` row + sends confirmation email
2. Confirmation email links to `VITE_SUPABASE_EMAIL_REDIRECT_TO` (default: `/auth/callback`)
3. `AuthCallback.tsx` handles the redirect, calls `getSession()`, syncs with `authStore`
4. Login stores `access_token` in `localStorage`; axios interceptor attaches `Bearer` token to API requests
5. Registration auto-creates a business `users` row via `userService.createUser`

**User metadata stored in Supabase Auth**: `name`, `role`, `class_id`

### 1b. Supabase Database (PostgREST)

**Frontend direct queries** (via anon key, RLS-enforced):

| Service | Table | Operations | File |
|---------|-------|------------|------|
| `userService.getUserById` | `users` | SELECT single | `frontend/src/services/supabase.ts` |
| `userService.createUser` | `users` | INSERT | `frontend/src/services/supabase.ts` |
| `userService.updateUser` | `users` | UPDATE | `frontend/src/services/supabase.ts` |
| `classService.getClasses` | `classes` | SELECT all (ordered) | `frontend/src/services/supabase.ts` |
| `classService.getClassesByGrade` | `classes` | SELECT filtered | `frontend/src/services/supabase.ts` |
| `classService.getClassById` | `classes` | SELECT single | `frontend/src/services/supabase.ts` |
| `classService.getClassesByTeacher` | `classes` | SELECT filtered | `frontend/src/services/supabase.ts` |

**Backend service-key queries** (full access, no RLS):

| Method | Table(s) | Operations | File |
|--------|----------|------------|------|
| `get_user_by_id` | `users` | SELECT | `backend/external/supabase_service.py` |
| `update_user` | `users` | UPDATE | `backend/external/supabase_service.py` |
| `get_all_classes` | `classes` | SELECT | `backend/external/supabase_service.py` |
| `get_class_by_id` | `classes` | SELECT | `backend/external/supabase_service.py` |
| `create_assignment` | `assignments` | INSERT | `backend/external/supabase_service.py` |
| `get_assignments_by_class` | `assignments` | SELECT | `backend/external/supabase_service.py` |
| `get_student_assignments` | `users`, `assignments` | SELECT (join via class_id) | `backend/external/supabase_service.py` |
| `create_submission` | `submissions` | INSERT | `backend/external/supabase_service.py` |
| `update_submission` | `submissions` | UPDATE | `backend/external/supabase_service.py` |
| `get_submission_by_id` | `submissions` | SELECT | `backend/external/supabase_service.py` |
| `get_student_submissions` | `submissions` | SELECT | `backend/external/supabase_service.py` |
| `create_grading_report` | `grading_reports` | INSERT | `backend/external/supabase_service.py` |
| `update_grading_report` | `grading_reports` | UPDATE | `backend/external/supabase_service.py` |
| `get_report_by_submission` | `grading_reports` | SELECT | `backend/external/supabase_service.py` |
| `get_student_reports` | `grading_reports`, `submissions` | SELECT (inner join) | `backend/external/supabase_service.py` |
| `create_conversation` | `ai_conversations` | INSERT | `backend/external/supabase_service.py` |
| `get_conversations` | `ai_conversations` | SELECT | `backend/external/supabase_service.py` |
| `get_student_stats` | `submissions`, `grading_reports` | SELECT (aggregation) | `backend/external/supabase_service.py` |
| `get_student_learning_curve` | `submissions`, `assignments`, `grading_reports` | SELECT (join) | `backend/external/supabase_service.py` |
| `get_teacher_stats` | `assignments`, `submissions`, `grading_reports` | SELECT (aggregation) | `backend/external/supabase_service.py` |
| Direct client usage | `submissions`, `users` | SELECT (inner join) | `backend/api/teacher.py` line 40 |

### 1c. Supabase Storage

| Operation | Bucket | File |
|-----------|--------|------|
| Upload essay image | `essays` | `backend/external/supabase_service.py` → `upload_file` |
| Get public URL | `essays` | `backend/external/supabase_service.py` → `upload_file` (returns `get_public_url`) |

**Upload flow**: Frontend → `POST /api/student/upload-image` (multipart) → Backend reads file → `supabase.storage.from_("essays").upload()` → Returns public URL.

Supported formats: `jpg`, `jpeg`, `png`, `gif`, `webp`.

---

## 2. Alibaba Cloud DashScope (阿里云百炼)

### Purpose

LLM inference for essay grading, OCR (handwriting recognition), and AI tutoring chat.

### Connection

| Property | Value |
|----------|-------|
| SDK | `openai` Python package (>=1.40.0) in **OpenAI-compatible mode** |
| Base URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| Auth | API key via `DASHSCOPE_API_KEY` env var |
| Client file | `backend/external/dashscope_service.py` |
| Singleton | `dashscope_service` (module-level instance) |

### Models Used

| Model | Purpose | Temperature | Max Tokens | Caller |
|-------|---------|-------------|------------|--------|
| `qwen-plus` | Essay grading (structured JSON output) | 0.5 | 3000 | `dashscope_service.grade_essay()` |
| `qwen-plus` | AI chat tutoring (conversational) | 0.7 | 2000 | `dashscope_service.chat_completion()` |
| `qwen-vl-plus` | OCR / handwriting recognition (multimodal) | default | default | `dashscope_service.ocr_recognize()` |

### API Calls

#### Essay Grading (`grade_essay`)
- **Endpoint used**: `POST /chat/completions` (via OpenAI SDK)
- **Triggered by**: `POST /api/grading/auto-grade/{submission_id}` → `backend/api/grading.py`
- **Input**: Essay text + optional title
- **System prompt**: Detailed Chinese-language rubric (content 35pts, structure 25pts, language 25pts, writing 15pts)
- **Output format**: JSON with `total_score`, `scores`, `errors[]`, `comment`
- **Fallback**: Returns zero-score graceful degradation on parse failure

#### OCR Recognition (`ocr_recognize`)
- **Endpoint used**: `POST /chat/completions` with multimodal input (via OpenAI SDK)
- **Triggered by**: `POST /api/student/ocr` → `backend/api/student.py`
- **Input**: Image URL (from Supabase Storage)
- **Prompt**: "Please recognize all text in this image, output in original order, no explanations."
- **Output**: Extracted text string

#### AI Chat Tutoring (`chat_completion`)
- **Endpoint used**: `POST /chat/completions` (via OpenAI SDK)
- **Triggered by**: `POST /api/ai-chat/message` → `backend/api/ai_chat.py`
- **Input**: System prompt (essay + grading context) + student message
- **Features**: Supports streaming via `stream=True` (with usage tracking via `stream_options`)
- **History**: Conversations persisted to `ai_conversations` table in Supabase

---

## 3. Backend API (FastAPI ↔ Frontend)

The backend exposes a REST API consumed by the frontend via axios.

### Base Configuration

| Property | Value |
|----------|-------|
| Base URL | `VITE_API_BASE_URL` (default: `http://localhost:8000`) |
| Prefix | `/api` |
| Timeout | 30 seconds (axios client) |
| Auth | Bearer token in `Authorization` header (from localStorage) |
| CORS | Configured via `ALLOWED_ORIGINS` (default: `localhost:5173,localhost:3000`) |

### API Routes

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| `GET` | `/` | `main.py` | Health check (root) |
| `GET` | `/health` | `main.py` | Health check |
| `GET` | `/api/auth/captcha` | `backend/api/auth.py` | Generate captcha |
| `POST` | `/api/auth/verify-captcha` | `backend/api/auth.py` | Verify captcha |
| `GET` | `/api/auth/health` | `backend/api/auth.py` | Auth health check |
| `GET` | `/api/student/assignments` | `backend/api/student.py` | Get student assignments |
| `POST` | `/api/student/submissions` | `backend/api/student.py` | Submit essay |
| `POST` | `/api/student/upload-image` | `backend/api/student.py` | Upload handwriting image |
| `POST` | `/api/student/ocr` | `backend/api/student.py` | OCR recognize image |
| `GET` | `/api/student/submissions/history` | `backend/api/student.py` | Get submission history |
| `GET` | `/api/student/reports/{submission_id}` | `backend/api/student.py` | Get grading report |
| `GET` | `/api/student/stats` | `backend/api/student.py` | Get student statistics |
| `GET` | `/api/student/learning-curve` | `backend/api/student.py` | Get learning curve data |
| `GET` | `/api/teacher/classes` | `backend/api/teacher.py` | Get teacher classes |
| `POST` | `/api/teacher/assignments` | `backend/api/teacher.py` | Create assignment |
| `GET` | `/api/teacher/assignments` | `backend/api/teacher.py` | Get class assignments |
| `GET` | `/api/teacher/assignments/{id}/submissions` | `backend/api/teacher.py` | Get assignment submissions |
| `GET` | `/api/teacher/classes/{class_id}/stats` | `backend/api/teacher.py` | Get class stats (mock) |
| `GET` | `/api/teacher/stats` | `backend/api/teacher.py` | Get teacher stats |
| `POST` | `/api/grading/auto-grade/{submission_id}` | `backend/api/grading.py` | Trigger AI grading |
| `PUT` | `/api/grading/reports/{report_id}/review` | `backend/api/grading.py` | Teacher review |
| `POST` | `/api/grading/reports/{report_id}/publish` | `backend/api/grading.py` | Publish report to student |
| `POST` | `/api/ai-chat/message` | `backend/api/ai_chat.py` | Send chat message |
| `GET` | `/api/ai-chat/history` | `backend/api/ai_chat.py` | Get chat history |
| `GET` | `/api/mistakes` | `backend/api/mistakes.py` | Get mistake records |
| `PUT` | `/api/mistakes/{mistake_id}/master` | `backend/api/mistakes.py` | Mark mistake mastered |
| `GET` | `/api/mistakes/types` | `backend/api/mistakes.py` | Get error type list |

### Frontend API Client

All API calls routed through `frontend/src/services/api.ts`:
- Axios instance with interceptors
- Request interceptor: attaches `Bearer` token from `localStorage`
- Response interceptor: 401 → clear token + redirect to `/login`
- Organized by domain: `api.student.*`, `api.teacher.*`, `api.grading.*`, `api.auth.*`, `api.aiChat.*`, `api.mistakes.*`

---

## 4. Data Flow Diagrams

### Essay Submission & Grading

```
Student (browser)
  │
  ├─ [typed essay] POST /api/student/submissions ──→ Supabase: submissions.insert
  │
  └─ [handwritten] POST /api/student/upload-image ──→ Supabase Storage: essays bucket
                   POST /api/student/ocr ──→ DashScope qwen-vl-plus (multimodal)
                   POST /api/student/submissions ──→ Supabase: submissions.insert
                         │
Teacher (browser)         │
  POST /api/grading/auto-grade/{id}
       │
       ├──→ Supabase: submissions.select (get content)
       ├──→ DashScope qwen-plus (essay grading prompt)
       ├──→ Supabase: grading_reports.insert
       └──→ Supabase: submissions.update (status → "graded")
       │
  PUT /api/grading/reports/{id}/review ──→ Supabase: grading_reports.update
  POST /api/grading/reports/{id}/publish ──→ Supabase: grading_reports.update (published_at)
```

### Authentication

```
Frontend (browser)
  │
  ├─ supabase.auth.signUp() ──→ Supabase Auth (creates auth.users row)
  │   └─ supabase.from("users").insert() ──→ Supabase DB (creates business user row)
  │
  ├─ Confirmation email ──→ /auth/callback ──→ supabase.auth.getSession()
  │
  └─ supabase.auth.signInWithPassword() ──→ Supabase Auth
      └─ supabase.from("users").select() ──→ Supabase DB (fetch profile)
          └─ localStorage.setItem("access_token", session.access_token)
```

---

## 5. Missing / Placeholder Integrations

| Feature | Current State | Notes |
|---------|---------------|-------|
| Redis | Commented out in `.env.example` | Captcha store uses in-memory dict |
| Direct PostgreSQL | `DATABASE_URL` in env but unused | All access via Supabase SDK |
| Email service | Supabase built-in email | No custom SMTP configured |
| Class stats | Mock data in `backend/api/teacher.py` line 61-66 | Hardcoded values returned |
| Mistake mastery | No-op endpoint | Returns `{"success": true}` without persistence |
| SQLAlchemy/Alembic | Listed in `requirements.txt` | Empty `models/`, `alembic/` directories |
| Tests | Listed in `requirements.txt` | Empty `tests/` directory |

---

## 6. Security Notes

- **Supabase anon key** is exposed in frontend (by design — RLS enforces access control)
- **Supabase service key** used in backend only (bypasses RLS — full DB access)
- **CORS** restricted to configured origins
- **JWT** used for backend API auth (HS256 algorithm, 30min expiry)
- **RLS policies** enforce row-level data isolation per user role
- **File upload** restricted to image formats only (`jpg`, `jpeg`, `png`, `gif`, `webp`)
