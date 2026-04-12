# Directory Structure

## Root Layout

```
ai-essay-grading/
├── backend/                    # Python FastAPI backend
├── frontend/                   # React + TypeScript frontend
├── docs/                       # Project documentation (21 files)
├── .claude/                    # Claude Code settings
├── .planning/                  # Planning documents (this directory)
├── .specstory/                 # Spec story files
├── .vscode/                    # VS Code settings
├── .git/                       # Git repository
├── .gitignore                  # Git ignore rules
├── .cursorindexingignore       # Cursor IDE indexing ignore
├── start.sh                    # One-click startup script (guide only)
├── check-config.sh             # Configuration validation script
├── README.md                   # Project readme
├── CONFIG_GUIDE.md             # Configuration guide
└── QUICK_START.md              # Quick start guide
```

## Backend Structure

```
backend/
├── main.py                     # FastAPI app entry point, CORS config, router registration
├── requirements.txt            # Python dependencies (FastAPI, Supabase, OpenAI, etc.)
├── .env                        # Environment variables (secrets - gitignored)
├── .env.example                # Environment variable template
│
├── core/
│   ├── __init__.py
│   └── config.py               # Settings class (pydantic-settings), reads .env
│
├── api/
│   ├── __init__.py
│   ├── auth.py                 # /api/auth/* - CAPTCHA generation & verification
│   ├── student.py              # /api/student/* - assignments, submissions, upload, OCR, history, stats
│   ├── teacher.py              # /api/teacher/* - classes, assignments, submissions, stats
│   ├── grading.py              # /api/grading/* - AI auto-grade, teacher review, publish
│   ├── ai_chat.py              # /api/ai-chat/* - AI tutoring conversations
│   └── mistakes.py             # /api/mistakes/* - mistake book aggregation
│
├── external/
│   ├── __init__.py
│   ├── supabase_service.py     # SupabaseService class - DB CRUD, file upload, stats queries
│   └── dashscope_service.py    # DashScopeService class - LLM chat, OCR, essay grading
│
└── schemas/
    ├── __init__.py
    └── submission.py            # Pydantic models: SubmissionCreate, SubmissionUpdate, SubmissionResponse
```

## Frontend Structure

```
frontend/
├── index.html                  # HTML entry point (loads src/main.tsx)
├── package.json                # NPM dependencies and scripts
├── package-lock.json           # Lockfile
├── vite.config.ts              # Vite configuration (React plugin only)
├── tsconfig.json               # TypeScript config (references app + node configs)
├── tsconfig.app.json           # App TypeScript config
├── tsconfig.node.json          # Node TypeScript config (for vite.config.ts)
├── eslint.config.js            # ESLint configuration
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment variable template
├── .gitignore                  # Frontend-specific gitignore
├── README.md                   # Frontend readme
├── test-supabase.html          # Standalone Supabase connection test page
│
├── public/
│   └── vite.svg                # Vite logo (favicon)
│
├── src/
│   ├── main.tsx                # React DOM entry - renders <App /> in StrictMode
│   ├── App.tsx                 # Root component - routing, theme, auth guard, lazy loading
│   ├── App.css                 # Global app styles
│   ├── index.css               # Global CSS reset/base styles
│   │
│   ├── assets/
│   │   └── react.svg           # React logo asset
│   │
│   ├── components/
│   │   ├── Loading.tsx          # Full-screen loading spinner (Suspense fallback)
│   │   └── EmailConfirmationBanner.tsx  # Warning banner for unconfirmed email
│   │
│   ├── services/
│   │   ├── api.ts              # Axios client + namespaced API methods (student, teacher, grading, auth, aiChat, mistakes)
│   │   └── supabase.ts         # Supabase client + auth/user/class service wrappers
│   │
│   ├── store/
│   │   ├── authStore.ts        # Zustand store - user session, login/register/logout, persistence
│   │   ├── studentStore.ts     # Zustand store - assignments, submissions, reports
│   │   └── teacherStore.ts     # Zustand store - classes, assignments, grading actions
│   │
│   └── pages/
│       ├── Home.tsx             # Landing page (hero + features + CTA)
│       ├── Home.css
│       ├── Login.tsx            # Login form (email + password + CAPTCHA)
│       ├── Login.css
│       ├── Register.tsx         # Registration form (role selection, class picker for students)
│       ├── Register.css
│       ├── AuthCallback.tsx     # Email confirmation callback handler
│       │
│       ├── student/
│       │   ├── StudentLayout.tsx    # Student shell: header + sidebar + <Outlet />
│       │   ├── StudentLayout.css
│       │   ├── SelectClass.tsx      # Post-registration class selection
│       │   ├── Tasks.tsx            # Assignment list table
│       │   ├── Submit.tsx           # Essay submission: image upload + OCR + rich text editor
│       │   ├── Submit.css
│       │   ├── History.tsx          # Submission history table
│       │   ├── Report.tsx           # Grading report view: scores + errors + comment + AI chat link
│       │   ├── Report.css
│       │   ├── AIChat.tsx           # AI tutoring chat interface
│       │   ├── AIChat.css
│       │   ├── Mistakes.tsx         # Mistake book: filterable error table with mastery tracking
│       │   └── Profile.tsx          # Student profile: info + stats + learning curve (ECharts)
│       │
│       └── teacher/
│           ├── TeacherLayout.tsx    # Teacher shell: header + sidebar + <Outlet />
│           ├── TeacherLayout.css
│           ├── Classes.tsx          # Class management: list + statistics cards
│           ├── Assignments.tsx      # Assignment management: list + create modal
│           ├── Grading.tsx          # 3-column grading workspace: submissions | essay | report+review
│           ├── Grading.css
│           ├── Dashboard.tsx        # Data analytics: stats cards + ECharts (score dist, error types, trends)
│           └── Profile.tsx          # Teacher profile: info + grading stats + managed classes table
│
└── node_modules/               # NPM packages (gitignored)
```

## Key File Locations

### Configuration

| Purpose | File |
|---------|------|
| Backend env vars | `backend/.env` |
| Backend env template | `backend/.env.example` |
| Frontend env vars | `frontend/.env` |
| Frontend env template | `frontend/.env.example` |
| Backend settings class | `backend/core/config.py` |
| Vite config | `frontend/vite.config.ts` |
| TypeScript config | `frontend/tsconfig.json` |
| Git ignore | `.gitignore` (root) + `frontend/.gitignore` |

### Entry Points

| Purpose | File |
|---------|------|
| Backend app creation | `backend/main.py` |
| Frontend HTML shell | `frontend/index.html` |
| React bootstrap | `frontend/src/main.tsx` |
| App root + routing | `frontend/src/App.tsx` |
| Startup guide script | `start.sh` |

### API Route Definitions

| Domain | File |
|--------|------|
| Authentication (CAPTCHA) | `backend/api/auth.py` |
| Student operations | `backend/api/student.py` |
| Teacher operations | `backend/api/teacher.py` |
| AI grading | `backend/api/grading.py` |
| AI tutoring chat | `backend/api/ai_chat.py` |
| Mistake book | `backend/api/mistakes.py` |

### External Service Integrations

| Service | File |
|---------|------|
| Supabase DB/Storage (backend) | `backend/external/supabase_service.py` |
| DashScope LLM/VLM (backend) | `backend/external/dashscope_service.py` |
| Supabase Auth/DB (frontend) | `frontend/src/services/supabase.ts` |
| Backend API client (frontend) | `frontend/src/services/api.ts` |

### State Management

| Store | File | Persisted |
|-------|------|-----------|
| Auth (user session) | `frontend/src/store/authStore.ts` | Yes (localStorage) |
| Student data | `frontend/src/store/studentStore.ts` | No |
| Teacher data | `frontend/src/store/teacherStore.ts` | No |

### Pages by User Role

| Role | Pages Directory |
|------|----------------|
| Public (unauthenticated) | `frontend/src/pages/` (Home, Login, Register, AuthCallback) |
| Student | `frontend/src/pages/student/` (8 page components) |
| Teacher | `frontend/src/pages/teacher/` (6 page components) |

### Shared Components

| Component | File | Used By |
|-----------|------|---------|
| Loading spinner | `frontend/src/components/Loading.tsx` | App.tsx (Suspense fallback) |
| Email confirmation banner | `frontend/src/components/EmailConfirmationBanner.tsx` | StudentLayout, TeacherLayout |

## Naming Conventions

### Files

| Layer | Convention | Examples |
|-------|-----------|----------|
| Backend Python modules | `snake_case.py` | `supabase_service.py`, `ai_chat.py` |
| Frontend pages | `PascalCase.tsx` | `StudentLayout.tsx`, `AIChat.tsx` |
| Frontend services | `camelCase.ts` | `api.ts`, `supabase.ts` |
| Frontend stores | `camelCase.ts` | `authStore.ts`, `studentStore.ts` |
| Frontend components | `PascalCase.tsx` | `Loading.tsx`, `EmailConfirmationBanner.tsx` |
| CSS files | Match component name | `Home.css`, `Grading.css`, `StudentLayout.css` |

### Code

| Pattern | Convention | Examples |
|---------|-----------|----------|
| React components | PascalCase functional components | `const Tasks: React.FC = () => {}` |
| Zustand stores | `use[Name]Store` | `useAuthStore`, `useStudentStore` |
| Backend routers | `router = APIRouter(prefix="/...", tags=["..."])` | `prefix="/student"`, `prefix="/grading"` |
| Backend service instances | Module-level singleton | `supabase_service = SupabaseService()` |
| API response format | `{ success: bool, data?: T, message?: string }` | `{"success": True, "data": [...]}` |
| Supabase table names | `snake_case` plural | `users`, `classes`, `grading_reports` |
| Environment variables | `UPPER_SNAKE_CASE` (backend), `VITE_UPPER_SNAKE_CASE` (frontend) | `SUPABASE_URL`, `VITE_SUPABASE_URL` |
| CSS class names | `kebab-case` | `student-layout`, `hero-section`, `chat-messages` |

### Directory Organization

- **Backend**: Organized by **architectural layer** (`api/`, `core/`, `external/`, `schemas/`)
- **Frontend**: Organized by **feature/role** (`pages/student/`, `pages/teacher/`) with shared concerns in `services/`, `store/`, `components/`
- **Co-located CSS**: Each page/layout component has its own `.css` file in the same directory
- **Lazy-loaded pages**: All page components use `React.lazy()` in `App.tsx` for code splitting

## Dependencies

### Backend (`backend/requirements.txt`)

| Category | Package | Version |
|----------|---------|---------|
| Core | fastapi | >=0.110.0 |
| Core | uvicorn[standard] | >=0.30.0 |
| Core | pydantic | >=2.9.0 |
| Core | pydantic-settings | >=2.6.0 |
| Database | supabase | >=2.0.0 |
| Database | sqlalchemy | >=2.0.0 (listed but unused) |
| Database | alembic | >=1.13.0 (listed but unused) |
| AI | openai | >=1.40.0 |
| HTTP | httpx | >=0.27.0 |
| Auth | python-jose[cryptography] | >=3.3.0 (listed but unused) |
| Auth | passlib[bcrypt] | >=1.7.4 (listed but unused) |
| Utils | python-dotenv | >=1.0.0 |
| Utils | pillow | >=10.0.0 |

### Frontend (`frontend/package.json`)

| Category | Package | Version |
|----------|---------|---------|
| Core | react | ^19.2.0 |
| Core | react-dom | ^19.2.0 |
| Routing | react-router-dom | ^7.1.3 |
| UI | antd | ^5.23.2 |
| State | zustand | ^5.0.2 |
| HTTP | axios | ^1.7.9 |
| Charts | echarts | ^5.5.2 |
| Charts | echarts-for-react | ^3.0.2 |
| Editor | react-quill | ^2.0.0 |
| BaaS | @supabase/supabase-js | ^2.49.3 |
| Utils | dayjs | ^1.11.13 |
| Build | vite | ^7.2.4 |
| Build | typescript | ~5.9.3 |
| Build | @vitejs/plugin-react | ^5.1.1 |

## File Count Summary

| Category | Count |
|----------|-------|
| Backend Python source files | 11 |
| Frontend TypeScript/TSX source files | 25 |
| CSS files | 10 |
| Config/env files | 8 |
| **Total source files** | **54** |
