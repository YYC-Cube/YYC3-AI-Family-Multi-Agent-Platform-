#!/bin/bash

# YYC³ AI Family - 智能开发工具测试运行脚本
# Step 3: DevStudioLayout 测试

echo "=========================================="
echo "YYC³ AI Family - 智能开发工具测试"
echo "Step 3: DevStudioLayout + 子组件测试"
echo "=========================================="
echo ""

echo "📦 检查依赖..."
if ! command -v bun &> /dev/null; then
    echo "❌ Bun 未安装，请先安装 Bun runtime"
    exit 1
fi

echo "✅ Bun 已安装"
echo ""

echo "🔍 运行智能开发工具测试..."
bun test tests/dev-studio.test.tsx

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
