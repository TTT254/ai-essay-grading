# Roadmap: AI 作文批改系统

**Created:** 2026-04-12
**Mode:** YOLO | Standard granularity (5-8 phases)
**Priority:** 功能和 UI 优先（安全/代码质量降为 v2）

## Phases

### Phase 1: 核心页面 UI 重设计 — 认证与入口
**Goal:** 用户第一印象的页面焕然一新——登录/注册和 Landing Page 成为产品门面
**Requirements:** UI-01, UI-02

**Success Criteria:**
1. 用户打开首页看到产品介绍、功能亮点、注册引导，不再是空白/简陋页面
2. 登录/注册页面有品牌色、插画或背景设计，视觉上与「教育 AI 产品」定位匹配
3. 注册-登录-进入系统的完整流程可以无障碍走通

---

### Phase 2: 学生端 & 教师端布局重设计
**Goal:** 两端主布局和导航系统全面升级，建立统一的视觉框架
**Requirements:** UI-03, UI-04

**Success Criteria:**
1. 学生端侧边栏/导航层次清晰，页面间切换流畅无卡顿
2. 教师端仪表盘信息层次分明——关键指标一眼可见，图表美观
3. 两端布局风格统一，同属一个产品的视觉一致性

---

### Phase 3: 功能页面 UI 重设计 — 批改报告、对话、错题本
**Goal:** 三个高频使用的功能页面视觉和交互体验大幅提升
**Requirements:** UI-05, UI-06, UI-07

**Success Criteria:**
1. 批改报告页面分数有可视化展示（非纯文本），错误点有高亮标注
2. AI 对话页面有聊天气泡样式，消息呈现清晰区分用户与 AI
3. 错题本页面支持分类浏览，掌握状态有直观的视觉指示（颜色/标签/进度条）

---

### Phase 4: 数据真实化 & 核心功能增强
**Goal:** 消灭所有 mock 数据，让系统数据全部真实；补齐草稿保存和批改可视化
**Requirements:** FEAT-01, FEAT-02, FEAT-03, FEAT-04, FEAT-05

**Success Criteria:**
1. 教师仪表盘和班级统计页面展示的数字全部来自数据库真实查询，无硬编码
2. 学生在错题本中标记「已掌握」后刷新页面状态不丢失
3. 学生可以保存作文草稿，下次进入继续编辑
4. 批改报告中出现雷达图展示各维度得分

---

### Phase 5: 高级功能 — 批量批改、对比、排行、上下文记忆
**Goal:** 教师效率工具和学生成长追踪功能上线
**Requirements:** FEAT-06, FEAT-07, FEAT-08, FEAT-09, FEAT-10

**Success Criteria:**
1. 教师可以选中多篇作文一键触发 AI 批改，批改结果逐个生成
2. 学生可以查看自己不同时间提交的作文成绩对比，看到进步趋势
3. 班级排行/统计分析页面可正常展示，教师可以一览全班写作水平分布
4. AI 辅导对话中引用之前的批改内容时，AI 能结合上下文回答

---

### Phase 6: 响应式设计
**Goal:** 所有页面在手机和平板上可用
**Requirements:** UI-08

**Success Criteria:**
1. 登录/注册/首页在 375px 宽度下布局正常，无横向滚动
2. 学生端核心流程（提交作文、查看报告、对话辅导）在手机上可完成
3. 教师端仪表盘在平板（768px）下图表和数据展示正常

---

### Phase 7: E2E 测试覆盖
**Goal:** 用 Playwright 覆盖所有关键用户流程，确保功能稳定
**Requirements:** TEST-01, TEST-02, TEST-03, TEST-04, TEST-05

**Success Criteria:**
1. 5 个 E2E 测试套件全部通过（注册登录、提交批改、教师流程、AI 对话、错题本）
2. 测试可在 CI 环境中无头浏览器运行
3. 测试覆盖了至少一个完整的学生端和教师端核心流程

---

## Phase-Requirement Matrix

| Phase | Requirements | Count |
|-------|-------------|-------|
| 1 — 认证与入口 UI | UI-01, UI-02 | 2 |
| 2 — 布局重设计 | UI-03, UI-04 | 2 |
| 3 — 功能页面 UI | UI-05, UI-06, UI-07 | 3 |
| 4 — 数据真实化 & 核心功能 | FEAT-01, FEAT-02, FEAT-03, FEAT-04, FEAT-05 | 5 |
| 5 — 高级功能 | FEAT-06, FEAT-07, FEAT-08, FEAT-09, FEAT-10 | 5 |
| 6 — 响应式设计 | UI-08 | 1 |
| 7 — E2E 测试 | TEST-01, TEST-02, TEST-03, TEST-04, TEST-05 | 5 |
| **Total** | | **23** |

## Coverage Validation

- v1 requirements total: 23
- Mapped to phases: 23
- Unmapped: 0 ✅
- UI requirements (8): Phase 1 (2) + Phase 2 (2) + Phase 3 (3) + Phase 6 (1) = 8 ✅
- Feature requirements (10): Phase 4 (5) + Phase 5 (5) = 10 ✅
- Test requirements (5): Phase 7 (5) = 5 ✅

## Execution Notes

- **YOLO mode**: 跳过安全/代码质量检查，聚焦功能和 UI
- **Parallel execution**: Phase 4 和 Phase 5 中的独立 feature 可并行开发
- **UI-first**: Phase 1-3 先做 UI，为后续功能提供视觉框架
- **响应式放后面**: 先在桌面端完成所有功能和 UI，再统一做移动端适配
- **测试收尾**: E2E 测试放最后，在所有功能稳定后编写

---
*Roadmap created: 2026-04-12*
*Last updated: 2026-04-12*
