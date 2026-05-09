#!/bin/bash

# ============================================================================
# Course AI Tutor - Playwright E2E 测试执行脚本
# ============================================================================
# 使用说明：
# 1. 确保Node.js已安装 (node >= 18)
# 2. 确保前端服务运行在 http://localhost:8080
# 3. 确保后端服务运行在 http://localhost:8081
# 4. 执行: bash run-playwright-tests.sh
# ============================================================================

echo "============================================================================"
echo "  Course AI Tutor - Playwright E2E 测试"
echo "  测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js"
    echo "请安装Node.js >= 18"
    echo ""
    echo "安装方法:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js版本: $NODE_VERSION"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm版本: $NPM_VERSION"

# 进入前端目录
cd "$(dirname "$0")/course-ai-tutor-frontend" || exit 1

echo ""
echo "📁 工作目录: $(pwd)"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "⚠️  未找到node_modules，正在安装依赖..."
    npm install
    echo ""
fi

# 检查Playwright
if ! npx playwright --version &> /dev/null; then
    echo "⚠️  Playwright未安装，正在安装..."
    npm install -D @playwright/test
    npx playwright install chromium
    echo ""
fi

# 检查服务可用性
echo "🔍 检查服务状态..."

FRONTEND_OK=false
BACKEND_OK=false

# 检查前端服务
if curl -s http://localhost:8080/api/health | grep -q "ok"; then
    echo "  ✅ 前端服务: http://localhost:8080 (运行中)"
    FRONTEND_OK=true
else
    echo "  ❌ 前端服务: http://localhost:8080 (未运行)"
fi

# 检查后端服务
if curl -s http://localhost:8081/api/health | grep -q "ok"; then
    echo "  ✅ 后端服务: http://localhost:8081 (运行中)"
    BACKEND_OK=true
else
    echo "  ❌ 后端服务: http://localhost:8081 (未运行)"
fi

echo ""

if [ "$FRONTEND_OK" = false ] || [ "$BACKEND_OK" = false ]; then
    echo "⚠️  警告: 部分服务未运行，测试可能失败"
    echo ""
    read -p "是否继续执行测试? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "测试已取消"
        exit 0
    fi
fi

# 执行测试
echo "============================================================================"
echo "  开始执行Playwright E2E测试"
echo "============================================================================"
echo ""

# 创建测试报告目录
mkdir -p tests/reports

# 执行所有测试
echo "📋 执行完整测试套件..."
echo ""

npx playwright test \
  --reporter=list,html,json \
  --timeout=60000 \
  --retries=1

TEST_EXIT_CODE=$?

echo ""
echo "============================================================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "  ✅ 测试全部通过"
    echo "  评级: A (优秀)"
else
    echo "  ⚠️  部分测试失败"
    echo "  请查看测试报告了解详情"
fi

echo "============================================================================"
echo ""

# 显示报告位置
echo "📊 测试报告位置:"
echo "  HTML报告: tests/reports/html/index.html"
echo "  JSON报告: tests/reports/results.json"
echo ""

# 尝试打开HTML报告
if command -v xdg-open &> /dev/null; then
    read -p "是否打开HTML测试报告? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open tests/reports/html/index.html
    fi
fi

echo ""
echo "============================================================================"
echo "  测试完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================================"

exit $TEST_EXIT_CODE
