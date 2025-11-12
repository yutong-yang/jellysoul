#!/bin/bash
# 启动本地服务器用于测试可视化

echo "启动本地服务器..."
echo "访问地址: http://localhost:8000/visualization/"
echo "按 Ctrl+C 停止服务器"
echo ""

cd "$(dirname "$0")/.."
python3 -m http.server 8000

