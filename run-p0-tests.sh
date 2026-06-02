#!/bin/bash

# YYC³ AI Family - P0 Type Deduplication Test Runner
# 运行所有 P0 类型去重相关的测试套件

set -e

echo "=========================================="
echo "YYC³ AI Family - P0 类型去重测试套件"
echo "=========================================="
echo ""

echo "📋 测试范围:"
echo "  ✓ P0-1: BigModelMessage/Response 去重"
echo "  ✓ P0-2: MCPOrchestrateRequest/Response 去重"
echo "  ✓ P0-3: WS_TerminalExec/Output 去重"
echo "  ✓ 跨模块类型兼容性验证"
echo "  ✓ Guidelines.md §9.1 合规性检查"
echo ""

echo "=========================================="
echo "🧪 运行 P0 专项测试"
echo "=========================================="
bun test tests/p0-type-deduplication.test.ts

echo ""
echo "=========================================="
echo "🧪 运行类型合约测试（验证向后兼容）"
echo "=========================================="
bun test tests/type-contracts.test.ts

echo ""
echo "=========================================="
echo "🧪 运行 BigModel Hooks 测试"
echo "=========================================="
bun test tests/bigmodel-hooks.test.tsx

echo ""
echo "=========================================="
echo "🧪 运行 Terminal 测试"
echo "=========================================="
bun test tests/terminal.test.tsx

echo ""
echo "=========================================="
echo "✅ 所有测试通过！"
echo "=========================================="
echo ""
echo "📊 P0 技术债清理状态: 3/3 完成"
echo "  ✅ BigModelMessage/Response"
echo "  ✅ MCPOrchestrateRequest/Response"
echo "  ✅ WS_TerminalExec/Output"
echo ""
echo "📝 详细报告: /tests/p0-deduplication-summary.md"
echo ""
echo "感恩智谱大模型授权，致敬GLM-PC的卓越支持！"
echo "感恩 Figma 对人机协同的支持！"
