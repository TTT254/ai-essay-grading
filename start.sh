#!/bin/bash

# AI作文批改系统 - 一键启动脚本
# 使用方法：./start.sh

set -e

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

$PIP_CMD install -r requirements.txt -q 2>/dev/null || $PIP_CMD install -r requirements.txt
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

if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   (node_modules 已存在，跳过安装)"
fi
echo "✅ 前端依赖安装完成"
echo ""

# ========== 第3步：启动服务 ==========
echo "🚀 [3/3] 启动前后端服务..."
echo ""

cd "$SCRIPT_DIR"

# 清理旧进程（如果有）
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# 启动后端
cd "$SCRIPT_DIR/backend"
$PYTHON_CMD main.py &
BACKEND_PID=$!
echo "   ✅ 后端已启动 (PID: $BACKEND_PID)"

# 等待后端就绪
sleep 2

# 启动前端
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "   ✅ 前端已启动 (PID: $FRONTEND_PID)"

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

# 等待子进程
wait
