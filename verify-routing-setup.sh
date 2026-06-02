#!/bin/bash

# YYC³ AI Family - 路由架构设置验证脚本
# 验证 Step 1 & 2 所有文件是否正确创建

echo "=========================================="
echo "YYC³ AI Family - 路由架构设置验证"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
total_checks=0
passed_checks=0

# 检查文件函数
check_file() {
  total_checks=$((total_checks + 1))
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1 存在"
    passed_checks=$((passed_checks + 1))
  else
    echo -e "${RED}✗${NC} $1 缺失"
  fi
}

# 检查目录函数
check_dir() {
  total_checks=$((total_checks + 1))
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/ 目录存在"
    passed_checks=$((passed_checks + 1))
  else
    echo -e "${RED}✗${NC} $1/ 目录缺失"
  fi
}

echo "📂 检查目录结构..."
check_dir "layouts"
check_dir "tests"
echo ""

echo "📄 检查新增文件..."
check_file "routes.ts"
check_file "layouts/AppShell.tsx"
check_file "layouts/ChatRoomLayout.tsx"
check_file "tests/routing-architecture.test.tsx"
check_file "ROUTING-REFACTORING-SUMMARY.md"
check_file "run-routing-tests.sh"
check_file "verify-routing-setup.sh"
echo ""

echo "🔧 检查修改文件..."
check_file "App.tsx"
check_file "package.json"
echo ""

echo "🗂️ 检查保留文件..."
check_file "components/family/FamilyDashboard.tsx"
echo ""

echo "=========================================="
echo "验证结果: ${passed_checks}/${total_checks} 通过"
echo "=========================================="
echo ""

if [ $passed_checks -eq $total_checks ]; then
  echo -e "${GREEN}✅ 所有文件检查通过！路由架构设置完成。${NC}"
  echo ""
  echo "下一步："
  echo "1. 运行 'bun install' 安装 react-router 依赖"
  echo "2. 运行 'bun dev' 启动开发服务器"
  echo "3. 运行 './run-routing-tests.sh' 执行测试"
  exit 0
else
  echo -e "${RED}❌ 部分文件缺失，请检查设置。${NC}"
  exit 1
fi
