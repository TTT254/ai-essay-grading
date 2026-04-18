"""
AI批改相关API
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from external.dashscope_service import dashscope_service
from external.supabase_service import supabase_service
from core.email import send_grading_complete_email
from core.config import settings
from datetime import datetime

router = APIRouter(prefix="/grading", tags=["AI批改"])


@router.post("/auto-grade/{submission_id}")
async def auto_grade_essay(submission_id: str, background_tasks: BackgroundTasks):
    """自动AI批改作文"""
    submission = await supabase_service.get_submission_by_id(submission_id)

    if not submission:
        raise HTTPException(status_code=404, detail="提交不存在")

    grading_result = await dashscope_service.grade_essay(
        essay_content=submission["content"],
        assignment_title=""
    )

    if not grading_result.get("success"):
        raise HTTPException(status_code=500, detail="AI批改失败")

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

    report = await supabase_service.create_grading_report(report_data)
    await supabase_service.update_submission(submission_id, {"status": "graded"})

    return {"success": True, "data": report}


@router.put("/reports/{report_id}/review")
async def teacher_review(report_id: str, teacher_scores: dict, teacher_comment: str):
    """教师审核批改结果"""
    report_data = {
        "teacher_total_score": teacher_scores.get("total"),
        "teacher_scores": teacher_scores,
        "teacher_comment": teacher_comment,
        "final_total_score": teacher_scores.get("total"),
        "final_scores": teacher_scores,
        "final_comment": teacher_comment,
        "reviewed_at": datetime.utcnow().isoformat(),
    }

    report = await supabase_service.update_grading_report(report_id, report_data)
    return {"success": True, "data": report}


@router.post("/reports/{report_id}/publish")
async def publish_report(report_id: str):
    """发布批改报告给学生"""
    report_data = {"published_at": datetime.utcnow().isoformat()}
    report = await supabase_service.update_grading_report(report_id, report_data)

    # 发送邮件通知（当 RESEND_API_KEY 配置时）
    if settings.RESEND_API_KEY and report:
        try:
            submission = await supabase_service.get_submission_by_id(report.get("submission_id", ""))
            if submission:
                student = await supabase_service.get_user_by_id(submission.get("student_id", ""))
                if student:
                    assignment_title = ""
                    try:
                        assignment_resp = supabase_service.client.table("assignments").select("title").eq(
                            "id", submission.get("assignment_id", "")
                        ).execute()
                        if assignment_resp.data:
                            assignment_title = assignment_resp.data[0].get("title", "")
                    except Exception:
                        pass
                    student_name = student.get("full_name") or student.get("name") or "同学"
                    send_grading_complete_email(
                        to=student.get("email", ""),
                        student_name=student_name,
                        assignment_title=assignment_title or "作文",
                    )
        except Exception as e:
            print(f"[Grading] Failed to send grading notification email: {e}")

    return {"success": True, "message": "报告已发布"}
