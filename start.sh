#!/bin/bash

# AI作文批改系统 - 一键启动脚本

echo "======================================"
echo "   AI作文批改系统 - 启动向导"
echo "======================================"
echo ""

# 检查配置文件
echo "📋 第1步：检查配置文件..."
if [ ! -f "backend/.env" ]; then
    echo "❌ 未找到 backend/.env"
    echo "   请先创建配置文件："
    echo "   cd backend && cp .env.example .env"
    echo "   然后编辑 backend/.env 填写配置"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ 未找到 frontend/.env"
    echo "   请先创建配置文件："
    echo "   cd frontend && cp .env.example .env"
    echo "   然后编辑 frontend/.env 填写配置"
    exit 1
fi

echo "✅ 配置文件检查通过"
echo ""

# 检查依赖
echo "📦 第2步：检查依赖..."
if [ ! -d "backend/venv" ] && [ ! -f "backend/.venv" ]; then
    echo "⚠️  未检测到 Python 虚拟环境"
    echo "   建议先安装依赖："
    echo "   cd backend && pip install -r requirements.txt"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  未检测到 Node 模块"
    echo "   建议先安装依赖："
    echo "   cd frontend && npm install"
fi

echo ""
echo "======================================"
echo "🚀 准备启动项目..."
echo "======================================"
echo ""
echo "请按以下步骤手动启动（需要2个终端窗口）："
echo ""
echo "📍 终端1 - 启动后端："
echo "   cd backend"
echo "   python main.py"
echo ""
echo "📍 终端2 - 启动前端："
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "======================================"
echo "🌐 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端API文档: http://localhost:8000/docs"
echo "======================================"
