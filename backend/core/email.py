"""
邮件发送服务 - 使用 Resend REST API
可选功能：当 RESEND_API_KEY 配置时发送真实邮件，否则跳过（本地开发使用内存验证码）
"""
import os
import requests
from typing import Optional

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_BASE_URL = "https://api.resend.com"


def send_email(to: str, subject: str, html: str) -> dict:
    """
    发送邮件（通过 Resend REST API）

    当 RESEND_API_KEY 未配置时，跳过发送并打印提示。
    """
    if not RESEND_API_KEY:
        print(f"[Email] RESEND_API_KEY not set, skipping email to {to}: {subject}")
        return {"success": False, "reason": "no_api_key"}

    try:
        response = requests.post(
            f"{RESEND_BASE_URL}/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": "AI作文批改 <onboarding@resend.dev>",
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=15,
        )
        result = response.json()
        if response.status_code in (200, 201):
            print(f"[Email] Sent to {to}: {subject}")
            return {"success": True, "id": result.get("id")}
        else:
            print(f"[Email] Failed to send to {to}: {response.status_code} {result}")
            return {"success": False, "error": result}
    except Exception as e:
        print(f"[Email] Exception sending to {to}: {e}")
        return {"success": False, "error": str(e)}


def send_verification_email(to: str, code: str) -> dict:
    """发送注册验证码邮件"""
    html = f"""
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0066FF;">AI作文批改系统</h2>
        <p>您的注册验证码是：</p>
        <div style="background: #F0F4FF; padding: 20px; border-radius: 8px; text-align: center; font-size: 28px; letter-spacing: 4px; color: #0066FF; font-weight: bold;">{code}</div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">验证码 5 分钟内有效，请尽快完成注册。</p>
    </div>
    """
    return send_email(to, "【AI作文批改】注册验证码", html)


def send_grading_complete_email(to: str, student_name: str, assignment_title: str) -> dict:
    """发送批改完成通知邮件"""
    html = f"""
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #0066FF;">AI作文批改系统</h2>
        <p>您好，{student_name}，您的作文《{assignment_title}》已完成批改！</p>
        <p style="color: #666;">请登录系统查看详细的批改报告和AI辅导建议。</p>
        <a href="http://localhost:5173/student/history" style="display: inline-block; background: #0066FF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">查看批改报告</a>
    </div>
    """
    return send_email(to, f"【批改完成】您的作文《{assignment_title}》已批改", html)
