"""
认证API端点
处理登录、注册、验证码等功能
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import random
import string
from datetime import datetime, timedelta
from typing import Dict
import uuid

router = APIRouter(prefix="/auth", tags=["认证"])

# 内存中存储验证码（生产环境应使用Redis）
captcha_store: Dict[str, dict] = {}


class CaptchaResponse(BaseModel):
    """验证码响应"""

    captcha_id: str
    captcha_code: str  # 简单的字母数字验证码
    expires_at: str


class CaptchaVerifyRequest(BaseModel):
    """验证码验证请求"""

    captcha_id: str
    code: str


def generate_captcha_code(length: int = 6) -> str:
    """
    生成简单的字母数字验证码
    避免易混淆字符：0O, 1lI
    """
    chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    return "".join(random.choice(chars) for _ in range(length))


def cleanup_expired_captchas():
    """清理过期的验证码"""
    now = datetime.now()
    expired_ids = [
        captcha_id
        for captcha_id, data in captcha_store.items()
        if datetime.fromisoformat(data["expires_at"]) < now
    ]
    for captcha_id in expired_ids:
        del captcha_store[captcha_id]


@router.get("/captcha", response_model=CaptchaResponse)
async def get_captcha():
    """
    生成验证码
    返回验证码ID和验证码内容（前端显示）
    """
    # 清理过期验证码
    cleanup_expired_captchas()

    # 生成新验证码
    captcha_id = str(uuid.uuid4())
    captcha_code = generate_captcha_code()
    expires_at = datetime.now() + timedelta(minutes=5)

    # 存储验证码
    captcha_store[captcha_id] = {
        "code": captcha_code,
        "expires_at": expires_at.isoformat(),
        "used": False,
    }

    return CaptchaResponse(
        captcha_id=captcha_id,
        captcha_code=captcha_code,
        expires_at=expires_at.isoformat(),
    )


@router.post("/verify-captcha")
async def verify_captcha(request: CaptchaVerifyRequest):
    """
    验证验证码
    验证通过后标记为已使用
    """
    captcha_id = request.captcha_id
    code = request.code.upper()

    # 检查验证码是否存在
    if captcha_id not in captcha_store:
        raise HTTPException(status_code=400, detail="验证码不存在或已过期")

    captcha_data = captcha_store[captcha_id]

    # 检查是否已使用
    if captcha_data["used"]:
        raise HTTPException(status_code=400, detail="验证码已被使用")

    # 检查是否过期
    if datetime.fromisoformat(captcha_data["expires_at"]) < datetime.now():
        del captcha_store[captcha_id]
        raise HTTPException(status_code=400, detail="验证码已过期")

    # 验证验证码
    if captcha_data["code"] != code:
        raise HTTPException(status_code=400, detail="验证码错误")

    # 标记为已使用
    captcha_store[captcha_id]["used"] = True

    return {"success": True, "message": "验证成功"}


@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "ok",
        "captcha_count": len(captcha_store),
    }
