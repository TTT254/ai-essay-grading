#!/bin/bash

# AI作文批改系统 - 配置检查脚本

echo "======================================"
echo "   AI作文批改系统 - 配置检查"
echo "======================================"
echo ""

# 检查后端配置
echo "📋 检查后端配置..."
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env 文件存在"

    # 检查必需的环境变量
    required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_KEY" "SUPABASE_ANON_KEY" "DASHSCOPE_API_KEY" "SECRET_KEY")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" backend/.env && ! grep -q "^${var}=.*xxxxx" backend/.env && ! grep -q "^${var}=.*your-" backend/.env; then
            echo "   ✅ ${var} 已配置"
        else
            echo "   ❌ ${var} 未配置或使用默认值"
        fi
    done
else
    echo "❌ backend/.env 文件不存在"
    echo "   请执行: cd backend && cp .env.example .env"
fi

echo ""

# 检查前端配置
echo "📋 检查前端配置..."
if [ -f "frontend/.env" ]; then
    echo "✅ frontend/.env 文件存在"

    # 检查必需的环境变量
    required_vars=("VITE_API_BASE_URL" "VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" frontend/.env && ! grep -q "^${var}=.*xxxxx" frontend/.env; then
            echo "   ✅ ${var} 已配置"
        else
            echo "   ❌ ${var} 未配置或使用默认值"
        fi
    done
else
    echo "❌ frontend/.env 文件不存在"
    echo "   请执行: cd frontend && cp .env.example .env"
fi

echo ""
echo "======================================"
echo "📚 配置指南: 查看 CONFIG_GUIDE.md"
echo "======================================"
