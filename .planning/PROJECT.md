# AI 作文批改系统 (AI Essay Grading)

## What This Is

一个面向 K-12 教育场景的 AI 作文智能批改平台。学生可以在线编辑或拍照上传手写作文，系统通过阿里云百炼 AI 进行多维度智能批改（内容、结构、语言），教师可以审核 AI 批改结果并进行二次修改，同时提供学情数据可视化、AI 对话辅导和智能错题本功能。

## Core Value

**让学生获得即时、专业、多维度的作文反馈**——减轻教师批改负担的同时，为每个学生提供个性化的写作指导。

## Requirements

### Validated

<!-- 已有代码中实现的功能 -->

- ✓ 用户注册/登录（Supabase Auth，邮箱+密码） — existing
- ✓ 角色区分（学生/教师）+ 路由守卫 — existing
- ✓ 学生选择班级 — existing
- ✓ 教师创建作文任务 — existing
- ✓ 学生在线提交作文 — existing
- ✓ 手写作文拍照上传 + OCR 识别（qwen-vl-plus） — existing
- ✓ AI 多维度智能批改（qwen-plus，内容/结构/语言/书写） — existing
- ✓ 教师审核 + 二次批改 — existing
- ✓ 批改报告查看 — existing
- ✓ 提交历史记录 — existing
- ✓ AI 对话辅导 — existing
- ✓ 智能错题本 — existing
- ✓ 学情数据统计 — existing
- ✓ 邮箱验证提醒 — existing
- ✓ 验证码功能 — existing

### Active

<!-- 本次迭代目标 -->

- [ ] 前端 UI 全面重新设计 — 现有界面设计粗糙，体验差
- [ ] 前端代码质量优化 — 消除 any 类型、添加错误边界、优化性能
- [ ] 后端代码质量优化 — 日志替代 print、输入验证、错误处理标准化
- [ ] 教师仪表盘真实数据 — 替换硬编码 mock 数据
- [ ] 错题本真实持久化 — 当前标记掌握是 no-op
- [ ] 班级统计真实数据 — 替换 mock 统计
- [ ] 完整的 Playwright E2E 测试 — 当前零测试
- [ ] 后端单元测试 — pytest，覆盖核心逻辑
- [ ] 前端组件测试 — Vitest + React Testing Library
- [ ] 安全加固 — 清理硬编码密钥、输入验证、CORS 规范
- [ ] 响应式设计 — 移动端适配
- [ ] 性能优化 — 请求取消、缓存、懒加载优化

### Out of Scope

- 实时聊天 — 高复杂度，非核心功能
- 视频上传 — 存储/带宽成本过高
- OAuth 第三方登录 — 邮箱/密码足够 v1
- 原生移动 App — Web 优先
- 支付功能 — 目前不需要商业化
- Redis 缓存 — MVP 阶段用内存足够
- 国际化 — 目标用户为中国 K-12

## Context

- 基于 **Vibe Coding** 方法论开发的 MVP 项目
- 前端: React 19 + TypeScript + Ant Design 5 + Zustand + Vite
- 后端: Python FastAPI + Supabase (PostgreSQL + Auth + Storage)
- AI: 阿里云百炼 DashScope (qwen-plus 批改, qwen-vl-plus OCR)
- 当前代码量：前端 5517 行，后端 1367 行
- **零测试** — 没有任何类型的测试
- 多处技术债：console.log 泛滥、any 类型、mock 数据、内存验证码
- UI 使用纯 Ant Design 组件，缺乏定制化设计

## Constraints

- **Tech stack**: 保持现有技术栈（React/FastAPI/Supabase），不做大规模迁移
- **AI Provider**: 继续使用阿里云百炼 DashScope
- **Database**: 继续使用 Supabase PostgreSQL
- **Language**: 界面语言为中文
- **Backward compatibility**: 不破坏现有数据库表结构

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 保持 Supabase Auth | 已集成完整，迁移成本高 | — Pending |
| 使用 Playwright 做 E2E | 行业标准，Claude Code 有原生 skill | — Pending |
| 使用 Vitest 做前端测试 | 与 Vite 生态无缝集成 | — Pending |
| UI 基于 Ant Design 定制化 | 保持现有组件库，做深度定制 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-12 after initialization*
