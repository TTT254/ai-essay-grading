<!-- GSD:project-start source:PROJECT.md -->
## Project

**AI 作文批改系统 (AI Essay Grading)**

一个面向 K-12 教育场景的 AI 作文智能批改平台。学生可以在线编辑或拍照上传手写作文，系统通过阿里云百炼 AI 进行多维度智能批改（内容、结构、语言），教师可以审核 AI 批改结果并进行二次修改，同时提供学情数据可视化、AI 对话辅导和智能错题本功能。

**Core Value:** **让学生获得即时、专业、多维度的作文反馈**——减轻教师批改负担的同时，为每个学生提供个性化的写作指导。

### Constraints

- **Tech stack**: 保持现有技术栈（React/FastAPI/Supabase），不做大规模迁移
- **AI Provider**: 继续使用阿里云百炼 DashScope
- **Database**: 继续使用 Supabase PostgreSQL
- **Language**: 界面语言为中文
- **Backward compatibility**: 不破坏现有数据库表结构
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Overview
## Languages & Runtimes
| Layer | Language | Version / Target |
|-------|----------|-----------------|
| Frontend | TypeScript | ~5.9.3, target ES2022 |
| Backend | Python | >=3.10 (uses `str \| None` union syntax) |
| Database | SQL (PostgreSQL) | Supabase-managed Postgres |
| Shell | Bash | `start.sh`, `check-config.sh` |
## Frontend
### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | UI library |
| `react-dom` | ^19.2.0 | DOM renderer |
| `react-router-dom` | ^7.1.3 | Client-side routing (BrowserRouter) |
| `antd` | ^5.23.2 | UI component library (Ant Design 5) |
| `zustand` | ^5.0.2 | State management (with `persist` middleware) |
### Build Toolchain
| Tool | Version | Config File |
|------|---------|-------------|
| `vite` | ^7.2.4 | `frontend/vite.config.ts` |
| `@vitejs/plugin-react` | ^5.1.1 | Plugin in vite config |
| `typescript` | ~5.9.3 | `frontend/tsconfig.app.json`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json` |
| `eslint` | ^9.39.1 | `frontend/eslint.config.js` |
| `eslint-plugin-react-hooks` | ^7.0.1 | Flat config integration |
| `eslint-plugin-react-refresh` | ^0.4.24 | Vite HMR guard |
| `typescript-eslint` | ^8.46.4 | TS linting rules |
### Data & Visualization
| Package | Version | Purpose |
|---------|---------|---------|
| `axios` | ^1.7.9 | HTTP client for backend API calls |
| `echarts` | ^5.5.2 | Charting engine (learning curves, stats) |
| `echarts-for-react` | ^3.0.2 | React wrapper for ECharts |
| `react-quill` | ^2.0.0 | Rich text editor (essay input) |
| `dayjs` | ^1.11.13 | Date/time formatting |
| `@supabase/supabase-js` | ^2.49.3 | Supabase client (auth + direct DB queries) |
### TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx
- **Strict mode**: enabled
- **`noUnusedLocals`** / **`noUnusedParameters`**: enabled
- **`verbatimModuleSyntax`**: enabled
- **`erasableSyntaxOnly`**: enabled
### Application Entry Point
- `frontend/index.html` → `frontend/src/main.tsx` → `frontend/src/App.tsx`
- Lazy-loaded routes via `React.lazy()` with `Suspense` fallback
### State Management Architecture
| Store | File | Library |
|-------|------|---------|
| Auth | `frontend/src/store/authStore.ts` | Zustand + `persist` (localStorage key: `auth-storage`) |
| Student | `frontend/src/store/studentStore.ts` | Zustand (no persistence) |
| Teacher | `frontend/src/store/teacherStore.ts` | Zustand (no persistence) |
### Frontend Directory Structure
## Backend
### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | >=0.110.0 | Web framework |
| `uvicorn[standard]` | >=0.30.0 | ASGI server |
| `pydantic` | >=2.9.0 | Data validation |
| `pydantic-settings` | >=2.6.0 | Environment variable management |
### Database & ORM
| Package | Version | Purpose |
|---------|---------|---------|
| `supabase` | >=2.0.0 | Supabase Python SDK (primary DB client) |
| `sqlalchemy` | >=2.0.0 | Listed in requirements (unused — no models defined) |
| `alembic` | >=1.13.0 | Listed in requirements (unused — empty `alembic/` dir) |
### AI / LLM
| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | >=1.40.0 | OpenAI-compatible SDK for DashScope API |
### HTTP & I/O
| Package | Version | Purpose |
|---------|---------|---------|
| `httpx` | >=0.27.0 | Async HTTP client |
| `aiofiles` | >=24.0.0 | Async file operations |
| `pillow` | >=10.0.0 | Image processing |
| `python-multipart` | >=0.0.9 | Multipart form data (file uploads) |
### Authentication
| Package | Version | Purpose |
|---------|---------|---------|
| `python-jose[cryptography]` | >=3.3.0 | JWT token handling |
| `passlib[bcrypt]` | >=1.7.4 | Password hashing |
### Configuration
| Package | Version | Purpose |
|---------|---------|---------|
| `python-dotenv` | >=1.0.0 | `.env` file loading |
### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| `pytest` | >=8.0.0 | Test runner |
| `pytest-asyncio` | >=0.23.0 | Async test support |
### Backend Directory Structure
## Environment Variables
### Frontend (`frontend/.env`)
| Variable | Pattern | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (JWT) | Supabase anonymous/public key |
| `VITE_SUPABASE_EMAIL_REDIRECT_TO` | `http://localhost:5173/auth/callback` | Email confirmation callback URL |
| `VITE_APP_NAME` | `AI作文批改系统` | Display name |
| `VITE_APP_VERSION` | `1.0.0` | App version |
### Backend (`backend/.env`)
| Variable | Pattern | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (JWT, role=service_role) | Supabase service key (full access) |
| `SUPABASE_ANON_KEY` | `eyJ...` (JWT, role=anon) | Supabase anonymous key |
| `DASHSCOPE_API_KEY` | `sk-...` | Alibaba Cloud DashScope API key |
| `SECRET_KEY` | `sk_live_...` | JWT signing secret |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token expiry |
| `DEBUG` | `True` | Debug mode flag |
| `ALLOWED_ORIGINS` | `http://localhost:5173,...` | CORS allowed origins (comma-separated) |
| `API_V1_PREFIX` | `/api` | API route prefix |
| `DATABASE_URL` | `postgresql://...` | Direct Postgres connection string (optional) |
| `LOG_LEVEL` | `INFO` | Logging level |
## Dev Workflow
### Scripts
| Command | Working Directory | Description |
|---------|-------------------|-------------|
| `npm run dev` | `frontend/` | Start Vite dev server (port 5173) |
| `npm run build` | `frontend/` | TypeScript compile + Vite production build |
| `npm run lint` | `frontend/` | ESLint check |
| `npm run preview` | `frontend/` | Preview production build |
| `python main.py` | `backend/` | Start uvicorn (port 8000, auto-reload in debug) |
| `./start.sh` | project root | Startup guide script (checks config, prints instructions) |
| `./check-config.sh` | project root | Validates required env vars in both `.env` files |
### Dev Server Ports
| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Uvicorn) | 8000 | http://localhost:8000 |
| API Docs (Swagger) | 8000 | http://localhost:8000/docs |
| API Docs (ReDoc) | 8000 | http://localhost:8000/redoc |
## Database Schema
| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User profiles (extends `auth.users`) | FK → `auth.users(id)`, FK → `classes(id)` |
| `classes` | School classes (grade + name) | FK → `users(id)` as teacher |
| `assignments` | Essay writing tasks | FK → `users(id)`, FK → `classes(id)` |
| `submissions` | Student essay submissions | FK → `assignments(id)`, FK → `users(id)` |
| `grading_reports` | AI + teacher grading results | FK → `submissions(id)`, 1:1 |
| `mistake_records` | Student mistake tracking | FK → `users(id)` |
| `ai_conversations` | AI tutoring chat history | FK → `users(id)`, FK → `submissions(id)` |
## Notable Patterns
- **"Glue Programming" (胶水编程)**: Official SDKs over custom HTTP wrappers. OpenAI SDK for DashScope, Supabase SDK for all DB ops.
- **No ORM layer**: SQLAlchemy/Alembic are dependencies but unused. All DB access via Supabase Python SDK (`supabase_service.py`).
- **Dual Supabase access**: Frontend uses anon key (RLS-restricted), backend uses service key (full access).
- **In-memory captcha**: Captcha codes stored in Python dict, not Redis/DB. Comment notes Redis for production.
- **Global singleton services**: `dashscope_service` and `supabase_service` are module-level instances.
- **Ant Design locale**: Configured with `zhCN` locale for Chinese UI.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## 1. Project Structure
### Frontend (`frontend/`)
### Backend (`backend/`)
## 2. Naming Conventions
### Frontend (TypeScript/React)
| Element | Convention | Examples |
|---------|-----------|----------|
| Component files | `PascalCase.tsx` | `StudentLayout.tsx`, `AIChat.tsx` |
| CSS files | Co-located, same base name | `StudentLayout.css`, `Home.css` |
| Service files | `camelCase.ts` | `api.ts`, `supabase.ts` |
| Store files | `camelCase.ts` with `Store` suffix | `authStore.ts`, `studentStore.ts` |
| Component names | `PascalCase` | `const StudentLayout: React.FC` |
| Hook exports | `use` prefix + PascalCase | `useAuthStore`, `useStudentStore` |
| Interfaces | `PascalCase` | `AuthState`, `Assignment`, `GradingReport` |
| Variables/functions | `camelCase` | `handleSubmit`, `loadCaptcha`, `fetchAssignments` |
| Constants (inline) | `camelCase` | `errorTypeMap`, `scoreItems`, `statusMap` |
| CSS class names | `kebab-case` | `student-layout`, `hero-section`, `page-container` |
| Env variables | `VITE_` prefix + `SCREAMING_SNAKE_CASE` | `VITE_API_BASE_URL`, `VITE_SUPABASE_URL` |
### Backend (Python)
| Element | Convention | Examples |
|---------|-----------|----------|
| Module files | `snake_case.py` | `supabase_service.py`, `ai_chat.py` |
| Classes | `PascalCase` | `DashScopeService`, `SupabaseService`, `Settings` |
| Functions/methods | `snake_case` | `get_student_assignments`, `auto_grade_essay` |
| Variables | `snake_case` | `submission_data`, `captcha_store` |
| Constants | `SCREAMING_SNAKE_CASE` | `API_V1_PREFIX`, `SUPABASE_URL` |
| Route prefixes | `kebab-case` for multi-word | `/ai-chat`, `/student`, `/grading` |
| API tags | Chinese descriptive strings | `tags=["学生端"]`, `tags=["AI批改"]` |
| Pydantic models | `PascalCase` with action suffix | `SubmissionCreate`, `CaptchaResponse`, `MessageRequest` |
| Env variables | `SCREAMING_SNAKE_CASE` | `DASHSCOPE_API_KEY`, `SECRET_KEY` |
## 3. Component Patterns
### Functional Components with `React.FC`
### Lazy Loading with Suspense
### Layout Pattern (Outlet-based)
### Data Fetching Pattern
### Table Pattern with Ant Design
### Form Pattern with Ant Design
### Status Tag Mapping Pattern
## 4. State Management Patterns
### Zustand Store Structure
### Auth Store with Persist Middleware
### Loading/Error State Pattern
## 5. API Layer Patterns
### Frontend API Client (`frontend/src/services/api.ts`)
- Singleton `axios` instance with base URL from `import.meta.env.VITE_API_BASE_URL`
- Request interceptor: injects `Bearer` token from `localStorage`
- Response interceptor: 401 → clear token + redirect to `/login`
- Exported as a domain-grouped object literal (`api.student.*`, `api.teacher.*`, `api.grading.*`, etc.)
- All methods unwrap `.data` via `.then(res => res.data)`
- File uploads use `FormData` with explicit `multipart/form-data` header
### Backend Response Format
### Backend Route Organization
## 6. Error Handling Patterns
### Frontend
### Backend
## 7. Authentication & Authorization
### Auth Flow
### Token Management
- Access token stored in `localStorage` as `access_token`
- Injected via Axios request interceptor as `Bearer` token
- Cleared on logout and on 401 response
### Role-Based Access
## 8. Styling Patterns
- **Ant Design 5** as primary UI library with global `ConfigProvider` theme in `App.tsx`
- **CSS co-location**: each page has its own `.css` file next to the `.tsx` file
- **Plain CSS**: no CSS Modules, no Tailwind, no styled-components
- **Global CSS**: `index.css` (resets) + `App.css` (app-wide utilities)
- **Inline styles**: used freely for one-off layout adjustments (flexbox centering, spacing, etc.)
- **Theme tokens**: `colorPrimary: '#0066FF'`, `borderRadius: 8`, custom font stack
## 9. Backend Service Architecture
### Singleton Services
### Configuration with pydantic-settings
### Database Access
- No ORM — Supabase Python client used directly for all CRUD
- Queries built with chained `.table().select().eq().order().execute()` fluent API
- All DB methods are `async` (though using sync Supabase client internally)
## 10. Code Documentation
### Frontend
- JSDoc-style block comments at top of each file describing purpose (in Chinese):
- Inline comments for non-obvious logic, in Chinese
### Backend
- Python docstrings on modules and all endpoint functions:
- Section separators in service classes:
## 11. Known Technical Debt & Anti-Patterns
| Issue | Location | Description |
|-------|----------|-------------|
| Excessive `console.log` | `frontend/src/store/authStore.ts` | Debug emoji logs left in production code (~30 instances) |
| `any` type overuse | All stores, API methods | `data: any`, `error: any`, `response: any` throughout |
| No input validation on frontend | Multiple pages | Form rules only; no Zod/schema validation before API calls |
| Sync Supabase client marked `async` | `backend/external/supabase_service.py` | All methods are `async` but use synchronous Supabase SDK calls |
| `print()` for logging | All backend services | Should use `logging` module instead of `print()` |
| Hardcoded mock data | `backend/api/teacher.py` L61-66, `frontend/src/pages/teacher/Dashboard.tsx` | Stats and chart data are hardcoded, not from DB |
| In-memory captcha store | `backend/api/auth.py` | `captcha_store: Dict` won't survive restarts; should use Redis |
| Direct `localStorage` mutation | `frontend/src/store/authStore.ts`, `frontend/src/services/api.ts` | Token stored/cleared via raw `localStorage` calls |
| Interface duplication | Multiple files | `Assignment`, `Class` interfaces redefined in stores, pages, and service files |
| Missing type exports | `frontend/src/services/api.ts` | API methods typed as `<T = any>` — effectively untyped |
| No request cancellation | All frontend stores | No `AbortController` usage — risk of state updates on unmounted components |
| Mutable state updates | `backend/api/auth.py` L112 | `captcha_store[captcha_id]["used"] = True` — direct dict mutation |
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
## Architectural Pattern
```
```
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
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `users` | `id`, `email`, `name`, `role`, `class_id`, `avatar` | `class_id` -> `classes.id` |
| `classes` | `id`, `grade`, `name`, `teacher_id`, `student_count` | `teacher_id` -> `users.id` |
| `assignments` | `id`, `title`, `description`, `teacher_id`, `class_id`, `deadline`, `word_count_min`, `word_count_max` | `class_id` -> `classes.id` |
| `submissions` | `id`, `assignment_id`, `student_id`, `content`, `word_count`, `image_url`, `ocr_result`, `status`, `submitted_at` | `assignment_id` -> `assignments.id`, `student_id` -> `users.id` |
| `grading_reports` | `id`, `submission_id`, `ai_total_score`, `ai_scores` (JSON), `ai_errors` (JSON), `ai_comment`, `teacher_total_score`, `teacher_scores`, `teacher_comment`, `final_total_score`, `final_scores`, `final_comment`, `graded_at`, `reviewed_at`, `published_at` | `submission_id` -> `submissions.id` |
| `ai_conversations` | `id`, `student_id`, `submission_id`, `question`, `answer`, `created_at` | `student_id` -> `users.id`, `submission_id` -> `submissions.id` |
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
```
### 2. Student Views Assignments
```
```
### 3. Essay Submission (with optional OCR)
```
```
### 4. AI Grading
```
```
### 5. Teacher Review & Publish
```
```
### 6. Student Views Report
```
```
### 7. AI Tutoring Chat
```
```
### 8. Mistake Book
```
```
## Authentication Architecture
## AI Integration Architecture
- `qwen-plus`: Text LLM for essay grading and chat tutoring
- `qwen-vl-plus`: Vision-Language model for OCR handwriting recognition
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
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
