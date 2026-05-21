import { test } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = resolve(__dirname, '../../docs/diagrams');

async function renderMermaid(page: any, code: string, outputFile: string) {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  await page.setContent(`<!DOCTYPE html>
<html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>
  body { background: white; display: flex; justify-content: center; padding: 40px; margin: 0; }
  .mermaid { min-width: 800px; }
  .mermaid svg { min-width: 800px !important; }
</style>
</head><body>
<pre class="mermaid">${escaped}</pre>
<script>mermaid.initialize({startOnLoad:true, theme:'default', fontSize:16, flowchart:{useMaxWidth:false}, sequence:{useMaxWidth:false}});</script>
</body></html>`, { waitUntil: 'networkidle' });
  await page.waitForSelector('svg', { timeout: 15000 });
  await page.waitForTimeout(2000);
  // Screenshot the full page for high quality
  await page.screenshot({ path: outputFile, fullPage: true, omitBackground: false });
}

test.describe('论文图表生成', () => {
  test.use({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });

  test('生成系统架构图', async ({ page }) => {
    await renderMermaid(page, `graph TB
    Browser["浏览器"]
    subgraph Frontend["前端 React 19 + TypeScript"]
        Router["React Router v7"]
        Store["Zustand 状态管理"]
        UI["Ant Design 5"]
        Charts["ECharts 图表"]
        Editor["TipTap 编辑器"]
    end
    subgraph Backend["后端 FastAPI + Python"]
        AuthAPI["认证模块"]
        StudentAPI["学生模块"]
        TeacherAPI["教师模块"]
        GradingAPI["批改模块"]
        ChatAPI["AI对话模块"]
    end
    subgraph Services["服务层"]
        SupaService["SupabaseService"]
        DashService["DashScopeService"]
    end
    subgraph External["外部服务"]
        Supabase[("Supabase PostgreSQL")]
        DashScope["阿里云百炼 AI"]
    end
    Browser --> Frontend
    Frontend -->|HTTP REST| Backend
    Backend --> Services
    SupaService --> Supabase
    DashService --> DashScope`, `${OUTPUT_DIR}/system-architecture.png`);
  });

  test('生成数据库ER图', async ({ page }) => {
    await renderMermaid(page, `erDiagram
    users ||--o{ submissions : submits
    users }o--|| classes : belongs_to
    classes ||--o{ assignments : has
    assignments ||--o{ submissions : contains
    submissions ||--o| grading_reports : graded_by
    submissions ||--o{ ai_conversations : discussed_in
    users ||--o{ mistake_records : has
    users {
        uuid id PK
        string email
        string name
        enum role
        uuid class_id FK
    }
    classes {
        uuid id PK
        int grade
        string name
        uuid teacher_id FK
    }
    assignments {
        uuid id PK
        string title
        uuid teacher_id FK
        uuid class_id FK
        timestamp deadline
    }
    submissions {
        uuid id PK
        uuid assignment_id FK
        uuid student_id FK
        text content
        int word_count
        enum status
    }
    grading_reports {
        uuid id PK
        uuid submission_id FK
        float ai_total_score
        json ai_scores
        json ai_errors
    }
    ai_conversations {
        uuid id PK
        uuid student_id FK
        uuid submission_id FK
        json messages
    }
    mistake_records {
        uuid id PK
        uuid student_id FK
        string mistake_type
        int frequency
    }`, `${OUTPUT_DIR}/er-diagram.png`);
  });

  test('生成AI批改时序图', async ({ page }) => {
    await renderMermaid(page, `sequenceDiagram
    participant S as 学生
    participant F as 前端React
    participant B as 后端FastAPI
    participant DB as Supabase
    participant AI as DashScope
    S->>F: 提交作文
    F->>B: POST /api/student/submissions
    B->>DB: 插入submission记录
    DB-->>B: 返回submission_id
    B-->>F: 提交成功
    F-->>S: 显示成功提示
    Note over B,AI: 教师触发AI批改
    B->>DB: 查询作文内容
    DB-->>B: 返回content
    B->>AI: Prompt + 作文内容
    AI-->>B: JSON评分结果
    B->>DB: 存储grading_reports
    B->>DB: 更新status为graded
    S->>F: 查看批改报告
    F->>B: GET /api/student/reports
    B->>DB: 查询报告
    DB-->>B: 返回数据
    B-->>F: 评分和评语
    F-->>S: 展示批改报告`, `${OUTPUT_DIR}/grading-sequence.png`);
  });

  test('生成业务流程图', async ({ page }) => {
    await renderMermaid(page, `flowchart TD
    A[教师布置作业] --> B[学生查看任务]
    B --> C{提交方式}
    C -->|在线编辑| D[TipTap编辑器]
    C -->|拍照上传| E[上传图片]
    E --> F[OCR识别]
    F --> G[确认文字]
    D --> H[提交作文]
    G --> H
    H --> I[AI智能批改]
    I --> K[教师审核]
    K --> M{通过?}
    M -->|是| N[发布报告]
    M -->|修改| O[修改评分]
    O --> N
    N --> P[学生查看]
    P --> Q[AI辅导]
    P --> R[错题归档]`, `${OUTPUT_DIR}/business-flow.png`);
  });

  test('生成部署架构图', async ({ page }) => {
    await renderMermaid(page, `graph LR
    subgraph Client["客户端"]
        Browser["浏览器"]
    end
    subgraph CDN["Vercel"]
        Static["React静态资源"]
    end
    subgraph Server["后端"]
        API["FastAPI Uvicorn"]
    end
    subgraph Cloud["云服务"]
        Supa["Supabase"]
        Dash["DashScope"]
    end
    Browser -->|HTTPS| Static
    Static -->|API| API
    API -->|SDK| Supa
    API -->|OpenAI SDK| Dash`, `${OUTPUT_DIR}/deployment.png`);
  });
});
