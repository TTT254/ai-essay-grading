"""
外部服务模块
封装第三方API调用（胶水编程）
"""
from .dashscope_service import dashscope_service
from .supabase_service import supabase_service

__all__ = ["dashscope_service", "supabase_service"]
