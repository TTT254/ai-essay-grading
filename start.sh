#!/bin/bash

# AI作文批改系统 - 一键启动脚本
# 使用方法：./start.sh

echo "======================================"
echo "   AI作文批改系统 - 一键启动"
echo "======================================"
echo ""

# 获取脚本所在目录（支持从任意位置执行）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ========== 第1步：安装后端依赖 ==========
echo "📦 [1/3] 安装后端 Python 依赖..."
cd "$SCRIPT_DIR/backend"

if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ 未找到 Python，请先安装 Python 3.10+"
    echo "   macOS: brew install python3"
    echo "   Windows: https://www.python.org/downloads/"
    exit 1
fi

# 确定 python 命令
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# 确定 pip 命令
PIP_CMD="pip3"
if ! command -v pip3 &> /dev/null; then
    PIP_CMD="pip"
fi

echo "   使用 $PYTHON_CMD ($($PYTHON_CMD --version 2>&1))"
$PIP_CMD install -r requirements.txt --quiet || {
    echo "❌ Python 依赖安装失败，尝试不带 --quiet 重新安装..."
    $PIP_CMD install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败，请检查 Python 环境"
        exit 1
    fi
}
echo "✅ 后端依赖安装完成"
echo ""

# ========== 第2步：安装前端依赖 ==========
echo "📦 [2/3] 安装前端 Node.js 依赖..."
cd "$SCRIPT_DIR/frontend"

if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js 18+"
    echo "   macOS: brew install node"
    echo "   Windows: https://nodejs.org/"
    exit 1
fi

echo "   使用 node $(node --version), npm $(npm --version)"
if [ ! -d "node_modules" ]; then
    npm install || {
        echo "❌ npm install 失败，请检查网络"
        exit 1
    }
else
    echo "   (node_modules 已存在，跳过安装)"
fi
echo "✅ 前端依赖安装完成"
echo ""

# ========== 第3步：启动服务 ==========
echo "🚀 [3/3] 启动前后端服务..."
echo ""

cd "$SCRIPT_DIR"

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 启动后端（日志输出到终端）
cd "$SCRIPT_DIR/backend"
$PYTHON_CMD main.py &
BACKEND_PID=$!

# 等待后端就绪（最多等 10 秒）
echo "   ⏳ 等待后端启动..."
READY=false
for i in $(seq 1 10); do
    sleep 1
    # 检查进程是否还活着
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo ""
        echo "❌ 后端启动失败！请检查上方错误信息。"
        echo "   常见原因："
        echo "   1. Python 依赖未安装完整 → 运行: pip3 install -r backend/requirements.txt"
        echo "   2. 端口 8000 被占用 → 运行: lsof -i :8000"
        echo "   3. .env 配置有误 → 检查 backend/.env"
        exit 1
    fi
    # 检查端口是否在监听
    if command -v curl &> /dev/null; then
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            READY=true
            break
        fi
    elif command -v nc &> /dev/null; then
        if nc -z localhost 8000 2>/dev/null; then
            READY=true
            break
        fi
    else
        # 没有 curl 也没有 nc，等 3 秒就算了
        if [ $i -ge 3 ]; then
            READY=true
            break
        fi
    fi
done

if [ "$READY" = true ]; then
    echo "   ✅ 后端已启动 (http://localhost:8000)"
else
    echo "   ⚠️  后端可能还在启动中，继续启动前端..."
fi

# 启动前端
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# 等待前端就绪
sleep 3
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ 前端启动失败！"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo "   ✅ 前端已启动 (http://localhost:5173)"

echo ""
echo "======================================"
echo "🎉 启动成功！"
echo "======================================"
echo ""
echo "🌐 访问地址："
echo "   前端页面:    http://localhost:5173"
echo "   后端API文档: http://localhost:8000/docs"
echo ""
echo "📌 测试账号："
echo "   教师: teacher@test.com / 123456"
echo "   学生: student@test.com / 123456"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "======================================"

# 等待子进程（任一退出则全部停止）
wait -n $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo ""
echo "⚠️  有服务意外退出，正在停止所有服务..."
cleanup
