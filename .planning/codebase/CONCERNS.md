# CONCERNS - AI Essay Grading System

Comprehensive technical debt, security, performance, UX, and missing feature analysis.

---

## 1. CRITICAL SECURITY ISSUES

### 1.1 Secrets Committed to Repository
**Severity: CRITICAL**

Real API keys and service credentials are checked into source files that will be committed to git:

- `backend/.env` (line 3): Supabase service key `eyJhbGci...` — full admin access
- `backend/.env` (line 4): Supabase anon key exposed
- `backend/.env` (line 7): DashScope API key `sk-***REDACTED***`
- `backend/.env` (line 10): JWT secret key `sk_live_***REDACTED***`
- `frontend/.env` (line 5-6): Supabase URL and anon key

The `.gitignore` lists `.env` but the project has no commits yet — if anyone runs `git add .` these secrets ship publicly. The `.env` files should be excluded from the repo entirely and all exposed keys rotated immediately.

### 1.2 Backend Uses Supabase Service Key (God Mode)
**Severity: CRITICAL**

`backend/external/supabase_service.py` (line 17):
```python
self.client: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_KEY  # Uses Service Key for full access
)
```
The service key bypasses all Row-Level Security (RLS) policies. Any endpoint vulnerability gives an attacker full database access. The backend should use the anon key + user JWT tokens for scoped access, reserving the service key only for admin operations behind proper auth middleware.

### 1.3 Zero Authentication on ALL API Endpoints
**Severity: CRITICAL**

No backend endpoint requires authentication. Every route accepts `student_id` or `teacher_id` as a **query parameter** that the caller provides — meaning any user can impersonate any other user:

- `backend/api/student.py` (line 15): `async def get_student_assignments(student_id: str)` — any caller passes any student_id
- `backend/api/student.py` (line 22): `async def create_submission(data: SubmissionCreate, student_id: str)` — submit as anyone
- `backend/api/teacher.py` (line 11): `async def get_teacher_classes(teacher_id: str)` — view any teacher's classes
- `backend/api/grading.py` (line 46): `async def teacher_review(report_id: str, teacher_scores: dict, teacher_comment: str)` — anyone can modify grades
- `backend/api/ai_chat.py` (line 20): `async def send_message(request: MessageRequest)` — read any student's submissions
- `backend/api/mistakes.py` (line 13): `async def get_mistakes(student_id: str, ...)` — view any student's errors

There is no JWT verification middleware, no `Depends()` for authentication, no role-based access control. The `python-jose` and `passlib` packages are in `requirements.txt` but never imported or used anywhere in the codebase.

### 1.4 Default JWT Secret Key
**Severity: HIGH**

`backend/core/config.py` (line 35):
```python
SECRET_KEY: str = "your-secret-key-here-change-in-production"
```
A hardcoded default secret key is used as a fallback. Even though the `.env` overrides it, this pattern is dangerous if the `.env` is missing or misconfigured.

### 1.5 Captcha Returns Answer to Client
**Severity: HIGH**

`backend/api/auth.py` (line 23): The `CaptchaResponse` model includes `captcha_code` — the server sends the correct answer in the response body:
```python
class CaptchaResponse(BaseModel):
    captcha_id: str
    captcha_code: str  # The answer is sent to the client!
```
The frontend displays this directly (`Login.tsx` line 256: `{captcha?.captcha_code || '加载中...'}`). This defeats the entire purpose of a CAPTCHA — a bot can read the answer from the JSON response and bypass it trivially.

### 1.6 No File Upload Validation
**Severity: HIGH**

`backend/api/student.py` (line 43-71): The image upload endpoint checks file extension but:
- No file size limit — users can upload arbitrarily large files, causing OOM or storage exhaustion
- No MIME type validation — only checks filename extension which can be spoofed
- No image content verification (e.g., magic bytes check)
- The uploaded file is read entirely into memory (`file_data = await file.read()`)

### 1.7 Error Messages Leak Internal Details
**Severity: MEDIUM**

Multiple endpoints return raw exception messages to the client:
- `backend/api/ai_chat.py` (line 71): `detail=f"对话失败：{str(e)}"` — leaks stack traces
- `backend/api/mistakes.py` (line 65): `detail=f"获取错题失败：{str(e)}"`
- `backend/api/teacher.py` (line 54): `return {"success": False, "error": str(e), "data": []}` — returns raw DB errors

### 1.8 In-Memory Captcha Store — No Cleanup on Scale
**Severity: MEDIUM**

`backend/api/auth.py` (line 16): `captcha_store: Dict[str, dict] = {}` — stored in process memory. In production with multiple workers/replicas, this fails entirely. The cleanup only runs when a new captcha is requested, so stale entries accumulate.

---

## 2. ARCHITECTURAL PROBLEMS

### 2.1 Fake Async — Sync SDK Calls Wrapped in `async def`
**Severity: HIGH**

Every method in `backend/external/supabase_service.py` is declared `async def` but calls the **synchronous** Supabase Python SDK. There is no `await` on the actual database operations:
```python
async def get_user_by_id(self, user_id: str) -> Optional[dict]:
    response = self.client.table("users").select("*").eq("id", user_id).execute()
    # ↑ This is synchronous — blocks the event loop
```
This blocks the FastAPI event loop on every database call, degrading performance under load. Should use `run_in_executor` or an async Supabase client.

Similarly, `backend/external/dashscope_service.py` (lines 49-56): The OpenAI SDK `create()` call is synchronous inside an `async def`, blocking the event loop during AI inference which can take 5-30 seconds.

### 2.2 Duplicate Data Access Patterns
**Severity: MEDIUM**

The frontend has **two independent data access layers**:
1. `frontend/src/services/api.ts` — Axios client calling the FastAPI backend
2. `frontend/src/services/supabase.ts` — Direct Supabase client for auth AND data queries

Some pages use the API client, others query Supabase directly. Examples:
- `frontend/src/pages/student/Profile.tsx` uses both `api.student.getStats()` AND `classService.getClassById()` directly
- `frontend/src/pages/teacher/Profile.tsx` uses both `api.teacher.getStats()` AND `classService.getClassesByTeacher()`
- Auth is entirely through Supabase client, but data reads mix both patterns

This creates inconsistency, makes authorization impossible to enforce centrally, and doubles the attack surface.

### 2.3 Duplicate Route Definitions
**Severity: MEDIUM**

`backend/api/teacher.py` has two routes on the same path with different parameter names:
- Line 10: `@router.get("/classes")` with `teacher_id: str`
- Line 28: `@router.get("/assignments")` with `class_id: str`

These won't conflict, but the `/classes` endpoint (line 13) ignores the `teacher_id` parameter entirely and calls `get_all_classes()` — returning ALL classes regardless of the teacher.

### 2.4 No Database Migration System Active
**Severity: MEDIUM**

`requirements.txt` includes `sqlalchemy>=2.0.0` and `alembic>=1.13.0`, but neither is used anywhere in the codebase. All database operations use the Supabase SDK directly. The `docs/` folder contains 10+ raw SQL files for ad-hoc schema changes, suggesting migrations are done manually via SQL console. This is fragile and unreproducible.

### 2.5 No Pagination on Backend Queries
**Severity: MEDIUM**

None of the Supabase queries in `backend/external/supabase_service.py` use `.range()` or `.limit()`. For example:
- `get_student_submissions()` (line 141): Returns ALL submissions for a student
- `get_student_reports()` (line 195): Returns ALL reports
- `get_all_classes()` (line 42): Returns ALL classes

The frontend passes `limit` and `offset` parameters (e.g., `api.ts` line 92-93) but the backend ignores them entirely.

---

## 3. DATA INTEGRITY & LOGIC BUGS

### 3.1 Hardcoded Fake Statistics
**Severity: HIGH**

`backend/api/teacher.py` (lines 57-67): The class stats endpoint returns hardcoded mock data, not real data:
```python
stats = {
    "total_assignments": 10,
    "total_submissions": 45,
    "graded_count": 38,
    "average_score": 78.5,
}
```

`frontend/src/pages/teacher/Dashboard.tsx` (lines 89-98, 148-153, 192-193): All three ECharts visualizations use hardcoded data arrays instead of real data:
```javascript
data: [2, 5, 12, 18, 8],          // Score distribution
data: [72, 75, 78, 76, 80, 82],   // Trend chart
{ value: 35, name: '错别字' },     // Error type pie chart
```
The teacher dashboard is entirely fake. The date range picker and class selector have no effect on the displayed data.

### 3.2 Field Name Inconsistency Across Frontend
**Severity: MEDIUM**

Multiple components use different field names for the same database column:
- `frontend/src/pages/student/SelectClass.tsx` (line 17): `class_name: string`
- `frontend/src/pages/Register.tsx` (line 25): `name: string`
- `frontend/src/pages/teacher/Assignments.tsx` (line 179): `{cls.class_name}` — will render `undefined`
- `frontend/src/pages/teacher/Dashboard.tsx` (line 227): `{cls.class_name}` — will render `undefined`

The database column appears to be `name`, but some components reference `class_name`. This causes silent rendering failures.

### 3.3 Score Dimensions Mismatch
**Severity: MEDIUM**

The AI grading prompt in `backend/external/dashscope_service.py` (lines 162-165) defines:
```
content: 35, structure: 25, language: 25, writing: 15  (total = 100)
```

But `frontend/src/pages/student/Report.tsx` (lines 38-42) uses different totals:
```javascript
{ label: '内容', key: 'content', total: 40 },
{ label: '结构', key: 'structure', total: 30 },
{ label: '语言', key: 'language', total: 20 },
{ label: '书写', key: 'writing', total: 10 },  // total = 100
```
Content is 35 vs 40, structure is 25 vs 30, etc. Progress bars will show incorrect percentages.

### 3.4 Word Count Calculation Counts HTML Tags
**Severity: LOW**

`backend/api/student.py` (line 28): `"word_count": len(data.content)` — counts raw characters including HTML tags from the ReactQuill editor. The frontend strips tags for display (`content.replace(/<[^>]*>/g, '')`) but the stored word count is inflated.

### 3.5 AI Chat Response Field Mismatch
**Severity: MEDIUM**

`backend/api/ai_chat.py` (line 52): `ai_response = await dashscope_service.chat_completion(messages)` — this returns a dict with key `content`. But line 58: `"answer": ai_response` stores the entire dict. And on the frontend `AIChat.tsx` (line 79): `content: response.content` — tries to read `.content` from the API response, but the backend returns `{"message": ai_response}` where `ai_response` is already the dict. The response shape is ambiguous and likely broken.

### 3.6 Teacher Review Endpoint Doesn't Accept Body Properly
**Severity: HIGH**

`backend/api/grading.py` (line 47):
```python
async def teacher_review(report_id: str, teacher_scores: dict, teacher_comment: str):
```
`teacher_scores` and `teacher_comment` are declared as **query parameters** (not a request body model). FastAPI will look for them in the URL query string, but the frontend sends them in a JSON body (`api.ts` line 143-146). This endpoint will fail with 422 validation errors.

---

## 4. PERFORMANCE CONCERNS

### 4.1 Blocking Event Loop on AI Calls
**Severity: HIGH**

See 2.1. The DashScope `chat_completion` call is synchronous and can take 5-30 seconds for essay grading. During this time, FastAPI cannot serve any other request on that worker.

### 4.2 No Caching Anywhere
**Severity: MEDIUM**

- No Redis/in-memory caching for frequently accessed data (class lists, assignments)
- No HTTP caching headers
- No memoization in frontend stores — every page mount triggers a fresh API call
- `REDIS_URL` is commented out in the `.env` with no implementation

### 4.3 ECharts Imported Fully
**Severity: LOW**

`frontend/src/pages/student/Profile.tsx` and `frontend/src/pages/teacher/Dashboard.tsx` both `import * as echarts from 'echarts'` — this imports the entire ECharts library (~800KB minified). Should use tree-shakeable imports:
```javascript
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
```

### 4.4 No Loading/Error Boundary Architecture
**Severity: MEDIUM**

Multiple useEffect hooks fire network requests without deduplication. React Strict Mode in development will double-fire these. There are no React Error Boundaries to catch rendering crashes.

### 4.5 Submission Grading Not Background
**Severity: MEDIUM**

`backend/api/grading.py` (line 13): The `auto_grade_essay` endpoint accepts a `BackgroundTasks` parameter but **doesn't use it** — the AI grading runs synchronously in the request handler, making the client wait 5-30 seconds for a response. The `BackgroundTasks` import is dead code.

---

## 5. UI/UX ISSUES

### 5.1 No Mobile Responsiveness
**Severity: HIGH**

The layout uses fixed-width `Sider` (200px) with no collapse/responsive behavior:
- `frontend/src/pages/student/StudentLayout.tsx` (line 86): `<Sider width={200}>`
- `frontend/src/pages/teacher/TeacherLayout.tsx` (line 86): `<Sider width={200}>`

The teacher grading page (`Grading.tsx`) uses a three-column CSS layout that will break on tablets/phones. No media queries exist for responsive adaptation. K-12 parents/students commonly use mobile devices.

### 5.2 No Empty States or Onboarding
**Severity: HIGH**

When a new teacher logs in, they see an empty class list with no guidance. When a new student has no assignments, they see an empty table. There are no:
- Onboarding wizards
- Empty state illustrations
- Getting-started guides
- Placeholder content

### 5.3 No Feedback During Long AI Operations
**Severity: MEDIUM**

When a student submits an essay (Submit.tsx line 89): `message.success('提交成功！正在进行AI批改...')` — but no AI grading is actually triggered on submit. The grading only happens when a teacher manually clicks "启动AI批改" on the Grading page. The user message is misleading.

### 5.4 No Confirmation Dialogs for Destructive Actions
**Severity: MEDIUM**

- Publishing a grading report to students has no confirmation dialog
- AI auto-grading has no confirmation
- No "are you sure?" for overwriting teacher scores

### 5.5 Poor Navigation Feedback
**Severity: MEDIUM**

The sidebar menu `selectedKeys` uses `location.pathname` for matching, but nested routes like `/student/submit/123` or `/student/report/456` won't highlight any menu item because the path doesn't exactly match any menu key.

### 5.6 No Data Export Capability
**Severity: MEDIUM**

Teachers cannot export grades, reports, or student performance data to CSV/Excel. This is a standard requirement for education systems.

### 5.7 Duplicate Profile Pages
**Severity: LOW**

`frontend/src/pages/student/Profile.tsx` (468 lines) and `frontend/src/pages/teacher/Profile.tsx` (441 lines) are ~80% identical — same name change modal, same password change modal, same layout structure. No shared components extracted.

### 5.8 Inconsistent Loading States
**Severity: LOW**

Some pages use the store's `isLoading` (Tasks.tsx), others manage local `loading` state (Mistakes.tsx, Grading.tsx). The global `Loading` component fills the entire viewport, causing layout flash when lazy-loading pages.

---

## 6. MISSING FEATURES

### 6.1 No Admin Panel
There is no system administrator interface for managing users, classes, or system configuration.

### 6.2 No Batch Grading
Teachers must grade essays one by one. There is no "grade all" or batch AI grading functionality.

### 6.3 No Notification System
No in-app notifications, no email notifications when:
- An assignment is created
- A student submits work
- AI grading is complete
- A teacher publishes a report

### 6.4 No Password Recovery Flow
`frontend/src/services/supabase.ts` has `resetPassword` (line 62) defined but no UI page for password reset. Users who forget their password have no way to recover.

### 6.5 No Assignment Editing/Deletion
`backend/api/teacher.py`: Only `POST /assignments` (create) and `GET /assignments` (list) exist. Teachers cannot edit or delete assignments after creation.

### 6.6 No Submission Editing/Resubmission
Students cannot edit or resubmit work. Once submitted, there is no way to modify or retract it.

### 6.7 No Class/Student Management for Teachers
Teachers cannot:
- Create new classes
- Add/remove students from classes
- View individual student profiles
- Track individual student progress

### 6.8 No Essay Draft Auto-Save
The rich text editor in `frontend/src/pages/student/Submit.tsx` has no auto-save or draft recovery. If the page is accidentally closed, all work is lost.

### 6.9 No Grading Rubric Customization
The AI grading prompt has hardcoded scoring dimensions and weights. Teachers cannot customize rubrics per assignment or grade level.

### 6.10 No Chinese Character-Specific Features
For a Chinese essay grading system, there are no:
- Pinyin input support
- Character stroke order checking
- Idiom/classical Chinese reference
- Grade-appropriate vocabulary validation

### 6.11 Mistake Book Feature Is a Stub
`backend/api/mistakes.py` (line 69-73): The "mark as mastered" endpoint is a no-op stub:
```python
async def mark_mistake_mastered(mistake_id: str):
    # 目前返回成功即可
    return {"success": True, "message": "已标记为掌握"}
```
The mistake book aggregates errors from reports on each request (expensive) rather than materializing them in a dedicated table.

---

## 7. CODE QUALITY

### 7.1 Excessive Console Logging
**Severity: MEDIUM**

`frontend/src/store/authStore.ts`: Contains 30+ `console.log` statements with emoji prefixes (`🔵`, `🔴`, `✅`, `🟡`, `📧`) throughout the auth flow. These should be stripped for production.

`backend/external/supabase_service.py` and `dashscope_service.py`: Every error handler uses `print()` instead of a proper logging framework, despite `LOG_LEVEL` being configured.

### 7.2 `any` Type Usage Throughout Frontend
**Severity: MEDIUM**

Heavy use of `any` in TypeScript code:
- `frontend/src/store/teacherStore.ts` (line 69): `createAssignment: async (data: any)`
- `frontend/src/store/studentStore.ts` (line 81): `submitEssay: async (studentId: string, data: any)`
- `frontend/src/services/supabase.ts` (line 139): `updateUser: async (userId: string, updates: any)`
- `frontend/src/pages/teacher/Grading.tsx` (line 44): `const [currentReport, setCurrentReport] = useState<any>(null)`
- `frontend/src/pages/teacher/Dashboard.tsx` (line 26): `const [stats, setStats] = useState<any>({...})`

This eliminates TypeScript's type safety benefits.

### 7.3 Dead Code and Unused Dependencies
**Severity: LOW**

- `requirements.txt`: `sqlalchemy`, `alembic`, `pillow`, `python-jose`, `passlib` are listed but never imported
- `frontend/package.json`: `echarts-for-react` is installed but only raw `echarts` is used
- `backend/api/auth.py`: Imports `random`, `string`, `Depends` — `Depends` is never used
- `frontend/src/App.css`, `frontend/src/assets/react.svg` — default Vite scaffolding remains
- `frontend/test-supabase.html` — debug test file

### 7.4 No Test Infrastructure
**Severity: HIGH**

Zero tests exist:
- No `__tests__/` directories
- No `*.test.ts` or `*.spec.ts` files
- No `tests/` directory in backend
- `pytest` is in `requirements.txt` but never configured
- No test scripts in `package.json`
- No CI/CD pipeline

### 7.5 Mutable State Patterns in Stores
**Severity: LOW**

Zustand stores use direct `set()` calls which is the library's intended pattern, but several places mutate data before setting:
- `backend/api/auth.py` (line 112): `captcha_store[captcha_id]["used"] = True` — direct dict mutation
- `backend/api/mistakes.py` (lines 35-52): In-place mutation of `error_count` dict

### 7.6 Inconsistent Error Handling Pattern
**Severity: MEDIUM**

Backend has three different error patterns:
1. Raise `HTTPException` (student.py, grading.py)
2. Return `{"success": False, "error": str(e)}` (teacher.py line 54)
3. Return empty list/None and swallow the error (supabase_service.py throughout)

The frontend similarly has inconsistent handling — some stores set `error`, others show `message.error()`, some do both.

---

## 8. DEVOPS & DEPLOYMENT

### 8.1 No Dockerfile or Docker Compose
No containerization configuration exists. The `start.sh` script runs both frontend and backend processes locally.

### 8.2 No Production Configuration
- `backend/core/config.py` (line 13): `DEBUG: bool = True` is the default
- CORS allows `localhost` origins only
- No HTTPS configuration
- No rate limiting
- No request logging middleware

### 8.3 `__pycache__` Files in Repository
Multiple `__pycache__/` directories with `.pyc` files exist in the source tree despite `.gitignore` listing `__pycache__/`. These were likely created before the gitignore was in place.

---

## 9. PRIORITY MATRIX

| Priority | Issue | Impact |
|----------|-------|--------|
| P0 | API keys in `.env` files (#1.1) | Data breach risk |
| P0 | Zero auth on all endpoints (#1.3) | Any user can impersonate anyone |
| P0 | Service key bypasses RLS (#1.2) | Full database access on any exploit |
| P1 | Captcha sends answer to client (#1.5) | Bot bypass trivial |
| P1 | Teacher review endpoint broken (#3.6) | Core feature non-functional |
| P1 | Blocking event loop (#2.1, #4.1) | System unresponsive under load |
| P1 | Fake dashboard data (#3.1) | Teacher analytics entirely fake |
| P1 | Zero tests (#7.4) | No regression safety net |
| P2 | No mobile responsiveness (#5.1) | Unusable on phones |
| P2 | No onboarding (#5.2) | Users don't know what to do |
| P2 | Score dimension mismatch (#3.3) | Inaccurate grade display |
| P2 | Field name inconsistency (#3.2) | Silent render failures |
| P2 | No pagination (#2.5) | Performance degrades with data |
| P3 | Missing features (#6.1-6.11) | Incomplete product |
| P3 | Code quality (#7.1-7.6) | Maintenance burden |
| P3 | DevOps gaps (#8.1-8.3) | Deployment friction |
