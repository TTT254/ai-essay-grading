"""
FastAPI 应用入口
基于 Vibe Coding 方法论：胶水编程，能抄不写，能连不造
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

# 导入路由
from api import student, grading, teacher, auth, ai_chat, mistakes

# 创建 FastAPI 应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="K-12 AI作文批改系统后端API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(student.router, prefix=settings.API_V1_PREFIX)
app.include_router(grading.router, prefix=settings.API_V1_PREFIX)
app.include_router(teacher.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(mistakes.router, prefix=settings.API_V1_PREFIX)


# 健康检查端点
@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "status": "ok",
        "message": "AI作文批改系统API正常运行",
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
