# Technology Stack

## Overview

K-12 AI Essay Grading System (AI作文批改系统) — monorepo with separate `frontend/` and `backend/` directories. No containerization, no CI/CD pipeline configured.

---

## Languages & Runtimes

| Layer | Language | Version / Target |
|-------|----------|-----------------|
| Frontend | TypeScript | ~5.9.3, target ES2022 |
| Backend | Python | >=3.10 (uses `str \| None` union syntax) |
| Database | SQL (PostgreSQL) | Supabase-managed Postgres |
| Shell | Bash | `start.sh`, `check-config.sh` |

---

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

```
frontend/src/
├── App.tsx                          # Root component, routing, Ant Design ConfigProvider
├── main.tsx                         # React 19 createRoot entry
├── components/
│   ├── EmailConfirmationBanner.tsx   # Email verification banner
│   ├── Loading.tsx                   # Loading spinner
│   ├── Auth/                        # (empty)
│   ├── Charts/                      # (empty)
│   ├── Editor/                      # (empty)
│   └── Layout/                      # (empty)
├── pages/
│   ├── Home.tsx, Login.tsx, Register.tsx, AuthCallback.tsx
│   ├── student/                     # 9 page components
│   └── teacher/                     # 6 page components
├── services/
│   ├── api.ts                       # Axios client + all API endpoint wrappers
│   └── supabase.ts                  # Supabase client + auth/user/class services
├── store/                           # Zustand stores (see above)
├── types/                           # (empty)
├── utils/                           # (empty)
└── assets/
```

---

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

```
backend/
├── main.py                    # FastAPI app entry, CORS, route registration
├── core/
│   └── config.py              # Settings class (pydantic-settings)
├── api/
│   ├── auth.py                # Captcha generation/verification
│   ├── student.py             # Student endpoints (assignments, submissions, OCR, stats)
│   ├── teacher.py             # Teacher endpoints (classes, assignments, stats)
│   ├── grading.py             # AI grading, teacher review, report publishing
│   ├── ai_chat.py             # AI conversation tutoring
│   └── mistakes.py            # Mistake book aggregation
├── external/
│   ├── dashscope_service.py   # Alibaba Cloud DashScope wrapper
│   └── supabase_service.py    # Supabase DB operations wrapper
├── schemas/
│   └── submission.py          # Pydantic models for submissions
├── models/                    # (empty — using Supabase SDK directly)
├── services/                  # (empty — logic in api/ and external/)
├── alembic/                   # (empty — migrations via Supabase SQL Editor)
├── tests/                     # (empty — no tests written)
└── requirements.txt
```

---

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

---

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

---

## Database Schema

7 tables managed via Supabase SQL Editor (see `docs/supabase-init.sql`):

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | User profiles (extends `auth.users`) | FK → `auth.users(id)`, FK → `classes(id)` |
| `classes` | School classes (grade + name) | FK → `users(id)` as teacher |
| `assignments` | Essay writing tasks | FK → `users(id)`, FK → `classes(id)` |
| `submissions` | Student essay submissions | FK → `assignments(id)`, FK → `users(id)` |
| `grading_reports` | AI + teacher grading results | FK → `submissions(id)`, 1:1 |
| `mistake_records` | Student mistake tracking | FK → `users(id)` |
| `ai_conversations` | AI tutoring chat history | FK → `users(id)`, FK → `submissions(id)` |

All tables have Row Level Security (RLS) enabled with role-based policies.

---

## Notable Patterns

- **"Glue Programming" (胶水编程)**: Official SDKs over custom HTTP wrappers. OpenAI SDK for DashScope, Supabase SDK for all DB ops.
- **No ORM layer**: SQLAlchemy/Alembic are dependencies but unused. All DB access via Supabase Python SDK (`supabase_service.py`).
- **Dual Supabase access**: Frontend uses anon key (RLS-restricted), backend uses service key (full access).
- **In-memory captcha**: Captcha codes stored in Python dict, not Redis/DB. Comment notes Redis for production.
- **Global singleton services**: `dashscope_service` and `supabase_service` are module-level instances.
- **Ant Design locale**: Configured with `zhCN` locale for Chinese UI.
