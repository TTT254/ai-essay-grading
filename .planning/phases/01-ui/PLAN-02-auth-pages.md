# Plan 02: 登录/注册页面全面重新设计

```yaml
wave: 1
depends_on: []
files_modified:
  - frontend/src/pages/Login.tsx
  - frontend/src/pages/Login.css
  - frontend/src/pages/Register.tsx
  - frontend/src/pages/Register.css
requirements:
  - UI-01
autonomous: true
```

## Overview

重新设计登录和注册页面的视觉表现，使其与「教育 AI 产品」定位匹配。Login 页面已有不错的左右分栏布局，但需要统一品牌色（当前 Login 用 `#0066FF`，Register 用 `#1890ff`，需要统一为 `#0066FF`），Register 页面需要从居中单卡片改为与 Login 一致的左右分栏布局。两个页面的功能逻辑和表单验证保持不变，仅重写视觉层。

## Tasks

<task id="02.1">
<title>统一 Login.css 品牌色和视觉微调</title>
<read_first>
- frontend/src/pages/Login.css
- frontend/src/pages/Login.tsx
- frontend/src/index.css
</read_first>
<action>
编辑 `frontend/src/pages/Login.css`，进行以下改动（Login.tsx 逻辑不变，不修改）：

**1. 左侧品牌区背景增加纹理层次感**：

将 `.login-visual` 的 background 改为：
```css
background: linear-gradient(135deg, #0066FF 0%, #0044CC 50%, #003399 100%);
```

在 `.login-visual::before` 的 `background-image` 之后增加第二层装饰：
```css
.login-visual::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
}
```

**2. 右侧表单区增加品牌装饰**：

在 `.login-form-section` 增加 `::before` 伪元素装饰圆圈：
```css
.login-form-section::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 102, 255, 0.03) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  pointer-events: none;
}
```

**3. 表单卡片增加更精致的阴影**：

将 `.login-card` 的 `box-shadow` 改为：
```css
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
```

**4. 特性卡片增加 glassmorphism 效果强化**：

将 `.feature-card` 的 `backdrop-filter` 从 `blur(10px)` 改为 `blur(16px)`。

**5. 登录按钮增加渐变效果**：

将 `.login-button` 的 `background` 改为：
```css
background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
```

将 `.login-button:hover` 的 `background` 改为：
```css
background: linear-gradient(135deg, #0052CC 0%, #003399 100%);
```

**6. 统计数据动画**：

增加 `.stat-value` 的渐入动画：
```css
.stat-value {
  color: white;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
  animation: countUp 1s ease-out;
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

其余所有样式保持不变，不删除任何现有 CSS 规则。
</action>
<acceptance_criteria>
- Login.css 包含 `#0066FF` 和 `#0044CC` 和 `#003399` 在 `.login-visual` 的 gradient 中
- Login.css 包含 `.login-form-section::before` 伪元素定义
- Login.css 包含 `backdrop-filter: blur(16px)` 在 `.feature-card` 中
- Login.css 的 `.login-button` 包含 `linear-gradient(135deg, #0066FF 0%, #0052CC 100%)`
- Login.css 包含 `@keyframes countUp` 动画定义
- Login.css 仍然包含所有响应式 `@media` 查询块（768px 和 480px）
- Login.tsx 文件未被修改（用 md5 或 diff 验证）
</acceptance_criteria>
</task>

<task id="02.2">
<title>重新设计 Register.tsx — 左右分栏布局</title>
<read_first>
- frontend/src/pages/Register.tsx
- frontend/src/pages/Login.tsx
- frontend/src/pages/Register.css
- frontend/src/store/authStore.ts
- frontend/src/services/api.ts
</read_first>
<action>
重写 `frontend/src/pages/Register.tsx` 的 JSX 结构，从居中单卡片改为与 Login 页面一致的左右分栏布局。**所有表单逻辑、验证、状态管理、事件处理函数完全保持不变**——只修改 `return (...)` 内的 JSX 结构。

**保持不变的代码（不要修改）**：
- 所有 import 语句
- `CaptchaData` 和 `Class` interface 定义
- 组件内的所有 state: `captcha`, `role`, `classes`, `selectedGrade`
- `loadCaptcha()` 函数
- `loadClasses()` 函数
- `handleSubmit()` 函数
- `getClassesByGrade()` 函数
- `useEffect` hook

**需要新增的 import**（在现有 import 基础上添加）：
```typescript
import {
  ThunderboltOutlined,
  TeamOutlined,
  BarChartOutlined,
  HomeOutlined,
  EditOutlined,
  FileSearchOutlined,
  BookOutlined
} from '@ant-design/icons';
```

**新的 JSX 结构**（替换 return 语句内的全部内容）：

最外层 `div.register-container` 改为 flex 左右分栏：

**左侧品牌展示区 `div.register-visual`**：
- 结构与 Login 左侧完全对应
- `div.visual-content` 内部包含：
  - Logo 区域 `div.logo-section`：
    - `div.logo-icon` 使用 `RobotOutlined` 图标
    - `Title level={1} className="logo-title"` 显示 "AI作文批改系统"
    - `Text className="logo-subtitle"` 显示 "开启智能写作新时代"
  - 3 个价值卡片 `div.value-cards`（不是 features-grid，用不同类名避免 CSS 冲突）：
    - 卡片1：`EditOutlined` 图标，标题 "智能批改"，描述 "AI秒级完成多维度作文评分"
    - 卡片2：`FileSearchOutlined` 图标，标题 "精准分析"，描述 "内容、结构、语言全面诊断"
    - 卡片3：`BookOutlined` 图标，标题 "持续进步"，描述 "个性化辅导助力写作成长"
  - 底部统计 `div.register-stats-row`：
    - "10W+" / "累计批改"
    - "4维度" / "评分体系"
    - "K-12" / "全学段覆盖"

**右侧注册表单区 `div.register-form-section`**：
- 返回首页按钮 `Link to="/" className="back-home-btn"`：`HomeOutlined` + "返回首页"
- `Card className="register-card"` 内部：
  - `div.register-header`：`Title level={2}` "创建账号" + `Text type="secondary"` "注册后即可开始智能作文批改"
  - Form 表单：保持现有所有 Form.Item 不变（name、email、password、confirmPassword、role radio、grade select、class_id select、captcha、submit button）
  - 底部 `div.register-footer`：已有账号？+ `Link to="/login"` 立即登录

- 版权信息 `div.register-tips`：`© 2026 AI作文批改系统 · 让每一次写作都有提升`

**关键：** 表单内部的所有 Form.Item 结构和属性必须与原始代码完全一致，包括所有 rules、onChange handlers、Option 列表等。只修改外层容器的 JSX 结构。
</action>
<acceptance_criteria>
- Register.tsx 包含 `className="register-visual"` 的 div
- Register.tsx 包含 `className="register-form-section"` 的 div
- Register.tsx 包含 `className="back-home-btn"` 的 Link
- Register.tsx 包含 `className="value-cards"` 的 div
- Register.tsx 包含 `className="register-stats-row"` 的 div
- Register.tsx 包含 `HomeOutlined` 在 import 语句中
- Register.tsx 包含 `EditOutlined` 在 import 语句中
- Register.tsx 仍然包含 `loadCaptcha` 函数定义
- Register.tsx 仍然包含 `loadClasses` 函数定义
- Register.tsx 仍然包含 `handleSubmit` 函数定义
- Register.tsx 仍然包含 `getClassesByGrade` 函数定义
- Register.tsx 仍然包含 `classService.getClasses()` 调用
- Register.tsx 仍然包含 `api.auth.verifyCaptcha` 调用
- Register.tsx 仍然包含 `Form.Item name="class_id"`
- Register.tsx 以 `export default Register` 结尾
</acceptance_criteria>
</task>

<task id="02.3">
<title>重写 Register.css — 左右分栏布局样式</title>
<read_first>
- frontend/src/pages/Register.css
- frontend/src/pages/Login.css
- frontend/src/index.css
</read_first>
<action>
完全重写 `frontend/src/pages/Register.css`，从居中卡片布局改为与 Login 页面一致的左右分栏布局。使用 `#0066FF` 品牌蓝色（统一替换原来的 `#1890ff`）。

**文件头注释**：
```css
/* ============================================
   注册页面 - 左右分栏品牌布局
   设计理念：与登录页视觉一致，品牌统一
   配色：#0066FF 科技蓝 + #F7F9FC 浅灰
   ============================================ */
```

**整体容器**：
```css
.register-container {
  min-height: 100vh;
  display: flex;
  overflow: hidden;
  background: #ffffff;
}
```

**左侧品牌展示区 `.register-visual`**（与 Login 的 `.login-visual` 结构对齐）：
```css
.register-visual {
  flex: 0 0 45%;
  max-width: 640px;
  background: linear-gradient(135deg, #0066FF 0%, #0044CC 50%, #003399 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 60px;
}
.register-visual::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
}
.register-visual::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
  bottom: -200px;
  left: -200px;
  animation: pulse 8s ease-in-out infinite;
}
```

**Logo 区域**（复用 Login 的类名模式但带 register 前缀避免冲突）：
```css
.register-visual .visual-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480px;
}
.register-visual .logo-section { margin-bottom: 48px; }
.register-visual .logo-icon {
  font-size: 64px;
  color: white;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}
.register-visual .logo-title {
  color: white !important;
  font-size: 36px !important;
  font-weight: 700 !important;
  margin-bottom: 12px !important;
  letter-spacing: -0.5px;
}
.register-visual .logo-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.5px;
}
```

**价值卡片**：
```css
.value-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}
.value-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  transition: all 0.3s ease;
}
.value-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
}
.value-card-icon { font-size: 28px; color: white; flex-shrink: 0; margin-top: 2px; }
.value-card-title { color: white; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.value-card-desc { color: rgba(255, 255, 255, 0.8); font-size: 13px; line-height: 1.5; }
```

**统计行**：
```css
.register-stats-row {
  display: flex;
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}
.register-stat-item { flex: 1; }
.register-stat-value { color: white; font-size: 28px; font-weight: 700; margin-bottom: 4px; }
.register-stat-label { color: rgba(255, 255, 255, 0.8); font-size: 12px; }
```

**右侧表单区**：
```css
.register-form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 60px;
  background: #F7F9FC;
  position: relative;
  overflow-y: auto;
}
.register-form-section::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 102, 255, 0.03) 0%, transparent 70%);
  top: -100px;
  right: -100px;
  pointer-events: none;
}
```

**返回首页按钮**：
```css
.register-form-section .back-home-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  color: #666;
  font-size: 14px;
  transition: all 0.3s ease;
}
.register-form-section .back-home-btn:hover { color: #0066FF; }
```

**注册卡片**：
```css
.register-form-section .register-card {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  padding: 40px 36px;
  border: 1px solid #E8ECF0;
}
```

**注册 header**：
```css
.register-header {
  text-align: center;
  margin-bottom: 28px;
}
.register-header h2 {
  font-size: 26px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 8px;
}
.register-header .ant-typography-secondary {
  font-size: 14px;
  color: #666;
}
```

**表单样式**：
```css
.register-card .ant-form-item { margin-bottom: 16px; }
.register-card .ant-input-affix-wrapper,
.register-card .ant-input,
.register-card .ant-select-selector {
  height: 44px;
  border-radius: 8px;
  border: 1px solid #D9D9D9;
  transition: all 0.3s ease;
  font-size: 14px;
}
.register-card .ant-select-selector { display: flex; align-items: center; }
.register-card .ant-input-affix-wrapper:hover,
.register-card .ant-input:hover,
.register-card .ant-select-selector:hover { border-color: #0066FF; }
.register-card .ant-input-affix-wrapper:focus,
.register-card .ant-input-affix-wrapper-focused,
.register-card .ant-select-focused .ant-select-selector {
  border-color: #0066FF;
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.1);
}
.register-card .ant-form-item-label > label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}
```

**验证码、注册按钮、底部链接**：
```css
.register-card .captcha-code {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 3px;
  color: #0066FF;
  padding: 0 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}
.register-card .captcha-code:hover { color: #0052CC; }

.register-button {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #0066FF 0%, #0052CC 100%);
  border: none;
  margin-top: 4px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 102, 255, 0.2);
}
.register-button:hover {
  background: linear-gradient(135deg, #0052CC 0%, #003399 100%);
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  transform: translateY(-1px);
}

.register-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #F0F0F0;
}
.login-link {
  color: #0066FF;
  font-weight: 600;
  margin-left: 8px;
  transition: all 0.3s ease;
}
.login-link:hover { color: #0052CC; text-decoration: underline; }
```

**版权信息**：
```css
.register-tips {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: #999;
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
}
```

**动画**：
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
}
```

**响应式**：
```css
@media (max-width: 1024px) {
  .register-visual { flex: 0 0 40%; padding: 40px; }
  .register-visual .logo-title { font-size: 30px !important; }
}
@media (max-width: 768px) {
  .register-visual { display: none; }
  .register-form-section { padding: 40px 24px; }
  .register-form-section .register-card { padding: 36px 28px; }
  .register-form-section .back-home-btn { top: 16px; right: 16px; }
  .register-tips { position: static; transform: none; margin-top: 24px; }
}
@media (max-width: 480px) {
  .register-form-section { padding: 32px 20px; }
  .register-form-section .register-card { padding: 28px 20px; }
  .register-header h2 { font-size: 22px; }
  .register-card .ant-input-affix-wrapper,
  .register-card .ant-input,
  .register-card .ant-select-selector { height: 42px; }
  .register-button { height: 42px; }
}
```
</action>
<acceptance_criteria>
- Register.css 不包含 `#1890ff`（全部替换为 `#0066FF` 系列）
- Register.css 包含 `.register-visual` 样式（`flex: 0 0 45%`）
- Register.css 包含 `.register-form-section` 样式
- Register.css 包含 `.value-cards` 样式
- Register.css 包含 `.value-card` 样式（含 `backdrop-filter`）
- Register.css 包含 `.register-stats-row` 样式
- Register.css 包含 `.register-container` 的 `display: flex`
- Register.css 包含 `.back-home-btn` 样式
- Register.css 包含 `.register-button` 的 `linear-gradient(135deg, #0066FF`
- Register.css 包含 3 个 `@media` 查询块（1024px, 768px, 480px）
- Register.css 包含 `@keyframes pulse` 和 `@keyframes float` 动画
</acceptance_criteria>
</task>

## Verification

```bash
# 1. TypeScript 编译检查
cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30

# 2. Login 页面不受影响（TSX 未改）
git diff --stat -- src/pages/Login.tsx  # should show 0 changes

# 3. Register 结构验证
grep -c "register-visual" src/pages/Register.tsx    # >= 1
grep -c "register-form-section" src/pages/Register.tsx  # >= 1
grep -c "back-home-btn" src/pages/Register.tsx  # >= 1
grep -c "handleSubmit" src/pages/Register.tsx  # >= 1 (logic preserved)
grep -c "loadClasses" src/pages/Register.tsx  # >= 1 (logic preserved)
grep -c "classService" src/pages/Register.tsx  # >= 1 (logic preserved)

# 4. 品牌色统一
grep -c "1890ff" src/pages/Register.css  # should be 0
grep -c "0066FF" src/pages/Register.css  # should be >= 3

# 5. 无 console.log 新增（Login.tsx 未改，Register 保留原有的）
grep -c "console.log" src/pages/Login.tsx  # unchanged from original

# 6. Vite dev build 检查
npx vite build --mode development 2>&1 | tail -5
```

## must_haves

- [ ] Login 页面品牌色统一为 #0066FF 系列，左侧背景渐变更丰富
- [ ] Login 页面功能逻辑完全不变（TSX 未修改）
- [ ] Register 页面改为左右分栏布局（左侧品牌 + 右侧表单）
- [ ] Register 页面所有表单逻辑保持不变（captcha、role选择、班级选择、密码确认等）
- [ ] Register 页面品牌色从 #1890ff 统一为 #0066FF
- [ ] 两个页面都有返回首页按钮
- [ ] 注册-登录-进入系统的完整流程可以无障碍走通
- [ ] 无 TypeScript 编译错误
