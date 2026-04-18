# Supabase Storage 配置指南

## 问题描述

学生提交作文页面上传图片时报错：
```
Bucket not found
文件上传失败: {'statusCode': 404, 'error': Bucket not found, 'message': Bucket not found}
```

## 解决方案

需要在 Supabase 中创建 Storage Bucket。

### 1. 创建 Storage Bucket

1. 打开 Supabase Dashboard
2. 进入 **Storage** 页面
3. 点击 **New bucket** 按钮
4. 创建 bucket：
   - **Name**: `essays`
   - **Public bucket**: ✅ 勾选（允许公开访问）
   - 点击 **Create bucket**

### 2. 配置 Bucket 策略

创建 bucket 后，需要设置访问策略允许上传和读取：

```sql
-- 在 Supabase SQL Editor 中执行

-- 允许认证用户上传文件到 essays bucket
CREATE POLICY "允许认证用户上传作文图片"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'essays');

-- 允许所有人读取 essays bucket 的文件（因为是公开bucket）
CREATE POLICY "允许所有人读取作文图片"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'essays');

-- 允许用户删除自己上传的文件
CREATE POLICY "允许用户删除自己的图片"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'essays' AND auth.uid()::text = owner);
```

### 3. 验证配置

创建完成后，可以在 Supabase Dashboard → Storage → essays 中：
- 手动上传一个测试图片
- 查看文件URL
- 确认可以访问

### 4. 测试上传功能

1. 回到前端 http://localhost:5173/student/submit/{assignmentId}
2. 切换到"上传手写作文"标签
3. 拖拽或点击上传图片
4. 应该能看到：
   - ✅ 上传进度
   - ✅ 图片预览
   - ✅ OCR识别结果（如果配置了AI）

## 常见问题

### Q1: 为什么要设置为公开 bucket？
A: 因为学生和教师都需要查看作文图片，设置为公开可以简化权限管理。如果担心安全，可以设置为私有并调整策略。

### Q2: 如果不想使用 Storage 功能怎么办？
A: 可以暂时跳过图片上传，直接使用在线编辑功能提交文本。或者注释掉上传相关的代码。

### Q3: Storage 容量限制是多少？
A: Supabase 免费版提供 1GB 存储空间，足够测试使用。

### Q4: 上传失败显示 InvalidKey 错误？
A: 这通常是因为文件名包含中文字符或特殊字符。已在 `backend/api/student.py` 中修复，现在会自动生成安全的文件名（UUID + 时间戳）。重启后端服务即可生效。

## 文件上传流程

```
学生端
  ↓
上传图片 → /api/student/upload-image
  ↓
Supabase Storage (essays bucket)
  ↓
返回公开 URL
  ↓
（可选）OCR 识别 → 通义千问
  ↓
在编辑器中显示识别结果
  ↓
提交作文
```

## 相关文件

- **后端上传逻辑**: `backend/api/student.py` (第 43-53 行)
- **前端上传组件**: `frontend/src/pages/student/Submit.tsx` (第 43-68 行)
- **Supabase 服务**: `backend/external/supabase_service.py`

## 快速命令

如果使用 Supabase CLI，可以通过命令行创建：

```bash
supabase storage create essays --public
```

## 注意事项

1. ⚠️ Bucket 名称必须是 `essays`（与代码中一致）
2. ⚠️ 确保设置为 Public bucket 或配置正确的 RLS 策略
3. ⚠️ 如果修改了 bucket 名称，需要同步修改后端代码

## 测试清单

- [ ] 在 Supabase Dashboard 中创建 `essays` bucket
- [ ] 设置 bucket 为 Public
- [ ] 配置 Storage 策略（可选）
- [ ] 测试上传功能
- [ ] 验证图片可以访问
- [ ] 测试 OCR 功能（需要配置 AI API Key）
