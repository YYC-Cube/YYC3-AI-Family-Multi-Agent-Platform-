#!/bin/bash

# YYC³ AI Family - 路由架构测试运行脚本
# Step 1 & 2: 路由系统 + ChatRoomLayout 重构测试

echo "=========================================="
echo "YYC³ AI Family - 路由架构测试"
echo "Step 1 & 2: 路由系统 + ChatRoomLayout 重构"
echo "=========================================="
echo ""

echo "📦 检查依赖..."
if ! command -v bun &> /dev/null; then
    echo "❌ Bun 未安装，请先安装 Bun runtime"
    exit 1
fi

echo "✅ Bun 已安装"
echo ""

echo "🔍 运行路由架构测试..."
bun test tests/routing-architecture.test.tsx

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
