# Testing Strategy

> Current state: **ZERO tests** across both frontend and backend.
> This document defines framework choices, structure, and patterns for building the test suite from scratch.
> Last updated: 2026-04-12

---

## 1. Current State Assessment

### What Exists

| Area | Status |
|------|--------|
| `backend/tests/` | Empty directory |
| `backend/requirements.txt` | Lists `pytest>=8.0.0` and `pytest-asyncio>=0.23.0` (not installed) |
| `frontend/package.json` | No test runner, no test dependencies, no `test` script |
| CI/CD pipeline | None configured |
| Coverage tooling | None |

### What Needs Testing

**Frontend (18 source files)**:
- 3 Zustand stores: `authStore.ts`, `studentStore.ts`, `teacherStore.ts`
- 2 service modules: `api.ts`, `supabase.ts`
- 2 shared components: `Loading.tsx`, `EmailConfirmationBanner.tsx`
- 1 routing/auth guard: `ProtectedRoute` in `App.tsx`
- 10 page components across student and teacher domains

**Backend (10 source files)**:
- 6 API route modules: `auth.py`, `student.py`, `teacher.py`, `grading.py`, `ai_chat.py`, `mistakes.py`
- 2 external services: `dashscope_service.py`, `supabase_service.py`
- 1 config module: `config.py`
- 1 schema module: `submission.py`

---

## 2. Framework Selection

### Frontend

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **Vitest** | Unit + integration test runner | Native Vite integration, same config, fast HMR |
| **React Testing Library** | Component testing | Standard for React 19, focuses on user behavior |
| **MSW (Mock Service Worker)** | API mocking | Intercepts at network level, works with Axios |
| **@testing-library/user-event** | User interaction simulation | Realistic event firing |
| **vitest-coverage-v8** | Coverage reporting | V8-based, accurate, fast |

#### Installation

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom msw vitest-coverage-v8
```

#### Configuration

**`frontend/vite.config.ts`** — add test block:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/**/*.css'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
})
```

**`frontend/package.json`** — add scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Backend

| Tool | Purpose | Rationale |
|------|---------|-----------|
| **pytest** | Test runner + framework | Already in `requirements.txt`, Python standard |
| **pytest-asyncio** | Async test support | Already in `requirements.txt`, needed for async endpoints |
| **httpx** | Test client for FastAPI | Already a dependency, `TestClient` replacement for async |
| **pytest-cov** | Coverage reporting | Standard pytest coverage plugin |
| **unittest.mock / pytest-mock** | Mocking | Mock external services (Supabase, DashScope) |

#### Installation

```bash
cd backend
pip install pytest pytest-asyncio pytest-cov pytest-mock httpx
```

#### Configuration

**`backend/pyproject.toml`** (create new):

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]

[tool.coverage.run]
source = ["api", "core", "external", "schemas"]
omit = ["tests/*", "*/__pycache__/*"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

---

## 3. Test Directory Structure

### Frontend

```
frontend/src/
├── test/
│   ├── setup.ts                      # Global test setup (jsdom, cleanup, MSW)
│   ├── mocks/
│   │   ├── handlers.ts               # MSW request handlers
│   │   ├── server.ts                 # MSW server instance
│   │   ├── supabase.ts               # Mock Supabase client
│   │   └── fixtures/                 # Reusable test data
│   │       ├── users.ts
│   │       ├── assignments.ts
│   │       ├── submissions.ts
│   │       └── reports.ts
│   └── utils/
│       └── render.tsx                # Custom render with providers
├── store/
│   ├── __tests__/
│   │   ├── authStore.test.ts
│   │   ├── studentStore.test.ts
│   │   └── teacherStore.test.ts
├── services/
│   ├── __tests__/
│   │   ├── api.test.ts
│   │   └── supabase.test.ts
├── components/
│   ├── __tests__/
│   │   ├── Loading.test.tsx
│   │   └── EmailConfirmationBanner.test.tsx
└── pages/
    ├── __tests__/
    │   ├── Home.test.tsx
    │   ├── Login.test.tsx
    │   └── Register.test.tsx
    ├── student/__tests__/
    │   ├── Tasks.test.tsx
    │   ├── Submit.test.tsx
    │   ├── History.test.tsx
    │   ├── Report.test.tsx
    │   └── AIChat.test.tsx
    └── teacher/__tests__/
        ├── Classes.test.tsx
        ├── Assignments.test.tsx
        ├── Grading.test.tsx
        └── Dashboard.test.tsx
```

### Backend

```
backend/tests/
├── conftest.py                       # Shared fixtures (app, client, mocks)
├── fixtures/
│   ├── users.py
│   ├── assignments.py
│   ├── submissions.py
│   └── reports.py
├── mocks/
│   ├── mock_supabase.py              # Mock SupabaseService
│   └── mock_dashscope.py             # Mock DashScopeService
├── api/
│   ├── test_auth.py
│   ├── test_student.py
│   ├── test_teacher.py
│   ├── test_grading.py
│   ├── test_ai_chat.py
│   └── test_mistakes.py
├── external/
│   ├── test_supabase_service.py
│   └── test_dashscope_service.py
├── schemas/
│   └── test_submission.py
└── core/
    └── test_config.py
```

---

## 4. Mocking Strategy

### Frontend — What to Mock

| Dependency | Mock Approach | Rationale |
|------------|--------------|-----------|
| Axios HTTP calls | **MSW handlers** | Intercept at network level; test real Axios config |
| Supabase client | **Module mock** via `vi.mock('../services/supabase')` | Auth + DB calls are Supabase SDK; can't intercept at HTTP |
| `react-router-dom` navigation | **MemoryRouter** wrapper | Test navigation without real browser history |
| `localStorage` | **vi.stubGlobal** or jsdom default | Token storage in `api.ts` interceptor |
| `echarts` | **Module mock** returning stub | Avoid canvas rendering in jsdom |
| `react-quill` | **Module mock** returning textarea | Rich text editor not testable in jsdom |
| `import.meta.env` | **Vitest `env` config** or `vi.stubEnv()` | Environment variable injection |

#### MSW Handler Example

```ts
// frontend/src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('http://localhost:8000/api/student/assignments', ({ request }) => {
    const url = new URL(request.url)
    const studentId = url.searchParams.get('student_id')
    return HttpResponse.json({
      success: true,
      data: [
        { id: '1', title: '我的家乡', deadline: '2026-05-01', status: 'active' },
      ],
    })
  }),

  http.post('http://localhost:8000/api/student/submissions', () => {
    return HttpResponse.json({ success: true, data: { id: 'sub-1' } })
  }),

  http.get('http://localhost:8000/api/auth/captcha', () => {
    return HttpResponse.json({
      captcha_id: 'test-id',
      captcha_code: 'ABC123',
      expires_at: '2026-04-12T23:59:59',
    })
  }),
]
```

#### Custom Render with Providers

```tsx
// frontend/src/test/utils/render.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import type { ReactElement } from 'react'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ConfigProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </ConfigProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}
```

### Backend — What to Mock

| Dependency | Mock Approach | Rationale |
|------------|--------------|-----------|
| `supabase_service` | **`pytest-mock` `mocker.patch`** on `external.supabase_service.supabase_service` | All DB access goes through this singleton |
| `dashscope_service` | **`pytest-mock` `mocker.patch`** on `external.dashscope_service.dashscope_service` | All AI calls go through this singleton |
| Environment variables | **`monkeypatch.setenv`** or `.env.test` file | Test-specific config values |
| `datetime.utcnow()` | **`freezegun`** or `monkeypatch` | Deterministic timestamps |

#### Backend conftest.py

```python
# backend/tests/conftest.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def mock_supabase(mocker):
    """Mock the global supabase_service singleton."""
    mock = MagicMock()
    # Make all methods return AsyncMock
    for attr_name in dir(mock):
        attr = getattr(mock, attr_name)
        if callable(attr) and not attr_name.startswith('_'):
            setattr(mock, attr_name, AsyncMock())
    mocker.patch('api.student.supabase_service', mock)
    mocker.patch('api.teacher.supabase_service', mock)
    mocker.patch('api.grading.supabase_service', mock)
    mocker.patch('api.ai_chat.supabase_service', mock)
    mocker.patch('api.mistakes.supabase_service', mock)
    return mock


@pytest.fixture
def mock_dashscope(mocker):
    """Mock the global dashscope_service singleton."""
    mock = MagicMock()
    mock.grade_essay = AsyncMock()
    mock.ocr_recognize = AsyncMock()
    mock.chat_completion = AsyncMock()
    mocker.patch('api.grading.dashscope_service', mock)
    mocker.patch('api.student.dashscope_service', mock)
    mocker.patch('api.ai_chat.dashscope_service', mock)
    return mock
```

---

## 5. Test Patterns & Examples

### 5.1 Zustand Store Tests

Stores are tested by invoking actions and asserting state changes. Reset store between tests.

```ts
// frontend/src/store/__tests__/studentStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStudentStore } from '../studentStore'

// Mock the api module
vi.mock('../../services/api', () => ({
  default: {
    student: {
      getAssignments: vi.fn(),
      submitEssay: vi.fn(),
      getHistory: vi.fn(),
      getReport: vi.fn(),
      uploadImage: vi.fn(),
      ocrRecognize: vi.fn(),
    },
  },
}))

import api from '../../services/api'

describe('studentStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useStudentStore.setState({
      assignments: [],
      submissions: [],
      currentReport: null,
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('fetchAssignments', () => {
    it('should set assignments on success', async () => {
      const mockData = [{ id: '1', title: 'Test', deadline: '2026-05-01', status: 'active' }]
      vi.mocked(api.student.getAssignments).mockResolvedValue({ data: mockData })

      await useStudentStore.getState().fetchAssignments('student-1')

      const state = useStudentStore.getState()
      expect(state.assignments).toEqual(mockData)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set error and empty array on failure', async () => {
      vi.mocked(api.student.getAssignments).mockRejectedValue(new Error('Network error'))

      await useStudentStore.getState().fetchAssignments('student-1')

      const state = useStudentStore.getState()
      expect(state.assignments).toEqual([])
      expect(state.error).toBe('Network error')
      expect(state.isLoading).toBe(false)
    })

    it('should handle non-array response gracefully', async () => {
      vi.mocked(api.student.getAssignments).mockResolvedValue({ data: null })

      await useStudentStore.getState().fetchAssignments('student-1')

      expect(useStudentStore.getState().assignments).toEqual([])
    })
  })

  describe('submitEssay', () => {
    it('should return true on success', async () => {
      vi.mocked(api.student.submitEssay).mockResolvedValue({ success: true })

      const result = await useStudentStore.getState().submitEssay('s1', {
        assignment_id: 'a1',
        content: 'Test essay content',
      })

      expect(result).toBe(true)
      expect(useStudentStore.getState().isLoading).toBe(false)
    })

    it('should return false and set error on failure', async () => {
      vi.mocked(api.student.submitEssay).mockRejectedValue(new Error('提交失败'))

      const result = await useStudentStore.getState().submitEssay('s1', {
        assignment_id: 'a1',
        content: 'Test',
      })

      expect(result).toBe(false)
      expect(useStudentStore.getState().error).toBe('提交失败')
    })
  })
})
```

### 5.2 API Service Tests

```ts
// frontend/src/services/__tests__/api.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { api } from '../api'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('api.student', () => {
  it('getAssignments sends student_id as query param', async () => {
    server.use(
      http.get('http://localhost:8000/api/student/assignments', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('student_id')).toBe('test-id')
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    const result = await api.student.getAssignments('test-id')
    expect(result.success).toBe(true)
  })

  it('injects auth token from localStorage', async () => {
    localStorage.setItem('access_token', 'test-token')

    server.use(
      http.get('http://localhost:8000/api/student/assignments', ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer test-token')
        return HttpResponse.json({ success: true, data: [] })
      })
    )

    await api.student.getAssignments('id')
    localStorage.removeItem('access_token')
  })
})
```

### 5.3 Component Tests

```tsx
// frontend/src/components/__tests__/EmailConfirmationBanner.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils/render'
import EmailConfirmationBanner from '../EmailConfirmationBanner'
import { useAuthStore } from '../../store/authStore'

describe('EmailConfirmationBanner', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        role: 'student',
        email_confirmed_at: null,  // Unconfirmed
      },
      isAuthenticated: true,
      resendConfirmationEmail: vi.fn().mockResolvedValue(true),
    })
  })

  it('shows banner when email is unconfirmed', () => {
    renderWithProviders(<EmailConfirmationBanner />)
    expect(screen.getByText(/邮箱未确认/)).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('hides banner when email is confirmed', () => {
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, email_confirmed_at: '2026-01-01' },
    })
    renderWithProviders(<EmailConfirmationBanner />)
    expect(screen.queryByText(/邮箱未确认/)).not.toBeInTheDocument()
  })

  it('hides banner when dismissed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<EmailConfirmationBanner />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(screen.queryByText(/邮箱未确认/)).not.toBeInTheDocument()
  })
})
```

### 5.4 Backend API Tests

```python
# backend/tests/api/test_auth.py
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestCaptcha:
    def test_get_captcha_returns_valid_response(self, client):
        response = client.get("/api/auth/captcha")
        assert response.status_code == 200

        data = response.json()
        assert "captcha_id" in data
        assert "captcha_code" in data
        assert "expires_at" in data
        assert len(data["captcha_code"]) == 6

    def test_verify_captcha_success(self, client):
        # Get a captcha first
        captcha_res = client.get("/api/auth/captcha")
        captcha = captcha_res.json()

        # Verify it
        response = client.post("/api/auth/verify-captcha", json={
            "captcha_id": captcha["captcha_id"],
            "code": captcha["captcha_code"],
        })
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_verify_captcha_wrong_code(self, client):
        captcha_res = client.get("/api/auth/captcha")
        captcha = captcha_res.json()

        response = client.post("/api/auth/verify-captcha", json={
            "captcha_id": captcha["captcha_id"],
            "code": "WRONG!",
        })
        assert response.status_code == 400

    def test_verify_captcha_already_used(self, client):
        captcha_res = client.get("/api/auth/captcha")
        captcha = captcha_res.json()

        # Use it once
        client.post("/api/auth/verify-captcha", json={
            "captcha_id": captcha["captcha_id"],
            "code": captcha["captcha_code"],
        })

        # Try again
        response = client.post("/api/auth/verify-captcha", json={
            "captcha_id": captcha["captcha_id"],
            "code": captcha["captcha_code"],
        })
        assert response.status_code == 400
        assert "已被使用" in response.json()["detail"]

    def test_verify_captcha_invalid_id(self, client):
        response = client.post("/api/auth/verify-captcha", json={
            "captcha_id": "nonexistent-id",
            "code": "ABCDEF",
        })
        assert response.status_code == 400


class TestHealthCheck:
    def test_auth_health(self, client):
        response = client.get("/api/auth/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
```

```python
# backend/tests/api/test_student.py
import pytest
from unittest.mock import AsyncMock


class TestGetStudentAssignments:
    @pytest.mark.asyncio
    async def test_returns_assignments(self, client, mock_supabase):
        mock_assignments = [
            {"id": "a1", "title": "我的家乡", "deadline": "2026-05-01"},
        ]
        mock_supabase.get_student_assignments.return_value = mock_assignments

        response = client.get("/api/student/assignments?student_id=s1")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        mock_supabase.get_student_assignments.assert_called_once_with("s1")

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_class(self, client, mock_supabase):
        mock_supabase.get_student_assignments.return_value = []

        response = client.get("/api/student/assignments?student_id=s1")

        assert response.status_code == 200
        assert response.json()["data"] == []


class TestCreateSubmission:
    @pytest.mark.asyncio
    async def test_success(self, client, mock_supabase):
        mock_supabase.create_submission.return_value = {"id": "sub-1", "status": "submitted"}

        response = client.post(
            "/api/student/submissions?student_id=s1",
            json={
                "assignment_id": "a1",
                "content": "这是一篇测试作文，内容足够长以通过验证。",
            },
        )

        assert response.status_code == 200
        assert response.json()["success"] is True

    @pytest.mark.asyncio
    async def test_failure_returns_500(self, client, mock_supabase):
        mock_supabase.create_submission.return_value = None

        response = client.post(
            "/api/student/submissions?student_id=s1",
            json={
                "assignment_id": "a1",
                "content": "这是一篇测试作文，内容足够长以通过验证。",
            },
        )

        assert response.status_code == 500
```

### 5.5 Pydantic Schema Tests

```python
# backend/tests/schemas/test_submission.py
import pytest
from pydantic import ValidationError
from schemas.submission import SubmissionCreate, SubmissionResponse


class TestSubmissionCreate:
    def test_valid_submission(self):
        sub = SubmissionCreate(
            assignment_id="a1",
            content="这是一篇足够长的测试作文内容。",
        )
        assert sub.assignment_id == "a1"
        assert sub.image_url is None

    def test_content_too_short(self):
        with pytest.raises(ValidationError) as exc_info:
            SubmissionCreate(assignment_id="a1", content="太短")
        assert "min_length" in str(exc_info.value) or "at least" in str(exc_info.value)

    def test_optional_fields(self):
        sub = SubmissionCreate(
            assignment_id="a1",
            content="这是一篇足够长的测试作文内容。",
            image_url="https://example.com/image.jpg",
            ocr_result="OCR识别结果文本",
        )
        assert sub.image_url == "https://example.com/image.jpg"
        assert sub.ocr_result == "OCR识别结果文本"
```

---

## 6. Test Fixture Patterns

### Frontend Fixtures

```ts
// frontend/src/test/mocks/fixtures/users.ts
export const mockStudent = {
  id: 'student-1',
  email: 'student@test.com',
  name: '张三',
  role: 'student' as const,
  class_id: 'class-1',
  email_confirmed_at: '2026-01-01T00:00:00Z',
}

export const mockTeacher = {
  id: 'teacher-1',
  email: 'teacher@test.com',
  name: '李老师',
  role: 'teacher' as const,
  email_confirmed_at: '2026-01-01T00:00:00Z',
}

export const mockUnconfirmedUser = {
  ...mockStudent,
  id: 'unconfirmed-1',
  email_confirmed_at: null,
}
```

```ts
// frontend/src/test/mocks/fixtures/assignments.ts
export const mockAssignment = {
  id: 'a1',
  title: '我的家乡',
  description: '写一篇关于家乡的作文',
  deadline: '2026-05-01T23:59:59Z',
  word_count_min: 400,
  word_count_max: 800,
  status: 'active',
}

export const mockExpiredAssignment = {
  ...mockAssignment,
  id: 'a2',
  title: '过期作业',
  deadline: '2026-01-01T00:00:00Z',
}
```

### Backend Fixtures

```python
# backend/tests/fixtures/users.py
MOCK_STUDENT = {
    "id": "student-1",
    "email": "student@test.com",
    "name": "张三",
    "role": "student",
    "class_id": "class-1",
}

MOCK_TEACHER = {
    "id": "teacher-1",
    "email": "teacher@test.com",
    "name": "李老师",
    "role": "teacher",
}
```

```python
# backend/tests/fixtures/reports.py
MOCK_GRADING_RESULT = {
    "success": True,
    "total_score": 85,
    "scores": {"content": 30, "structure": 25, "language": 20, "writing": 10},
    "errors": [
        {
            "type": "typo",
            "position": [10, 12],
            "original": "的地",
            "suggestion": "的",
            "description": "地得不分",
        }
    ],
    "comment": "本文立意明确，结构清晰。",
    "model_usage": {"prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300},
}
```

---

## 7. Coverage Targets

### Phase 1 — Foundation (Target: 60%)

Focus on the most testable and highest-value code first:

| Layer | Files | Priority |
|-------|-------|----------|
| Backend schemas | `schemas/submission.py` | P0 — pure validation, easy to test |
| Backend auth API | `api/auth.py` | P0 — no external deps (in-memory captcha) |
| Frontend stores | `authStore.ts`, `studentStore.ts`, `teacherStore.ts` | P0 — core business logic |
| Frontend API service | `api.ts` | P0 — interceptors and request shaping |
| Backend config | `core/config.py` | P1 — validate env parsing |

### Phase 2 — Core Features (Target: 75%)

| Layer | Files | Priority |
|-------|-------|----------|
| Backend student API | `api/student.py` | P1 — most used endpoints |
| Backend teacher API | `api/teacher.py` | P1 |
| Backend grading API | `api/grading.py` | P1 — critical path |
| Frontend components | `Loading.tsx`, `EmailConfirmationBanner.tsx` | P1 |
| Frontend auth pages | `Login.tsx`, `Register.tsx` | P1 |

### Phase 3 — Full Coverage (Target: 80%+)

| Layer | Files | Priority |
|-------|-------|----------|
| Backend AI chat | `api/ai_chat.py` | P2 |
| Backend mistakes | `api/mistakes.py` | P2 |
| Backend external services | `dashscope_service.py`, `supabase_service.py` | P2 |
| Frontend student pages | `Tasks.tsx`, `Submit.tsx`, `History.tsx`, `Report.tsx` | P2 |
| Frontend teacher pages | `Classes.tsx`, `Assignments.tsx`, `Grading.tsx`, `Dashboard.tsx` | P2 |
| Frontend routing/guards | `App.tsx` ProtectedRoute | P2 |

---

## 8. Testing Anti-Patterns to Avoid

Based on patterns observed in this codebase:

| Anti-Pattern | Risk | Mitigation |
|-------------|------|------------|
| Testing implementation details | Brittle tests that break on refactor | Test behavior: "when user clicks submit, success message appears" |
| Mocking `zustand` internals | Tight coupling to store shape | Use `useStore.setState()` for setup, call actions via `getState()` |
| Snapshot testing for dynamic content | False positives from date/ID changes | Use targeted assertions instead of snapshots |
| Testing Ant Design internals | Depends on library version | Test via user-visible text and ARIA roles |
| Not resetting store state | Test pollution across suites | Always reset in `beforeEach` |
| Testing `console.log` calls | Couples to debug output | Remove console.logs first (see CONVENTIONS.md tech debt) |
| Hardcoding API URLs in tests | Breaks when base URL changes | Use MSW handlers or import from api config |

---

## 9. Running Tests

### Frontend

```bash
cd frontend

# Run all tests
npm test

# Watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific file
npx vitest run src/store/__tests__/authStore.test.ts
```

### Backend

```bash
cd backend

# Run all tests
pytest

# With coverage
pytest --cov --cov-report=html

# Run specific module
pytest tests/api/test_auth.py -v

# Run specific test
pytest tests/api/test_auth.py::TestCaptcha::test_get_captcha_returns_valid_response -v
```
