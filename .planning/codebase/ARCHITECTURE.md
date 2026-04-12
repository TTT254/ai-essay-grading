# Architecture

## System Overview

K-12 AI Essay Grading System. Two-role (student/teacher) web application with AI-powered essay grading, OCR handwriting recognition, AI tutoring chat, and mistake tracking.

## Architectural Pattern

**Layered Client-Server with BaaS**

```
Browser (React SPA)
    |
    |--- Supabase JS SDK (auth, direct DB reads for user/class data)
    |--- Axios HTTP (backend API for AI + business logic)
    |
FastAPI Backend (Python)
    |
    |--- Supabase Python SDK (DB writes, file storage, complex queries)
    |--- DashScope / Alibaba Cloud (LLM: qwen-plus, VLM: qwen-vl-plus)
    |
Supabase (PostgreSQL + Auth + Storage)
```

The frontend talks to **two backends simultaneously**:
1. **Supabase directly** via `@supabase/supabase-js` for authentication (sign up, sign in, session management) and simple reads (users table, classes table).
2. **FastAPI backend** via Axios for all AI-related operations and complex business logic (grading, submissions, OCR, chat, mistakes, statistics).

The FastAPI backend uses `supabase-py` with the **Service Key** (full admin access) for database mutations and complex joins, and the **OpenAI-compatible SDK** pointing at Alibaba Cloud DashScope for LLM/VLM calls.

## Layer Breakdown

### Presentation Layer (Frontend)

| Concern | Technology | Key Abstraction |
|---------|-----------|-----------------|
| UI Framework | React 19 + TypeScript | Functional components with hooks |
| Component Library | Ant Design 5 (antd) | `ConfigProvider` with zh_CN locale + custom theme |
| Routing | react-router-dom v7 | `BrowserRouter` with lazy-loaded routes |
| State Management | Zustand v5 | 3 stores: `authStore`, `studentStore`, `teacherStore` |
| HTTP Client | Axios | Singleton `apiClient` with interceptors |
| BaaS Client | @supabase/supabase-js | `supabase` singleton + service wrappers |
| Rich Text Editor | react-quill | Used in essay submission page |
| Charts | ECharts (via echarts + echarts-for-react) | Used in Profile (learning curve) and Dashboard |
| Date Handling | dayjs | Formatting and deadline comparisons |

### Application Layer (Backend)

| Concern | Technology | Key Abstraction |
|---------|-----------|-----------------|
| Framework | FastAPI | `APIRouter` per domain, registered under `/api` prefix |
| Config | pydantic-settings | `Settings` class reading `.env` |
| Validation | Pydantic v2 | Request/response models in `schemas/` |
| Auth (CAPTCHA) | In-memory dict | Simple alphanumeric CAPTCHA with 5-min expiry |

### External Services Layer

| Service | SDK | Module |
|---------|-----|--------|
| Supabase (DB + Storage) | `supabase-py` | `backend/external/supabase_service.py` |
| Alibaba DashScope (LLM) | `openai` SDK (compatible mode) | `backend/external/dashscope_service.py` |

### Data Layer (Supabase PostgreSQL)

Inferred tables from SDK calls:

| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `users` | `id`, `email`, `name`, `role`, `class_id`, `avatar` | `class_id` -> `classes.id` |
| `classes` | `id`, `grade`, `name`, `teacher_id`, `student_count` | `teacher_id` -> `users.id` |
| `assignments` | `id`, `title`, `description`, `teacher_id`, `class_id`, `deadline`, `word_count_min`, `word_count_max` | `class_id` -> `classes.id` |
| `submissions` | `id`, `assignment_id`, `student_id`, `content`, `word_count`, `image_url`, `ocr_result`, `status`, `submitted_at` | `assignment_id` -> `assignments.id`, `student_id` -> `users.id` |
| `grading_reports` | `id`, `submission_id`, `ai_total_score`, `ai_scores` (JSON), `ai_errors` (JSON), `ai_comment`, `teacher_total_score`, `teacher_scores`, `teacher_comment`, `final_total_score`, `final_scores`, `final_comment`, `graded_at`, `reviewed_at`, `published_at` | `submission_id` -> `submissions.id` |
| `ai_conversations` | `id`, `student_id`, `submission_id`, `question`, `answer`, `created_at` | `student_id` -> `users.id`, `submission_id` -> `submissions.id` |

**Storage bucket**: `essays` (for uploaded handwritten essay images).

## Entry Points

### Frontend

- **HTML entry**: `frontend/index.html` loads `frontend/src/main.tsx`
- **React entry**: `frontend/src/main.tsx` renders `<App />` inside `<StrictMode>`
- **App root**: `frontend/src/App.tsx` sets up `ConfigProvider` (Ant Design theme), `BrowserRouter`, `Suspense` (lazy loading), and all `<Route>` definitions
- **Dev server**: `vite` on port `5173`

### Backend

- **App entry**: `backend/main.py` creates `FastAPI` instance, configures CORS, registers 6 routers
- **Dev server**: `uvicorn` on port `8000` (with `--reload` when `DEBUG=True`)
- **API docs**: `/docs` (Swagger) and `/redoc`
- **Health check**: `GET /` and `GET /health`

## Data Flow: Complete Essay Grading Lifecycle

### 1. Registration & Auth

```
Register.tsx
  -> authService.signUp() [Supabase Auth SDK, frontend/src/services/supabase.ts]
  -> userService.createUser() [Supabase DB SDK, inserts into `users` table]
  -> authStore.login() [auto-login after registration]
  -> Supabase session token stored in localStorage as `access_token`
```

### 2. Student Views Assignments

```
Tasks.tsx
  -> studentStore.fetchAssignments(userId)
  -> api.student.getAssignments() [Axios -> GET /api/student/assignments]
  -> backend/api/student.py::get_student_assignments()
  -> supabase_service.get_student_assignments()
     -> queries `users` table for class_id
     -> queries `assignments` table filtered by class_id
  -> Response: { success: true, data: [...assignments] }
```

### 3. Essay Submission (with optional OCR)

```
Submit.tsx (Tab 1: Image Upload)
  -> studentStore.uploadImage(file)
  -> api.student.uploadImage() [Axios -> POST /api/student/upload-image]
  -> backend/api/student.py::upload_image()
  -> supabase_service.upload_file("essays", path, file_data) [Supabase Storage]
  -> Returns public URL

Submit.tsx (OCR Recognition)
  -> studentStore.ocrRecognize(imageUrl)
  -> api.student.ocrRecognize() [Axios -> POST /api/student/ocr]
  -> backend/api/student.py::ocr_recognize()
  -> dashscope_service.ocr_recognize(image_url) [qwen-vl-plus multimodal model]
  -> Returns recognized text

Submit.tsx (Tab 2: Online Editor / Final Submit)
  -> studentStore.submitEssay(userId, data)
  -> api.student.submitEssay() [Axios -> POST /api/student/submissions]
  -> backend/api/student.py::create_submission()
  -> supabase_service.create_submission() [inserts into `submissions` table]
  -> Returns submission record
```

### 4. AI Grading

```
Grading.tsx (Teacher triggers)
  -> api.grading.autoGrade(submissionId) [Axios -> POST /api/grading/auto-grade/{id}]
  -> backend/api/grading.py::auto_grade_essay()
  -> supabase_service.get_submission_by_id() [reads essay content]
  -> dashscope_service.grade_essay() [qwen-plus model with structured prompt]
     -> Sends grading rubric prompt (content/35, structure/25, language/25, writing/15)
     -> Expects JSON response with total_score, scores, errors[], comment
     -> Parses JSON (handles markdown code fences)
  -> supabase_service.create_grading_report() [inserts into `grading_reports`]
  -> supabase_service.update_submission() [sets status to "graded"]
```

### 5. Teacher Review & Publish

```
Grading.tsx
  -> teacherStore.reviewReport(reportId, { teacher_scores, teacher_comment })
  -> api.grading.reviewReport() [Axios -> PUT /api/grading/reports/{id}/review]
  -> backend/api/grading.py::teacher_review()
  -> supabase_service.update_grading_report() [updates teacher fields + final fields]

Grading.tsx
  -> teacherStore.publishReport(reportId)
  -> api.grading.publishReport() [Axios -> POST /api/grading/reports/{id}/publish]
  -> backend/api/grading.py::publish_report()
  -> supabase_service.update_grading_report() [sets published_at timestamp]
```

### 6. Student Views Report

```
Report.tsx
  -> studentStore.fetchReport(submissionId)
  -> api.student.getReport() [Axios -> GET /api/student/reports/{id}]
  -> backend/api/student.py::get_grading_report()
  -> supabase_service.get_report_by_submission() [reads from `grading_reports`]
  -> Displays: total score (circle progress), 4-dimension scores, error list, comment
```

### 7. AI Tutoring Chat

```
AIChat.tsx
  -> api.aiChat.sendMessage(studentId, submissionId, message)
  -> Axios -> POST /api/ai-chat/message
  -> backend/api/ai_chat.py::send_message()
  -> supabase_service.get_submission_by_id() [essay content as context]
  -> supabase_service.get_report_by_submission() [grading report as context]
  -> dashscope_service.chat_completion() [qwen-plus with system prompt containing essay + report]
  -> supabase_service.create_conversation() [saves Q&A to `ai_conversations`]
  -> Returns AI response
```

### 8. Mistake Book

```
Mistakes.tsx
  -> api.mistakes.getMistakes(studentId, errorType?)
  -> Axios -> GET /api/mistakes
  -> backend/api/mistakes.py::get_mistakes()
  -> supabase_service.get_student_reports() [all reports for student]
  -> Aggregates errors across all reports, counts occurrences
  -> Returns sorted mistake list with occurrence counts
```

## Authentication Architecture

**Dual-layer auth**:

1. **Supabase Auth** (primary): Handles registration, login, session management, email confirmation, password reset. The frontend uses `@supabase/supabase-js` directly.

2. **Business user table**: After Supabase Auth creates an auth user, the app immediately inserts a corresponding row into the `users` table (with role, class_id, name). This happens in `authStore.register()` and `authStore.login()` (as fallback).

3. **JWT token flow**: After login, `data.session.access_token` is stored in `localStorage`. The Axios client attaches it as `Authorization: Bearer <token>` on every request. The backend currently does **not verify JWT tokens** on API routes (no auth middleware/dependency).

4. **Route guards**: Frontend `ProtectedRoute` component checks `isAuthenticated` and `user.role` from Zustand store. Redirects unauthenticated users to `/login` and wrong-role users to `/`.

5. **State persistence**: `authStore` uses Zustand `persist` middleware with `localStorage` (key: `auth-storage`), persisting `user` and `isAuthenticated`.

## AI Integration Architecture

**Provider**: Alibaba Cloud DashScope (via OpenAI-compatible API at `https://dashscope.aliyuncs.com/compatible-mode/v1`)

**Models used**:
- `qwen-plus`: Text LLM for essay grading and chat tutoring
- `qwen-vl-plus`: Vision-Language model for OCR handwriting recognition

**DashScopeService** (`backend/external/dashscope_service.py`) exposes 3 methods:
1. `chat_completion()`: General chat (used by AI tutoring chat)
2. `ocr_recognize()`: Multimodal image-to-text (handwritten essay recognition)
3. `grade_essay()`: Structured essay grading with JSON output parsing

The grading prompt uses a 4-dimension rubric:
- Content (思想内容): 35 points
- Structure (结构安排): 25 points
- Language (语言表达): 25 points
- Writing (文字书写): 15 points

## Key Abstractions

### Service Singletons (Backend)

- `supabase_service` (`backend/external/supabase_service.py`): Global `SupabaseService` instance. 20+ async methods organized by domain (users, classes, assignments, submissions, grading_reports, conversations, storage, stats).
- `dashscope_service` (`backend/external/dashscope_service.py`): Global `DashScopeService` instance. Wraps OpenAI SDK with DashScope base URL.
- `settings` (`backend/core/config.py`): Global `Settings` instance. Reads `.env` via pydantic-settings.

### Service Wrappers (Frontend)

- `authService` (`frontend/src/services/supabase.ts`): Wraps Supabase Auth SDK methods (signUp, signIn, signOut, getCurrentUser, resetPassword, updatePassword, resendConfirmation).
- `userService` (`frontend/src/services/supabase.ts`): CRUD on `users` table via Supabase client.
- `classService` (`frontend/src/services/supabase.ts`): Read operations on `classes` table via Supabase client.
- `api` object (`frontend/src/services/api.ts`): Namespace-organized Axios wrapper with methods grouped as `api.student.*`, `api.teacher.*`, `api.grading.*`, `api.auth.*`, `api.aiChat.*`, `api.mistakes.*`.

### Zustand Stores (Frontend)

- `useAuthStore`: User session, login/register/logout/checkAuth, JWT token management, email confirmation. Persisted to localStorage.
- `useStudentStore`: Assignments list, submissions list, current grading report. Fetches from backend API.
- `useTeacherStore`: Classes list, assignments list, selected class. Handles grading review and report publishing.

## API Route Map

All routes prefixed with `/api` (via `settings.API_V1_PREFIX`).

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| GET | `/api/auth/captcha` | `auth.get_captcha` | Generate CAPTCHA |
| POST | `/api/auth/verify-captcha` | `auth.verify_captcha` | Verify CAPTCHA |
| GET | `/api/student/assignments` | `student.get_student_assignments` | Student's assignments |
| POST | `/api/student/submissions` | `student.create_submission` | Submit essay |
| POST | `/api/student/upload-image` | `student.upload_image` | Upload handwritten image |
| POST | `/api/student/ocr` | `student.ocr_recognize` | OCR recognition |
| GET | `/api/student/submissions/history` | `student.get_submission_history` | Submission history |
| GET | `/api/student/reports/{id}` | `student.get_grading_report` | Get grading report |
| GET | `/api/student/stats` | `student.get_student_stats` | Student statistics |
| GET | `/api/student/learning-curve` | `student.get_learning_curve` | Learning curve data |
| POST | `/api/grading/auto-grade/{id}` | `grading.auto_grade_essay` | Trigger AI grading |
| PUT | `/api/grading/reports/{id}/review` | `grading.teacher_review` | Teacher review |
| POST | `/api/grading/reports/{id}/publish` | `grading.publish_report` | Publish report |
| GET | `/api/teacher/classes` | `teacher.get_teacher_classes` | Teacher's classes |
| POST | `/api/teacher/assignments` | `teacher.create_assignment` | Create assignment |
| GET | `/api/teacher/assignments` | `teacher.get_teacher_assignments` | Class assignments |
| GET | `/api/teacher/assignments/{id}/submissions` | `teacher.get_assignment_submissions` | Assignment submissions |
| GET | `/api/teacher/classes/{id}/stats` | `teacher.get_class_stats` | Class statistics |
| GET | `/api/teacher/stats` | `teacher.get_teacher_stats` | Teacher statistics |
| POST | `/api/ai-chat/message` | `ai_chat.send_message` | Send chat message |
| GET | `/api/ai-chat/history` | `ai_chat.get_conversation_history` | Chat history |
| GET | `/api/mistakes` | `mistakes.get_mistakes` | Get mistake book |
| PUT | `/api/mistakes/{id}/master` | `mistakes.mark_mistake_mastered` | Mark mastered |
| GET | `/api/mistakes/types` | `mistakes.get_error_types` | Error type list |

## Frontend Route Map

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/` | `Home` | None | Landing page |
| `/login` | `Login` | None | Login with CAPTCHA |
| `/register` | `Register` | None | Registration (role + class selection) |
| `/auth/callback` | `AuthCallback` | None | Email confirmation handler |
| `/dashboard` | Redirect | Auth | Routes to student/teacher based on role |
| `/student` | `StudentLayout` | Auth + role=student | Student shell (header + sidebar + outlet) |
| `/student/select-class` | `SelectClass` | Student | Class selection post-registration |
| `/student/tasks` | `Tasks` | Student | Assignment list |
| `/student/submit/:assignmentId` | `Submit` | Student | Essay submission (upload/editor) |
| `/student/history` | `History` | Student | Submission history |
| `/student/report/:submissionId` | `Report` | Student | Grading report view |
| `/student/ai-chat/:submissionId` | `AIChat` | Student | AI tutoring chat |
| `/student/mistakes` | `Mistakes` | Student | Mistake book |
| `/student/profile` | `Profile` | Student | Profile + stats + learning curve |
| `/teacher` | `TeacherLayout` | Auth + role=teacher | Teacher shell |
| `/teacher/classes` | `Classes` | Teacher | Class management |
| `/teacher/assignments` | `Assignments` | Teacher | Assignment management |
| `/teacher/grading/:assignmentId` | `Grading` | Teacher | 3-column grading workspace |
| `/teacher/dashboard` | `Dashboard` | Teacher | Charts + statistics |
| `/teacher/profile` | `Profile` | Teacher | Profile + stats + classes |

## Design Decisions & Trade-offs

1. **Dual data access**: Frontend accesses Supabase directly for auth and simple reads, but routes AI/business operations through FastAPI. This reduces backend load for reads but creates two data access patterns.

2. **No backend auth middleware**: API routes accept `student_id`/`teacher_id` as query parameters without JWT verification. The CAPTCHA system on the backend is for login/register forms only, not API protection.

3. **Synchronous Supabase in async FastAPI**: `SupabaseService` methods are declared `async` but use the synchronous `supabase-py` client (no `await` on actual DB calls). This works but blocks the event loop on DB operations.

4. **In-memory CAPTCHA store**: CAPTCHAs are stored in a Python dict. Not suitable for multi-process deployment or horizontal scaling.

5. **Hardcoded chart data**: Teacher Dashboard charts (`Dashboard.tsx`) use hardcoded sample data rather than querying actual statistics from the database.

6. **Global service instances**: Both `supabase_service` and `dashscope_service` are module-level singletons created at import time, coupling initialization to module loading.
