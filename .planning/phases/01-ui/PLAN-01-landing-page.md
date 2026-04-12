# Plan 01: Landing Page (Home) 重新设计

```yaml
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/Home.tsx
  - frontend/src/pages/Home.css
requirements:
  - UI-02
autonomous: true
```

## Overview

重新设计首页/Landing Page，使其成为产品门面。当前页面结构基本合理（Hero + Features + CTA + Footer），但视觉表现需要升级：需要增加更多内容区块（使用场景、用户角色引导、数据统计展示），让用户打开首页能立即理解产品价值并被引导注册。

## Tasks

<task id="01.1">
<title>重新设计 Home.tsx — 增加 Header 导航栏、角色展示区和使用流程区</title>
<read_first>
- frontend/src/pages/Home.tsx
- frontend/src/pages/Home.css
- frontend/src/index.css
- frontend/src/App.tsx
</read_first>
<action>
重写 `frontend/src/pages/Home.tsx`，保持 `React.FC` 函数组件模式，保持使用 `antd` 的 `Button` 组件和 `@ant-design/icons` 图标。

**新增顶部导航栏 (sticky header)**:
- 左侧 Logo 区域：使用 `RobotOutlined` 图标 + 文字 "AI作文批改"
- 右侧按钮区：`登录` 按钮（ghost 样式）和 `免费注册` 按钮（primary 样式）
- 导航栏 CSS 类名：`home-navbar`，滚动后添加 `scrolled` 类增加阴影
- 用 `useState` 管理 `scrolled` 状态，`useEffect` 监听 `window scroll` 事件，滚动超过 50px 时设为 true
- 组件卸载时移除 scroll 监听器

**Hero 区域改造**:
- 保留现有结构：badge + title + description + CTA 按钮
- 标题改为："AI赋能作文批改" + 换行 + 渐变文字 "让每一次写作都有提升"
- 描述文字改为："面向K-12教育场景，利用先进AI技术实现作文智能批改、个性化辅导和学情数据分析，帮助教师减负增效，助力学生写作成长"
- Badge 文字改为："基于大语言模型的智能批改引擎"
- Hero 区域新增右侧展示区：一个模拟的批改报告卡片（纯 CSS 装饰，不需要真实数据），包含：
  - 一个 `div.hero-demo-card` 带白色背景、圆角和阴影
  - 内部展示 4 个假分数条目（内容30/35、结构20/25、语言22/25、书写13/15），每个用 `div.demo-score-item` 包裹
  - 底部一个 "AI总评" 标签和假评语文字 "文章结构清晰，论点明确..."
  - 整体旋转 `transform: perspective(1000px) rotateY(-5deg) rotateX(3deg)` 增加立体感

**新增使用流程区 `section.workflow-section`**:
- 标题："三步开始智能批改"
- 副标题："简单三步，即可体验AI赋能的作文批改服务"
- 3 个步骤卡片 `div.workflow-step`，每个包含：
  1. 步骤编号 `div.step-number` 显示 "01" / "02" / "03"
  2. 标题和描述
  3. 步骤内容：
     - 步骤1：图标 `FormOutlined`，标题 "提交作文"，描述 "学生在线编辑或拍照上传手写作文，支持多种格式"
     - 步骤2：图标 `RobotOutlined`，标题 "AI智能批改"，描述 "AI从内容、结构、语言、书写四个维度进行全面分析"
     - 步骤3：图标 `TrophyOutlined`，标题 "获取报告"，描述 "查看详细批改报告，通过AI对话获得个性化辅导建议"

**新增角色引导区 `section.roles-section`**:
- 标题："为每个角色量身打造"
- 两列布局（grid），分别展示学生端和教师端价值：
  - 左侧 `div.role-card`（学生角色）：
    - 顶部 `div.role-icon` 使用 `ReadOutlined` 图标，蓝色渐变背景
    - 标题 "学生"
    - 4 个价值点列表 `ul.role-features`：
      - "即时获得AI批改反馈"
      - "个性化写作辅导对话"
      - "智能错题本查漏补缺"
      - "学习曲线追踪进步"
  - 右侧 `div.role-card`（教师角色）：
    - 顶部 `div.role-icon` 使用 `SolutionOutlined` 图标，绿色渐变背景
    - 标题 "教师"
    - 4 个价值点列表：
      - "一键AI批改减负80%"
      - "审核修改AI批改结果"
      - "班级学情数据可视化"
      - "精准把握教学重点"

**保留现有 Features 区域**，但修改为 4 列网格布局（保持现有 4 个 feature 定义不变）

**保留现有 CTA 区域和 Footer**，CTA 区域增加统计数据展示：
- 在 CTA 按钮下方增加 `div.cta-stats`，包含 3 个统计项 `div.cta-stat-item`：
  - "10W+" 累计批改
  - "95%" 教师满意度
  - "3秒" 平均批改速度

**新增 import**：
```typescript
import { FormOutlined, ReadOutlined, SolutionOutlined, TrophyOutlined } from '@ant-design/icons';
```

所有新增 section 按顺序排列：navbar → hero → workflow → features → roles → cta → footer
</action>
<acceptance_criteria>
- Home.tsx 包含 `className="home-navbar"` 的 div
- Home.tsx 包含 `className="workflow-section"` 的 section
- Home.tsx 包含 `className="roles-section"` 的 section
- Home.tsx 包含 `className="hero-demo-card"` 的 div
- Home.tsx 包含 `className="cta-stats"` 的 div
- Home.tsx 包含 `FormOutlined` 和 `TrophyOutlined` 和 `ReadOutlined` 和 `SolutionOutlined` 在 import 语句中
- Home.tsx 包含文字 "三步开始智能批改"
- Home.tsx 包含文字 "为每个角色量身打造"
- Home.tsx 包含文字 "基于大语言模型的智能批改引擎"
- Home.tsx 包含 `useState` 用于 `scrolled` 状态管理
- Home.tsx 包含 `useEffect` 和 `addEventListener('scroll'`
- Home.tsx 以 `export default Home` 结尾
</acceptance_criteria>
</task>

<task id="01.2">
<title>重写 Home.css — 完整的 Landing Page 样式</title>
<read_first>
- frontend/src/pages/Home.css
- frontend/src/index.css
</read_first>
<action>
重写 `frontend/src/pages/Home.css`，在文件顶部保留设计说明注释。使用 `index.css` 中定义的 CSS 变量（`--primary-color: #0066FF`, `--primary-hover: #0052CC`, `--bg-color: #F8FAFC`, `--card-bg: #FFFFFF`, `--text-primary: #0F172A`, `--text-secondary: #64748B`, `--border-color: #E2E8F0`, `--radius-md: 12px`, `--radius-lg: 20px`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`）。

**导航栏样式 `.home-navbar`**:
```css
.home-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 48px;
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}
.home-navbar.scrolled {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.navbar-logo .anticon {
  font-size: 28px;
  color: var(--primary-color);
}
.navbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
```

**Hero 区域样式更新** — 改为左右两栏布局:
```css
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 120px 48px 80px;
  max-width: 1400px;
  margin: 0 auto;
  gap: 60px;
}
.hero-content {
  flex: 1;
  text-align: left;
  max-width: 600px;
}
.hero-demo {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
.hero-demo-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  transform: perspective(1000px) rotateY(-5deg) rotateX(3deg);
  width: 380px;
  border: 1px solid var(--border-color);
}
.demo-score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}
.demo-score-item:last-child { border-bottom: none; }
.demo-score-label { font-size: 14px; color: var(--text-secondary); }
.demo-score-value { font-size: 18px; font-weight: 700; color: var(--primary-color); }
.demo-comment { margin-top: 16px; padding: 16px; background: #F0F7FF; border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
.demo-comment-label { font-size: 12px; font-weight: 600; color: var(--primary-color); margin-bottom: 8px; }
```

修改 `.hero-title` 的 `text-align` 去掉居中（改为继承 `.hero-content` 的 `text-align: left`）。

**使用流程区域**:
```css
.workflow-section {
  padding: 120px 48px;
  max-width: 1200px;
  margin: 0 auto;
}
.workflow-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  margin-top: 60px;
}
.workflow-step {
  text-align: center;
  padding: 40px 24px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
  position: relative;
}
.workflow-step:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.step-number {
  font-size: 48px;
  font-weight: 800;
  color: rgba(0, 102, 255, 0.1);
  margin-bottom: 16px;
  line-height: 1;
}
.step-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, #60A5FA 100%);
  border-radius: 16px;
  margin: 0 auto 20px;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
}
.step-icon .anticon { font-size: 28px; color: white; }
.step-title { font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px; }
.step-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.6; }
```

**角色引导区**:
```css
.roles-section {
  padding: 120px 48px;
  background: linear-gradient(180deg, var(--bg-color) 0%, #EFF6FF 100%);
}
.roles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
  max-width: 1000px;
  margin: 60px auto 0;
}
.role-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 48px 40px;
  transition: all 0.3s ease;
}
.role-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.role-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  margin-bottom: 24px;
}
.role-icon .anticon { font-size: 32px; color: white; }
.role-icon-student { background: linear-gradient(135deg, #0066FF 0%, #60A5FA 100%); }
.role-icon-teacher { background: linear-gradient(135deg, #10B981 0%, #6EE7B7 100%); }
.role-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 20px; }
.role-features { list-style: none; padding: 0; margin: 0; }
.role-features li {
  padding: 10px 0;
  font-size: 15px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 12px;
}
.role-features li::before {
  content: '✓';
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(0, 102, 255, 0.1);
  color: var(--primary-color);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
```

**CTA 统计区**:
```css
.cta-stats {
  display: flex;
  gap: 48px;
  justify-content: center;
  margin-top: 48px;
}
.cta-stat-item { text-align: center; }
.cta-stat-value {
  font-size: 36px;
  font-weight: 800;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 8px;
}
.cta-stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}
```

**响应式设计** — 在已有的 `@media (max-width: 768px)` 内增加：
```css
@media (max-width: 768px) {
  .home-navbar { padding: 12px 20px; }
  .hero-section { flex-direction: column; padding: 100px 20px 60px; gap: 40px; }
  .hero-content { text-align: center; max-width: 100%; }
  .hero-demo-card { width: 100%; max-width: 320px; transform: none; }
  .workflow-grid { grid-template-columns: 1fr; gap: 24px; }
  .roles-grid { grid-template-columns: 1fr; gap: 24px; }
  .cta-stats { flex-direction: column; gap: 24px; }
  .workflow-section, .roles-section { padding: 80px 20px; }
}
```

保留现有的 `.features-section`, `.feature-card`, `.cta-section`, `.cta-container`, `.home-footer` 样式不变。
保留 `@keyframes fadeInUp` 动画。
</action>
<acceptance_criteria>
- Home.css 包含 `.home-navbar` 样式定义
- Home.css 包含 `.home-navbar.scrolled` 样式定义
- Home.css 包含 `backdrop-filter: blur(12px)`
- Home.css 包含 `.workflow-section` 样式定义
- Home.css 包含 `.workflow-grid` 样式定义（`grid-template-columns: repeat(3, 1fr)`）
- Home.css 包含 `.roles-section` 样式定义
- Home.css 包含 `.roles-grid` 样式定义（`grid-template-columns: repeat(2, 1fr)`）
- Home.css 包含 `.hero-demo-card` 样式定义
- Home.css 包含 `.cta-stats` 样式定义
- Home.css 包含 `.role-icon-student` 和 `.role-icon-teacher` 样式
- Home.css 包含 `@media (max-width: 768px)` 媒体查询
- Home.css 包含 `.step-number` 样式
</acceptance_criteria>
</task>

## Verification

```bash
# 1. TypeScript 编译检查
cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30

# 2. 关键元素验证
grep -c "home-navbar" src/pages/Home.tsx    # >= 1
grep -c "workflow-section" src/pages/Home.tsx  # >= 1
grep -c "roles-section" src/pages/Home.tsx  # >= 1
grep -c "hero-demo-card" src/pages/Home.tsx  # >= 1

# 3. CSS 选择器验证
grep -c "\.home-navbar" src/pages/Home.css  # >= 2 (.home-navbar and .home-navbar.scrolled)
grep -c "\.workflow-section" src/pages/Home.css  # >= 1
grep -c "\.roles-section" src/pages/Home.css  # >= 1

# 4. 无 console.log
grep -c "console.log" src/pages/Home.tsx  # should be 0
```

## must_haves

- [ ] 首页有 sticky 导航栏，含 Logo 和登录/注册按钮
- [ ] Hero 区域有产品介绍文字和模拟批改报告展示卡片
- [ ] 有三步使用流程展示区
- [ ] 有学生/教师角色引导区，各列出 4 个价值点
- [ ] 有 CTA 按钮和统计数据展示
- [ ] 有 footer 版权信息
- [ ] 页面可以正常渲染，无 TypeScript 编译错误
