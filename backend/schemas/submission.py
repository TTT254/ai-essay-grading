"""
作文提交相关的数据模型
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SubmissionCreate(BaseModel):
    """创建提交的请求模型"""
    assignment_id: str
    content: str = Field(..., min_length=10, description="作文内容，至少10个字符")
    image_url: Optional[str] = None
    ocr_result: Optional[str] = None


class SubmissionUpdate(BaseModel):
    """更新提交的请求模型"""
    content: Optional[str] = None
    status: Optional[str] = None


class SubmissionResponse(BaseModel):
    """提交响应模型"""
    id: str
    assignment_id: str
    student_id: str
    content: str
    word_count: int
    image_url: Optional[str]
    ocr_result: Optional[str]
    status: str
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
