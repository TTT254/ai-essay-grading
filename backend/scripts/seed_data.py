"""
通过后端 API 初始化测试数据
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from external.supabase_service import supabase_service

async def main():
    # ============ 创建班级 ============
    print("检查班级数据...")
    existing = await supabase_service.get_all_classes()

    if existing:
        print(f"  已有 {len(existing)} 个班级")
    else:
        print("  创建班级...")
        classes = []
        for grade in range(1, 7):  # 1-6年级（小学）
            for cls_name in ["1班", "2班", "3班"]:
                classes.append({"grade": grade, "name": cls_name})
        for grade in range(7, 10):  # 7-9年级（初中）
            for cls_name in ["1班", "2班", "3班"]:
                classes.append({"grade": grade, "name": cls_name})

        res = supabase_service.client.table("classes").insert(classes).execute()
        print(f"  创建了 {len(res.data)} 个班级")
        existing = res.data

    print(f"  班级示例: {existing[:3]}")
    first_class_id = existing[0]["id"] if existing else None

    # ============ 创建测试账号 ============
    TEST_TEACHER_EMAIL = "teacher@test.com"
    TEST_TEACHER_PASSWORD = "test123456"
    TEST_STUDENT_EMAIL = "student@test.com"
    TEST_STUDENT_PASSWORD = "test123456"

    def create_user(email, password, name, role, class_id=None):
        try:
            # 检查是否已存在
            existing_users = supabase_service.client.auth.admin.list_users()
            for u in existing_users:
                if u.email == email:
                    print(f"  {email} 已存在 (id={u.id})")
                    # 确保 users 表有记录
                    payload = {"id": u.id, "email": email, "name": name, "role": role}
                    if class_id:
                        payload["class_id"] = class_id
                    supabase_service.client.table("users").upsert(payload).execute()
                    return u.id

            res = supabase_service.client.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"name": name, "role": role, "class_id": class_id},
            })
            user_id = res.user.id
            print(f"  创建: {email} (id={user_id})")

            payload = {"id": user_id, "email": email, "name": name, "role": role}
            if class_id:
                payload["class_id"] = class_id
            supabase_service.client.table("users").upsert(payload).execute()
            return user_id
        except Exception as e:
            print(f"  创建 {email} 失败: {e}")
            return None

    print("\n创建测试教师...")
    teacher_id = create_user(TEST_TEACHER_EMAIL, TEST_TEACHER_PASSWORD, "测试教师", "teacher")

    print("\n创建测试学生...")
    student_id = create_user(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD, "测试学生", "student", first_class_id)

    # 绑定教师到班级
    if teacher_id and existing:
        print("\n绑定教师到班级...")
        for cls in existing[:3]:
            supabase_service.client.table("classes").update({"teacher_id": teacher_id}).eq("id", cls["id"]).execute()
        print(f"  绑定了 {min(3, len(existing))} 个班级")

    print("\n========== 测试账号 ==========")
    print(f"教师: {TEST_TEACHER_EMAIL} / {TEST_TEACHER_PASSWORD}")
    print(f"学生: {TEST_STUDENT_EMAIL} / {TEST_STUDENT_PASSWORD}")
    print("================================")

asyncio.run(main())
