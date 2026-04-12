"""
Supabase客户端封装
使用官方SDK进行数据库操作（胶水编程）
"""
from supabase import create_client, Client
from core.config import settings
from typing import Optional


class SupabaseService:
    """Supabase服务封装类"""

    def __init__(self):
        """初始化Supabase客户端"""
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY  # 使用Service Key以获得完全访问权限
        )

    # ============ 用户相关操作 ============

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """根据ID获取用户信息"""
        try:
            response = self.client.table("users").select("*").eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"获取用户失败: {str(e)}")
            return None

    async def update_user(self, user_id: str, data: dict) -> Optional[dict]:
        """更新用户信息"""
        try:
            response = self.client.table("users").update(data).eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"更新用户失败: {str(e)}")
            return None

    # ============ 班级相关操作 ============

    async def get_all_classes(self) -> list:
        """获取所有班级"""
        try:
            response = self.client.table("classes").select("*").execute()
            return response.data
        except Exception as e:
            print(f"获取班级列表失败: {str(e)}")
            return []

    async def get_classes_by_teacher(self, teacher_id: str) -> list:
        """获取教师的班级列表"""
        try:
            response = (
                self.client.table("classes")
                .select("*")
                .eq("teacher_id", teacher_id)
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"获取教师班级失败: {str(e)}")
            return []

    async def get_class_stats(self, class_id: str) -> dict:
        """获取班级统计数据（真实数据）"""
        try:
            # 获取班级所有作业
            assignments_response = (
                self.client.table("assignments")
                .select("id, title")
                .eq("class_id", class_id)
                .order("created_at", desc=False)
                .execute()
            )
            assignments = assignments_response.data or []
            assignment_ids = [a["id"] for a in assignments]

            if not assignment_ids:
                return {
                    "total_assignments": 0,
                    "total_submissions": 0,
                    "graded_count": 0,
                    "average_score": 0,
                    "score_distribution": [0, 0, 0, 0, 0],
                    "assignment_avg_scores": [],
                }

            # 获取这些作业的所有提交及批改报告
            submissions_response = (
                self.client.table("submissions")
                .select("id, assignment_id, status, grading_reports(final_total_score, published_at)")
                .in_("assignment_id", assignment_ids)
                .execute()
            )
            submissions = submissions_response.data or []

            total_submissions = len(submissions)
            graded_submissions = [
                s for s in submissions
                if s.get("grading_reports")
                and len(s["grading_reports"]) > 0
                and s["grading_reports"][0].get("final_total_score") is not None
            ]
            graded_count = len(graded_submissions)

            # 计算平均分
            scores = [
                float(s["grading_reports"][0]["final_total_score"])
                for s in graded_submissions
            ]
            average_score = round(sum(scores) / len(scores), 1) if scores else 0

            # 分数分布 [0-59, 60-69, 70-79, 80-89, 90-100]
            distribution = [0, 0, 0, 0, 0]
            for score in scores:
                if score < 60:
                    distribution[0] += 1
                elif score < 70:
                    distribution[1] += 1
                elif score < 80:
                    distribution[2] += 1
                elif score < 90:
                    distribution[3] += 1
                else:
                    distribution[4] += 1

            # 每个作业的平均分（用于趋势图）
            assignment_avg_scores = []
            for a in assignments:
                a_submissions = [
                    s for s in graded_submissions
                    if s["assignment_id"] == a["id"]
                ]
                if a_submissions:
                    a_scores = [float(s["grading_reports"][0]["final_total_score"]) for s in a_submissions]
                    assignment_avg_scores.append({
                        "title": a["title"],
                        "avg_score": round(sum(a_scores) / len(a_scores), 1),
                        "count": len(a_submissions),
                    })

            return {
                "total_assignments": len(assignments),
                "total_submissions": total_submissions,
                "graded_count": graded_count,
                "average_score": average_score,
                "score_distribution": distribution,
                "assignment_avg_scores": assignment_avg_scores,
            }
        except Exception as e:
            print(f"获取班级统计失败: {str(e)}")
            return {
                "total_assignments": 0,
                "total_submissions": 0,
                "graded_count": 0,
                "average_score": 0,
                "score_distribution": [0, 0, 0, 0, 0],
                "assignment_avg_scores": [],
            }

    async def get_teacher_dashboard_stats(self, teacher_id: str) -> dict:
        """获取教师仪表盘统计数据（total_classes, total_assignments, pending_grading, weekly_graded）"""
        try:
            from datetime import datetime, timedelta

            # 班级数
            classes_response = (
                self.client.table("classes")
                .select("id")
                .eq("teacher_id", teacher_id)
                .execute()
            )
            class_ids = [c["id"] for c in (classes_response.data or [])]
            total_classes = len(class_ids)

            # 作业数
            assignments_response = (
                self.client.table("assignments")
                .select("id")
                .eq("teacher_id", teacher_id)
                .execute()
            )
            assignment_ids = [a["id"] for a in (assignments_response.data or [])]
            total_assignments = len(assignment_ids)

            if not assignment_ids:
                return {
                    "total_classes": total_classes,
                    "total_assignments": total_assignments,
                    "pending_grading": 0,
                    "weekly_graded": 0,
                }

            # 待批改数（status = 'submitted'，尚未有批改报告）
            pending_response = (
                self.client.table("submissions")
                .select("id")
                .in_("assignment_id", assignment_ids)
                .eq("status", "submitted")
                .execute()
            )
            pending_grading = len(pending_response.data or [])

            # 本周已批改数（grading_reports.graded_at >= 7天前）
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
            weekly_response = (
                self.client.table("grading_reports")
                .select("id, submissions!inner(assignment_id)")
                .gte("graded_at", seven_days_ago)
                .execute()
            )
            # 过滤属于该教师作业的报告
            weekly_graded = len([
                r for r in (weekly_response.data or [])
                if r.get("submissions") and r["submissions"].get("assignment_id") in assignment_ids
            ])

            return {
                "total_classes": total_classes,
                "total_assignments": total_assignments,
                "pending_grading": pending_grading,
                "weekly_graded": weekly_graded,
            }
        except Exception as e:
            print(f"获取教师仪表盘统计失败: {str(e)}")
            return {
                "total_classes": 0,
                "total_assignments": 0,
                "pending_grading": 0,
                "weekly_graded": 0,
            }

    async def get_class_by_id(self, class_id: str) -> Optional[dict]:
        """根据ID获取班级信息"""
        try:
            response = self.client.table("classes").select("*").eq("id", class_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"获取班级失败: {str(e)}")
            return None

    # ============ 作文任务相关操作 ============

    async def create_assignment(self, data: dict) -> Optional[dict]:
        """创建作文任务"""
        try:
            response = self.client.table("assignments").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"创建任务失败: {str(e)}")
            return None

    async def get_assignments_by_class(self, class_id: str) -> list:
        """获取班级的所有任务"""
        try:
            response = (
                self.client.table("assignments")
                .select("*")
                .eq("class_id", class_id)
                .order("created_at", desc=True)
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"获取任务列表失败: {str(e)}")
            return []

    async def get_student_assignments(self, student_id: str) -> list:
        """获取学生的所有任务（通过班级）"""
        try:
            # 先获取学生所在班级
            user = await self.get_user_by_id(student_id)
            if not user or not user.get("class_id"):
                return []

            # 获取班级的所有任务
            response = (
                self.client.table("assignments")
                .select("*")
                .eq("class_id", user["class_id"])
                .order("deadline", desc=False)
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"获取学生任务失败: {str(e)}")
            return []

    # ============ 作文提交相关操作 ============

    async def create_submission(self, data: dict) -> Optional[dict]:
        """创建作文提交"""
        try:
            response = self.client.table("submissions").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"创建提交失败: {str(e)}")
            return None

    async def update_submission(self, submission_id: str, data: dict) -> Optional[dict]:
        """更新作文提交"""
        try:
            response = (
                self.client.table("submissions")
                .update(data)
                .eq("id", submission_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"更新提交失败: {str(e)}")
            return None

    async def get_submission_by_id(self, submission_id: str) -> Optional[dict]:
        """根据ID获取提交"""
        try:
            response = self.client.table("submissions").select("*").eq("id", submission_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"获取提交失败: {str(e)}")
            return None

    async def get_student_submissions(self, student_id: str) -> list:
        """获取学生的所有提交"""
        try:
            response = (
                self.client.table("submissions")
                .select("*")
                .eq("student_id", student_id)
                .order("created_at", desc=True)
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"获取学生提交列表失败: {str(e)}")
            return []

    # ============ 批改报告相关操作 ============

    async def create_grading_report(self, data: dict) -> Optional[dict]:
        """创建批改报告"""
        try:
            response = self.client.table("grading_reports").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"创建批改报告失败: {str(e)}")
            return None

    async def update_grading_report(self, report_id: str, data: dict) -> Optional[dict]:
        """更新批改报告"""
        try:
            response = (
                self.client.table("grading_reports")
                .update(data)
                .eq("id", report_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"更新批改报告失败: {str(e)}")
            return None

    async def get_report_by_submission(self, submission_id: str) -> Optional[dict]:
        """根据提交ID获取批改报告"""
        try:
            response = (
                self.client.table("grading_reports")
                .select("*")
                .eq("submission_id", submission_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"获取批改报告失败: {str(e)}")
            return None

    async def get_student_reports(self, student_id: str) -> list:
        """获取学生的所有批改报告"""
        try:
            response = (
                self.client.table("grading_reports")
                .select("*, submissions!inner(student_id)")
                .eq("submissions.student_id", student_id)
                .order("created_at", desc=True)
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"获取学生报告失败: {str(e)}")
            return []

    # ============ AI对话相关操作 ============

    async def create_conversation(self, data: dict) -> Optional[dict]:
        """创建对话记录"""
        try:
            response = self.client.table("ai_conversations").insert(data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"创建对话记录失败: {str(e)}")
            return None

    async def get_conversations(self, student_id: str, submission_id: str) -> list:
        """获取对话历史"""
        try:
            response = (
                self.client.table("ai_conversations")
                .select("*")
                .eq("student_id", student_id)
                .eq("submission_id", submission_id)
                .order("created_at", desc=False)
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"获取对话历史失败: {str(e)}")
            return []

    # ============ 文件上传相关操作 ============

    async def upload_file(self, bucket: str, path: str, file_data: bytes) -> Optional[str]:
        """上传文件到Supabase Storage"""
        try:
            response = self.client.storage.from_(bucket).upload(path, file_data)
            # 获取公开URL
            public_url = self.client.storage.from_(bucket).get_public_url(path)
            return public_url
        except Exception as e:
            print(f"文件上传失败: {str(e)}")
            return None

    # ============ 统计相关操作 ============

    async def get_student_stats(self, student_id: str) -> dict:
        """获取学生统计数据"""
        try:
            # 查询学生的所有已批改提交
            response = (
                self.client.table("submissions")
                .select("id, submitted_at, grading_reports(final_total_score, published_at)")
                .eq("student_id", student_id)
                .in_("status", ["graded", "published"])
                .execute()
            )

            submissions = response.data or []

            # 过滤出已发布分数的提交
            graded_submissions = [
                s for s in submissions
                if s.get("grading_reports")
                and len(s["grading_reports"]) > 0
                and s["grading_reports"][0].get("published_at") is not None
                and s["grading_reports"][0].get("final_total_score") is not None
            ]

            # 计算统计数据
            total_submitted = len([s for s in submissions if s.get("submitted_at")])

            if graded_submissions:
                scores = [s["grading_reports"][0]["final_total_score"] for s in graded_submissions]
                avg_score = round(sum(scores) / len(scores), 2)
                max_score = round(max(scores), 2)
            else:
                avg_score = 0
                max_score = 0

            return {
                "total_submitted": total_submitted,
                "total_graded": len(graded_submissions),
                "average_score": avg_score,
                "highest_score": max_score,
            }
        except Exception as e:
            print(f"获取学生统计失败: {str(e)}")
            return {
                "total_submitted": 0,
                "total_graded": 0,
                "average_score": 0,
                "highest_score": 0,
            }

    async def get_student_learning_curve(self, student_id: str) -> list:
        """获取学生学习曲线数据（含各维度分数）"""
        try:
            response = (
                self.client.table("submissions")
                .select("submitted_at, assignments(title), grading_reports(final_total_score, final_scores, published_at)")
                .eq("student_id", student_id)
                .in_("status", ["graded", "published"])
                .order("submitted_at", desc=False)
                .execute()
            )

            submissions = response.data or []

            # 过滤并格式化数据
            curve_data = []
            for s in submissions:
                if (s.get("grading_reports")
                    and len(s["grading_reports"]) > 0
                    and s["grading_reports"][0].get("published_at") is not None
                    and s["grading_reports"][0].get("final_total_score") is not None
                    and s.get("submitted_at")):

                    report = s["grading_reports"][0]
                    final_scores = report.get("final_scores") or {}
                    curve_data.append({
                        "date": s["submitted_at"],
                        "score": round(float(report["final_total_score"]), 2),
                        "content_score": round(float(final_scores.get("content", 0)), 2),
                        "structure_score": round(float(final_scores.get("structure", 0)), 2),
                        "language_score": round(float(final_scores.get("language", 0)), 2),
                        "title": s["assignments"][0]["title"] if s.get("assignments") and len(s["assignments"]) > 0 else "未知作业",
                    })

            return curve_data
        except Exception as e:
            print(f"获取学习曲线失败: {str(e)}")
            return []

    async def get_class_ranking(self, class_id: str) -> list:
        """获取班级学生排行榜（按平均分降序）"""
        try:
            # 获取班级所有学生
            students_response = (
                self.client.table("users")
                .select("id, name")
                .eq("class_id", class_id)
                .eq("role", "student")
                .execute()
            )
            students = students_response.data or []
            if not students:
                return []

            student_ids = [s["id"] for s in students]
            student_map = {s["id"]: s["name"] for s in students}

            # 获取这些学生的已发布提交和分数
            submissions_response = (
                self.client.table("submissions")
                .select("student_id, submitted_at, grading_reports(final_total_score, published_at)")
                .in_("student_id", student_ids)
                .in_("status", ["graded", "published"])
                .execute()
            )
            submissions = submissions_response.data or []

            # 按学生聚合
            from collections import defaultdict
            student_data: dict = defaultdict(lambda: {"scores": [], "count": 0, "last_submitted": None})
            for s in submissions:
                sid = s["student_id"]
                reports = s.get("grading_reports") or []
                if reports and reports[0].get("published_at") and reports[0].get("final_total_score") is not None:
                    student_data[sid]["scores"].append(float(reports[0]["final_total_score"]))
                    student_data[sid]["count"] += 1
                    submitted_at = s.get("submitted_at")
                    if submitted_at and (student_data[sid]["last_submitted"] is None or submitted_at > student_data[sid]["last_submitted"]):
                        student_data[sid]["last_submitted"] = submitted_at

            # 构建排行榜
            ranking = []
            for sid, data in student_data.items():
                if data["scores"]:
                    avg = round(sum(data["scores"]) / len(data["scores"]), 2)
                    ranking.append({
                        "student_id": sid,
                        "student_name": student_map.get(sid, "未知"),
                        "average_score": avg,
                        "submission_count": data["count"],
                        "last_submitted": data["last_submitted"],
                    })

            ranking.sort(key=lambda x: x["average_score"], reverse=True)
            for i, item in enumerate(ranking):
                item["rank"] = i + 1

            return ranking
        except Exception as e:
            print(f"获取班级排行榜失败: {str(e)}")
            return []

    async def get_teacher_stats(self, teacher_id: str) -> dict:
        """获取教师统计数据"""
        try:
            # 查询教师的所有作业
            assignments_response = (
                self.client.table("assignments")
                .select("id")
                .eq("teacher_id", teacher_id)
                .execute()
            )

            assignment_ids = [a["id"] for a in (assignments_response.data or [])]

            if not assignment_ids:
                return {
                    "total_graded": 0,
                    "average_grading_time": 0,
                    "recent_activity": 0,
                }

            # 查询这些作业的所有提交和批改报告
            submissions_response = (
                self.client.table("submissions")
                .select("id, submitted_at, grading_reports(reviewed_at, graded_at)")
                .in_("assignment_id", assignment_ids)
                .execute()
            )

            submissions = submissions_response.data or []

            # 统计已审核的作业数
            reviewed_submissions = [
                s for s in submissions
                if s.get("grading_reports")
                and len(s["grading_reports"]) > 0
                and s["grading_reports"][0].get("reviewed_at") is not None
            ]

            total_graded = len(reviewed_submissions)

            # 计算平均批改时间（分钟）
            grading_times = []
            for s in reviewed_submissions:
                report = s["grading_reports"][0]
                if report.get("reviewed_at") and report.get("graded_at"):
                    from datetime import datetime
                    reviewed = datetime.fromisoformat(report["reviewed_at"].replace("Z", "+00:00"))
                    graded = datetime.fromisoformat(report["graded_at"].replace("Z", "+00:00"))
                    time_diff = (reviewed - graded).total_seconds() / 60  # 转换为分钟
                    if time_diff > 0:  # 只计算有效时间差
                        grading_times.append(time_diff)

            avg_grading_time = round(sum(grading_times) / len(grading_times), 2) if grading_times else 0

            # 统计最近7天的活跃度
            from datetime import datetime, timedelta
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()

            recent_activity = len([
                s for s in reviewed_submissions
                if s["grading_reports"][0].get("reviewed_at") >= seven_days_ago
            ])

            return {
                "total_graded": total_graded,
                "average_grading_time": avg_grading_time,
                "recent_activity": recent_activity,
            }
        except Exception as e:
            print(f"获取教师统计失败: {str(e)}")
            return {
                "total_graded": 0,
                "average_grading_time": 0,
                "recent_activity": 0,
            }


# 创建全局实例
supabase_service = SupabaseService()
