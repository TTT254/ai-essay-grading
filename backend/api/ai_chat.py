"""
AI对话辅导API路由
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from external.dashscope_service import dashscope_service
from external.supabase_service import supabase_service
from datetime import datetime

router = APIRouter(prefix="/ai-chat", tags=["AI对话"])


class MessageRequest(BaseModel):
    student_id: str
    submission_id: str
    message: str


@router.post("/message")
async def send_message(request: MessageRequest):
    """发送对话消息，获取AI回复"""
    try:
        # 获取作文内容和批改报告作为上下文
        submission = await supabase_service.get_submission_by_id(request.submission_id)
        if not submission:
            raise HTTPException(status_code=404, detail="提交不存在")

        report = await supabase_service.get_report_by_submission(request.submission_id)

        # 获取作业标题
        assignment_title = "未知作文"
        if submission.get("assignment_id"):
            try:
                assignment_response = supabase_service.client.table("assignments").select("title").eq(
                    "id", submission["assignment_id"]
                ).execute()
                if assignment_response.data:
                    assignment_title = assignment_response.data[0].get("title", "未知作文")
            except Exception:
                pass

        # 构建分数摘要
        scores_summary = ""
        if report:
            scores = report.get("final_scores") or report.get("ai_scores") or {}
            total = report.get("final_total_score") or report.get("ai_total_score") or 0
            scores_summary = (
                f"总分：{total}分，"
                f"思想内容：{scores.get('content', 0)}分，"
                f"结构安排：{scores.get('structure', 0)}分，"
                f"语言表达：{scores.get('language', 0)}分，"
                f"文字书写：{scores.get('writing', 0)}分"
            )
            ai_comment = report.get("final_comment") or report.get("ai_comment") or ""
        else:
            ai_comment = ""

        # 构建系统提示词
        system_prompt = f"""你是一位资深的语文老师，正在辅导学生关于作文《{assignment_title}》的问题。

该作文得分：{scores_summary}。
AI批改意见：{ai_comment}

学生作文内容：
{submission.get('content', '')}

请根据学生的问题提供有针对性的辅导建议，语言亲切、具体、有建设性。"""

        # 获取最近3轮对话历史
        history = await supabase_service.get_conversations(request.student_id, request.submission_id)
        recent_history = history[-6:] if len(history) > 6 else history  # 最多3轮（每轮=问+答）

        # 构建消息列表（系统提示 + 历史对话 + 当前问题）
        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
        ]
        for turn in recent_history:
            messages.append({"role": "user", "content": turn.get("question", "")})
            messages.append({"role": "assistant", "content": turn.get("answer", "")})
        messages.append({"role": "user", "content": request.message})

        ai_response = await dashscope_service.chat_completion(messages)

        # 保存对话记录
        conversation_data = {
            "student_id": request.student_id,
            "submission_id": request.submission_id,
            "question": request.message,
            "answer": ai_response.get("content", "") if isinstance(ai_response, dict) else str(ai_response),
            "created_at": datetime.utcnow().isoformat(),
        }

        await supabase_service.create_conversation(conversation_data)

        return {
            "success": True,
            "message": conversation_data["answer"],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"对话失败：{str(e)}")


@router.get("/history")
async def get_conversation_history(student_id: str, submission_id: str):
    """获取对话历史"""
    conversations = await supabase_service.get_conversations(student_id, submission_id)

    return {
        "success": True,
        "data": conversations,
    }
