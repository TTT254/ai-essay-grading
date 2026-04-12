"""
教师端API路由
"""
from fastapi import APIRouter, HTTPException
from external.supabase_service import supabase_service
from external.dashscope_service import dashscope_service
from datetime import datetime

router = APIRouter(prefix="/teacher", tags=["教师端"])


@router.get("/classes")
async def get_teacher_classes(teacher_id: str):
    """获取教师的班级列表"""
    classes = await supabase_service.get_classes_by_teacher(teacher_id)
    return {"success": True, "data": classes}


@router.post("/assignments")
async def create_assignment(data: dict):
    """创建作文任务"""
    assignment = await supabase_service.create_assignment(data)

    if not assignment:
        raise HTTPException(status_code=500, detail="创建任务失败")

    return {"success": True, "data": assignment}


@router.get("/assignments")
async def get_teacher_assignments(class_id: str):
    """获取班级的所有任务"""
    assignments = await supabase_service.get_assignments_by_class(class_id)
    return {"success": True, "data": assignments}


@router.get("/assignments/{assignment_id}/submissions")
async def get_assignment_submissions(assignment_id: str):
    """获取作业的所有提交"""
    try:
        # 使用Supabase客户端直接查询
        response = supabase_service.client.table("submissions").select(
            "*, users!inner(name)"
        ).eq("assignment_id", assignment_id).order("submitted_at", desc=True).execute()

        # 格式化返回数据，添加学生姓名
        submissions = []
        for item in response.data:
            submissions.append({
                **item,
                "student_name": item.get("users", {}).get("name", "未知学生"),
            })

        return {"success": True, "data": submissions}
    except Exception as e:
        return {"success": False, "error": str(e), "data": []}


@router.post("/assignments/{assignment_id}/batch-grade")
async def batch_grade_assignment(assignment_id: str):
    """批量AI批改作业中所有未批改的提交"""
    try:
        response = supabase_service.client.table("submissions").select("*").eq(
            "assignment_id", assignment_id
        ).eq("status", "submitted").execute()

        submissions = response.data or []
        graded_count = 0

        for submission in submissions:
            submission_id = submission["id"]
            try:
                grading_result = await dashscope_service.grade_essay(
                    essay_content=submission.get("content", ""),
                    assignment_title=""
                )
                if grading_result.get("success"):
                    report_data = {
                        "submission_id": submission_id,
                        "ai_total_score": grading_result["total_score"],
                        "ai_scores": grading_result["scores"],
                        "ai_errors": grading_result["errors"],
                        "ai_comment": grading_result["comment"],
                        "final_total_score": grading_result["total_score"],
                        "final_scores": grading_result["scores"],
                        "final_comment": grading_result["comment"],
                        "graded_at": datetime.utcnow().isoformat(),
                    }
                    await supabase_service.create_grading_report(report_data)
                    await supabase_service.update_submission(submission_id, {"status": "graded"})
                    graded_count += 1
            except Exception:
                # 单篇失败不中断整体批改
                continue

        return {"success": True, "graded_count": graded_count, "total": len(submissions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量批改失败: {str(e)}")


@router.get("/classes/{class_id}/stats")
async def get_class_stats(class_id: str):
    """获取班级统计数据（真实数据）"""
    stats = await supabase_service.get_class_stats(class_id)
    return {"success": True, "data": stats}


@router.get("/classes/{class_id}/ranking")
async def get_class_ranking(class_id: str):
    """获取班级学生排行榜（按平均分降序）"""
    ranking = await supabase_service.get_class_ranking(class_id)
    return {"success": True, "data": ranking}


@router.get("/stats")
async def get_teacher_stats(teacher_id: str):
    """获取教师个人统计数据"""
    stats = await supabase_service.get_teacher_dashboard_stats(teacher_id)
    return {"success": True, "data": stats}
