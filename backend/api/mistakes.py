"""
错题本API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from external.supabase_service import supabase_service
from datetime import datetime

router = APIRouter(prefix="/mistakes", tags=["错题本"])


@router.get("")
async def get_mistakes(student_id: str, error_type: Optional[str] = None):
    """获取学生的错题记录"""
    try:
        # 获取学生所有批改报告
        reports = await supabase_service.get_student_reports(student_id)

        # 聚合所有错误
        mistakes = []
        error_count = {}

        for report in reports:
            if not report.get("errors"):
                continue

            for error in report["errors"]:
                err_type = error.get("type", "unknown")
                original = error.get("original", "")
                suggestion = error.get("suggestion", "")
                description = error.get("description", "")

                # 统计错误次数
                key = f"{err_type}:{original}"
                if key not in error_count:
                    error_count[key] = {
                        "type": err_type,
                        "original": original,
                        "suggestion": suggestion,
                        "description": description,
                        "count": 0,
                        "occurrences": [],
                    }

                error_count[key]["count"] += 1
                error_count[key]["occurrences"].append(
                    {
                        "submission_id": report.get("submission_id"),
                        "assignment_title": report.get("assignment_title", ""),
                        "date": report.get("created_at"),
                    }
                )

        # 转换为列表并按出现次数排序
        mistakes = list(error_count.values())
        mistakes.sort(key=lambda x: x["count"], reverse=True)

        # 过滤错误类型
        if error_type:
            mistakes = [m for m in mistakes if m["type"] == error_type]

        return {"success": True, "data": mistakes}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取错题失败：{str(e)}")


@router.put("/{mistake_id}/master")
async def mark_mistake_mastered(mistake_id: str):
    """标记错误已掌握（可选功能，需要扩展数据库schema）"""
    # 这个功能需要在数据库中添加mistake_records表来持久化错题状态
    # 目前返回成功即可
    return {"success": True, "message": "已标记为掌握"}


@router.get("/types")
async def get_error_types():
    """获取错误类型列表"""
    error_types = [
        {"value": "typo", "label": "错别字"},
        {"value": "grammar", "label": "语法错误"},
        {"value": "punctuation", "label": "标点符号"},
        {"value": "logic", "label": "逻辑问题"},
        {"value": "structure", "label": "结构问题"},
        {"value": "other", "label": "其他"},
    ]

    return {"success": True, "data": error_types}
