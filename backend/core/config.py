"""
应用核心配置
使用 pydantic-settings 管理环境变量
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """应用配置类"""

    # 应用基础配置
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "AI作文批改系统"
    VERSION: str = "1.0.0"

    # 跨域配置
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        """解析CORS允许的源"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # Supabase 配置
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str

    # 阿里云百炼 API
    DASHSCOPE_API_KEY: str

    # JWT 认证
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # 数据库
    DATABASE_URL: str | None = None

    # 邮件（Resend）
    RESEND_API_KEY: str = ""
    EMAIL_VERIFICATION_ENABLED: bool = False  # 启用后注册需邮箱验证码（需配置 RESEND_API_KEY）

    # 日志
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


# 创建全局配置实例
settings = Settings()
