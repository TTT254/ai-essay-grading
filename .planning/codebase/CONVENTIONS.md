# Codebase Conventions

> Analyzed from actual source files in the ai-essay-grading project.
> Last updated: 2026-04-12

---

## 1. Project Structure

### Frontend (`frontend/`)

```
frontend/src/
├── App.tsx                    # Root component: routing, theme, auth guard
├── main.tsx                   # Entry point: StrictMode + createRoot
├── components/                # Shared/reusable components
│   ├── Loading.tsx
│   └── EmailConfirmationBanner.tsx
├── pages/                     # Route-level page components
│   ├── Home.tsx, Login.tsx, Register.tsx, AuthCallback.tsx
│   ├── student/               # Student role pages + layout
│   │   ├── StudentLayout.tsx
│   │   ├── Tasks.tsx, Submit.tsx, History.tsx
│   │   ├── Report.tsx, AIChat.tsx, Mistakes.tsx
│   │   ├── Profile.tsx, SelectClass.tsx
│   │   └── *.css              # Co-located CSS per page
│   └── teacher/               # Teacher role pages + layout
│       ├── TeacherLayout.tsx
│       ├── Classes.tsx, Assignments.tsx, Grading.tsx
│       ├── Dashboard.tsx, Profile.tsx
│       └── *.css
├── services/                  # API & external service clients
│   ├── api.ts                 # Axios wrapper + domain-grouped API methods
│   └── supabase.ts            # Supabase client + auth/user/class services
└── store/                     # Zustand state stores
    ├── authStore.ts           # Auth state with persist middleware
    ├── studentStore.ts        # Student domain state
    └── teacherStore.ts        # Teacher domain state
```

### Backend (`backend/`)

```
backend/
├── main.py                    # FastAPI app entry, CORS, router registration
├── requirements.txt           # pip dependencies
├── core/
│   └── config.py              # pydantic-settings based configuration
├── api/                       # Route modules (one file per domain)
│   ├── __init__.py
│   ├── auth.py                # Captcha generation/verification
│   ├── student.py             # Student endpoints
│   ├── teacher.py             # Teacher endpoints
│   ├── grading.py             # AI grading endpoints
│   ├── ai_chat.py             # AI conversation endpoints
│   └── mistakes.py            # Error notebook endpoints
├── external/                  # Third-party service wrappers
│   ├── __init__.py
│   ├── dashscope_service.py   # Alibaba DashScope (OpenAI-compatible)
│   └── supabase_service.py    # Supabase DB/Storage client
├── schemas/                   # Pydantic request/response models
│   ├── __init__.py
│   └── submission.py
├── models/                    # (empty — ORM not used)
├── services/                  # (empty — logic in api/ and external/)
├── tests/                     # (empty — zero tests)
└── alembic/                   # (empty — migrations not implemented)
```

---

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

---

## 3. Component Patterns

### Functional Components with `React.FC`

All components use `React.FC` typing with explicit generic params for props:

```tsx
// Standard page component — `frontend/src/pages/student/Tasks.tsx`
const Tasks: React.FC = () => { ... };
export default Tasks;

// Component with props — `frontend/src/App.tsx`
interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'teacher';
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => { ... };
```

### Lazy Loading with Suspense

All route-level pages are lazy-loaded in `frontend/src/App.tsx`:

```tsx
const StudentTasks = lazy(() => import('./pages/student/Tasks'));
// ...
<Suspense fallback={<Loading />}>
  <Routes>...</Routes>
</Suspense>
```

### Layout Pattern (Outlet-based)

Layout components (`StudentLayout.tsx`, `TeacherLayout.tsx`) use Ant Design `Layout` + React Router `Outlet`:

```tsx
// `frontend/src/pages/student/StudentLayout.tsx`
<Layout className="student-layout">
  <Header>...</Header>
  <Layout>
    <Sider><Menu ... /></Sider>
    <Layout>
      <Content>
        <EmailConfirmationBanner />
        <Outlet />    {/* Child routes render here */}
      </Content>
    </Layout>
  </Layout>
</Layout>
```

### Data Fetching Pattern

Pages fetch data in `useEffect` on mount, guarded by user ID:

```tsx
// Consistent pattern across Tasks.tsx, History.tsx, Classes.tsx, etc.
useEffect(() => {
  if (user?.id) {
    fetchAssignments(user.id);
  }
}, [user]);
```

### Table Pattern with Ant Design

List pages consistently use `<Table>` with typed columns and pagination:

```tsx
// `frontend/src/pages/student/Tasks.tsx`, History.tsx, Classes.tsx, etc.
<Table
  columns={columns}
  dataSource={assignments}
  rowKey="id"
  loading={isLoading}
  pagination={{
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 个任务`,
  }}
/>
```

### Form Pattern with Ant Design

Forms use `Form.useForm()` hook with `onFinish` handlers:

```tsx
// `frontend/src/pages/Login.tsx`, Register.tsx, Assignments.tsx
const [form] = Form.useForm();
<Form form={form} name="login" onFinish={handleSubmit} size="large">
  <Form.Item name="email" rules={[{ required: true, message: '...' }]}>
    <Input prefix={<UserOutlined />} placeholder="邮箱" />
  </Form.Item>
  ...
</Form>
```

### Status Tag Mapping Pattern

Status display uses inline `Record<string, { color, text }>` maps throughout:

```tsx
// `frontend/src/pages/student/Report.tsx`
const errorTypeMap: Record<string, { color: string; text: string }> = {
  typo: { color: 'red', text: '错别字' },
  grammar: { color: 'orange', text: '语法错误' },
  ...
};
```

---

## 4. State Management Patterns

### Zustand Store Structure

Three stores follow a uniform shape: state fields + action methods, all in one `create()` call:

```tsx
// `frontend/src/store/studentStore.ts` — representative pattern
interface StudentState {
  // Data
  assignments: Assignment[];
  submissions: Submission[];
  currentReport: GradingReport | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssignments: (studentId: string) => Promise<void>;
  submitEssay: (studentId: string, data: any) => Promise<boolean>;
  clearError: () => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  assignments: [],
  ...
  fetchAssignments: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.student.getAssignments(studentId);
      const data = response.data || response || [];
      set({ assignments: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message || '...', assignments: [], isLoading: false });
    }
  },
}));
```

### Auth Store with Persist Middleware

Only `authStore` uses `persist` middleware to survive page refreshes:

```tsx
// `frontend/src/store/authStore.ts`
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Loading/Error State Pattern

Every async store action follows the same tri-state pattern:

```
1. set({ isLoading: true, error: null })
2. try { ... set({ data, isLoading: false }) }
3. catch { set({ error: message, isLoading: false }) }
```

Return value convention: `void` for fetch actions, `boolean` for mutations, `T | null` for data-returning actions.

---

## 5. API Layer Patterns

### Frontend API Client (`frontend/src/services/api.ts`)

- Singleton `axios` instance with base URL from `import.meta.env.VITE_API_BASE_URL`
- Request interceptor: injects `Bearer` token from `localStorage`
- Response interceptor: 401 → clear token + redirect to `/login`
- Exported as a domain-grouped object literal (`api.student.*`, `api.teacher.*`, `api.grading.*`, etc.)
- All methods unwrap `.data` via `.then(res => res.data)`
- File uploads use `FormData` with explicit `multipart/form-data` header

### Backend Response Format

All endpoints return a consistent envelope:

```json
{ "success": true, "data": ... }
{ "success": false, "error": "..." }
```

Frontend defensively handles both wrapped and unwrapped formats:

```tsx
const data = response.data || response || [];
set({ items: Array.isArray(data) ? data : [] });
```

### Backend Route Organization

Each API module follows:

```python
# `backend/api/student.py`
router = APIRouter(prefix="/student", tags=["学生端"])

@router.get("/assignments")
async def get_student_assignments(student_id: str):
    ...
    return {"success": True, "data": assignments}
```

Routes are registered in `main.py` with a shared prefix:

```python
app.include_router(student.router, prefix=settings.API_V1_PREFIX)  # /api
```

---

## 6. Error Handling Patterns

### Frontend

**Store level** — catch-all with Chinese error messages and fallback defaults:

```tsx
catch (error: any) {
  set({
    error: error.message || '获取任务失败',
    assignments: [],  // Safe fallback
    isLoading: false,
  });
}
```

**Auth store** — dedicated `formatError` utility for structured Supabase errors:

```tsx
// `frontend/src/store/authStore.ts`
const formatError = (e: any): string => {
  const msg = e?.message || e?.error_description || e?.error || ...;
  const code = e?.code || e?.status || e?.name;
  if (msg && code) return `${msg} (code: ${code})`;
  ...
};
```

**Page level** — `message.error()` for user-facing toasts, `console.error()` for debugging:

```tsx
catch (err: any) {
  console.error('Login error:', err);
  message.error(err?.response?.data?.detail || err?.message || '登录失败');
}
```

### Backend

**Service layer** — catch `Exception`, `print()` error, return `None` or empty list:

```python
# `backend/external/supabase_service.py` — every method follows this
async def get_user_by_id(self, user_id: str) -> Optional[dict]:
    try:
        response = self.client.table("users").select("*").eq("id", user_id).execute()
        return response.data[0] if response.data else None
    except Exception as e:
        print(f"获取用户失败: {str(e)}")
        return None
```

**Route layer** — `HTTPException` for client errors, catch-all with 500 for unexpected:

```python
# `backend/api/grading.py`
if not submission:
    raise HTTPException(status_code=404, detail="提交不存在")

# `backend/api/ai_chat.py`
except Exception as e:
    raise HTTPException(status_code=500, detail=f"对话失败：{str(e)}")
```

**DashScope service** — graceful degradation for AI failures:

```python
# `backend/external/dashscope_service.py` grade_essay()
except json.JSONDecodeError:
    return {"total_score": 0, "scores": {...}, "errors": [], "comment": "AI批改失败...", "success": False}
```

---

## 7. Authentication & Authorization

### Auth Flow

1. **Registration**: Supabase Auth `signUp` → create business user in `users` table → auto-login attempt
2. **Login**: Supabase Auth `signInWithPassword` → fetch/create business user → store token in `localStorage`
3. **Session Check**: `checkAuth()` called on App mount → `supabase.auth.getUser()` → fetch business user
4. **Route Guard**: `ProtectedRoute` component checks `isAuthenticated` and optional `role` prop

### Token Management

- Access token stored in `localStorage` as `access_token`
- Injected via Axios request interceptor as `Bearer` token
- Cleared on logout and on 401 response

### Role-Based Access

Two roles: `student` and `teacher`, stored in `user.role`:

```tsx
// `frontend/src/App.tsx`
<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>
<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>
```

---

## 8. Styling Patterns

- **Ant Design 5** as primary UI library with global `ConfigProvider` theme in `App.tsx`
- **CSS co-location**: each page has its own `.css` file next to the `.tsx` file
- **Plain CSS**: no CSS Modules, no Tailwind, no styled-components
- **Global CSS**: `index.css` (resets) + `App.css` (app-wide utilities)
- **Inline styles**: used freely for one-off layout adjustments (flexbox centering, spacing, etc.)
- **Theme tokens**: `colorPrimary: '#0066FF'`, `borderRadius: 8`, custom font stack

---

## 9. Backend Service Architecture

### Singleton Services

External services instantiated as module-level globals:

```python
# `backend/external/dashscope_service.py`
dashscope_service = DashScopeService()

# `backend/external/supabase_service.py`
supabase_service = SupabaseService()
```

### Configuration with pydantic-settings

```python
# `backend/core/config.py`
class Settings(BaseSettings):
    SUPABASE_URL: str
    DASHSCOPE_API_KEY: str
    ...
    model_config = SettingsConfigDict(env_file=".env", ...)

settings = Settings()
```

### Database Access

- No ORM — Supabase Python client used directly for all CRUD
- Queries built with chained `.table().select().eq().order().execute()` fluent API
- All DB methods are `async` (though using sync Supabase client internally)

---

## 10. Code Documentation

### Frontend

- JSDoc-style block comments at top of each file describing purpose (in Chinese):

```tsx
/**
 * 主应用组件
 * 配置路由和全局状态
 */
```

- Inline comments for non-obvious logic, in Chinese

### Backend

- Python docstrings on modules and all endpoint functions:

```python
"""学生端API路由"""

@router.get("/assignments")
async def get_student_assignments(student_id: str):
    """获取学生的作文任务列表"""
```

- Section separators in service classes:

```python
# ============ 用户相关操作 ============
# ============ 班级相关操作 ============
```

---

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
