# SQL 脚本修复说明

## ✅ 已修复的问题

**问题类型**: PostgreSQL 外键约束语法错误

**错误原因**:
在 PostgreSQL 中，`NOT NULL` 约束必须放在 `REFERENCES` 子句之前，而 `ON DELETE CASCADE` 必须紧跟在 `REFERENCES` 子句之后。

### 修复详情

以下行的语法已修复：

| 行号 | 表名 | 字段 | 原语法 | 修复后语法 |
|-----|------|------|---------|-----------|
| 69 | assignments | teacher_id | `UUID REFERENCES ... NOT NULL` | `UUID NOT NULL REFERENCES ... ON DELETE CASCADE` |
| 70 | assignments | class_id | `UUID REFERENCES ... NOT NULL` | `UUID NOT NULL REFERENCES ... ON DELETE CASCADE` |
| 89 | submissions | assignment_id | `UUID REFERENCES ... NOT NULL ON DELETE CASCADE` | `UUID NOT NULL REFERENCES ... ON DELETE CASCADE` |
| 90 | submissions | student_id | `UUID REFERENCES ... NOT NULL` | `UUID NOT NULL REFERENCES ... ON DELETE CASCADE` |
| 117 | grading_reports | submission_id | `UUID REFERENCES ... NOT NULL UNIQUE` | `UUID NOT NULL UNIQUE REFERENCES ... ON DELETE CASCADE` |
| 150 | mistake_records | student_id | `UUID REFERENCES ... NOT NULL` | `UUID NOT NULL REFERENCES ... ON DELETE CASCADE` |
| 170 | ai_conversations | student_id | `UUID REFERENCES ... NOT NULL` | `UUID NOT NULL REFERENCES ... ON DELETE CASCADE` |

### 正确的语法规则

```sql
-- ✅ 正确写法
column_name UUID NOT NULL REFERENCES table(id) ON DELETE CASCADE

-- ❌ 错误写法
column_name UUID REFERENCES table(id) NOT NULL ON DELETE CASCADE
```

## 🚀 现在可以执行

SQL 脚本已修复，现在可以在 Supabase SQL Editor 中执行了：

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制 `docs/supabase-init.sql` 的完整内容
4. 粘贴到 SQL Editor
5. 点击 **Run** 执行

应该不会再有语法错误了！

## 📋 已添加的改进

除了修复语法错误，还统一添加了 `ON DELETE CASCADE`，确保：
- 当用户被删除时，自动删除其相关的所有数据
- 当作业被删除时，自动删除相关的提交和批改
- 保持数据一致性

---

**修复时间**: 2026-01-11
**修复文件**: `docs/supabase-init.sql`
