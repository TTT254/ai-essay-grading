"""
学生端API路由
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
from external.dashscope_service import dashscope_service
from external.supabase_service import supabase_service
from schemas.submission import SubmissionCreate
from datetime import datetime

router = APIRouter(prefix="/student", tags=["学生端"])


@router.get("/assignments")
async def get_student_assignments(student_id: str):
    """获取学生的作文任务列表"""
    assignments = await supabase_service.get_student_assignments(student_id)
    return {"success": True, "data": assignments}


@router.post("/submissions")
async def create_submission(data: SubmissionCreate, student_id: str):
    """提交作文"""
    submission_data = {
        "assignment_id": data.assignment_id,
        "student_id": student_id,
        "content": data.content,
        "word_count": len(data.content),
        "image_url": data.image_url,
        "ocr_result": data.ocr_result,
        "status": "submitted",
        "submitted_at": datetime.utcnow().isoformat(),
    }

    submission = await supabase_service.create_submission(submission_data)

    if not submission:
        raise HTTPException(status_code=500, detail="提交失败")

    return {"success": True, "data": submission}


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """上传手写作文图片"""
    import re
    import uuid

    file_data = await file.read()

    # 获取文件扩展名
    file_ext = ""
    if file.filename and "." in file.filename:
        file_ext = file.filename.rsplit(".", 1)[-1].lower()
        # 只允许图片格式
        if file_ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
            raise HTTPException(status_code=400, detail="不支持的文件格式")
    else:
        file_ext = "jpg"  # 默认扩展名

    # 生成安全的文件名：使用UUID + 时间戳
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    safe_filename = f"{uuid.uuid4().hex[:8]}_{timestamp}.{file_ext}"
    file_path = f"essays/{safe_filename}"

    public_url = await supabase_service.upload_file("essays", file_path, file_data)

    if not public_url:
        raise HTTPException(status_code=500, detail="图片上传失败")

    return {"success": True, "url": public_url}


@router.post("/ocr")
async def ocr_recognize(image_url: str):
    """OCR识别手写文字"""
    result = await dashscope_service.ocr_recognize(image_url)
    return {"success": result["success"], "data": result}


@router.get("/submissions/history")
async def get_submission_history(student_id: str):
    """获取学生的历史提交"""
    submissions = await supabase_service.get_student_submissions(student_id)
    return {"success": True, "data": submissions}


@router.get("/reports/{submission_id}")
async def get_grading_report(submission_id: str):
    """获取批改报告"""
    report = await supabase_service.get_report_by_submission(submission_id)

    if not report:
        raise HTTPException(status_code=404, detail="报告不存在")

    return {"success": True, "data": report}


@router.get("/stats")
async def get_student_stats(student_id: str):
    """获取学生个人统计数据"""
    stats = await supabase_service.get_student_stats(student_id)
    return {"success": True, "data": stats}


@router.get("/learning-curve")
async def get_learning_curve(student_id: str):
    """获取学生学习曲线数据"""
    curve_data = await supabase_service.get_student_learning_curve(student_id)
    return {"success": True, "data": curve_data}
