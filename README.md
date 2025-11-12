# Subjectivity Isotype Flow Visualization

基于Web的交互式可视化系统，展示生活故事访谈数据的subjectivity isotype flow。

## 特性

- 🎨 **五彩斑斓的圆形节点**：每个人用一个独特的圆形表示
- 🌊 **流动融合效果**：相似的人通过flow连接，颜色自然过渡
- 🎯 **多维度聚类**：支持按不同维度（经历、情感、主题）进行聚类
- 🖱️ **交互式探索**：悬停、点击、筛选、缩放等交互功能
- 📊 **多种布局**：力导向、聚类圆形、层次布局

## 技术栈

- **D3.js v7**：数据可视化核心
- **Canvas API**：高性能渲染
- **原生JavaScript (ES6+)**：无框架依赖
- **Vite**：开发服务器（可选）

## 快速开始

### 1. 安装依赖

```bash
cd visualization
npm install
```

### 2. 准备数据

首先需要运行Python脚本生成可视化用的数据：

```bash
# 在data目录下
source venv_interview_processor/bin/activate
python process_interviews.py
```

### 3. 启动开发服务器

```bash
npm run dev
```

或者直接打开 `index.html`（需要本地服务器，可以用Python的http.server）：

```bash
python -m http.server 8000
```

然后在浏览器打开 `http://localhost:8000/visualization/`

## 项目结构

```
visualization/
├── index.html              # 主页面
├── src/
│   ├── main.js            # 主逻辑
│   ├── dataLoader.js      # 数据加载
│   ├── nodeRenderer.js    # 节点渲染
│   ├── flowRenderer.js    # Flow渲染
│   ├── layout.js          # 布局算法
│   ├── interaction.js     # 交互处理
│   └── style.js           # 样式配置
├── styles/
│   └── main.css          # 样式文件
└── package.json          # 依赖管理
```

## 使用说明

### 控制面板

- **维度选择**：选择要可视化的维度（经历类型、情感模式、主题内容、多维度融合）
- **相似度阈值**：调整连接线的显示阈值（0-1）
- **布局**：选择布局算法（力导向、聚类圆形、层次布局）
- **重置视图**：重置节点位置

### 交互

- **悬停节点**：查看节点信息
- **点击节点**：高亮节点和相关连接
- **拖拽**：手动调整节点位置（待实现）
- **缩放**：鼠标滚轮缩放（待实现）

## 开发计划

### Phase 1: 基础框架 ✅
- [x] 项目结构
- [x] 基础渲染
- [x] 数据加载

### Phase 2: 核心功能
- [ ] 完善节点渲染（渐变、纹理）
- [ ] 完善Flow渲染（流动动画）
- [ ] 实现布局算法
- [ ] 实现交互功能

### Phase 3: 数据增强
- [ ] 扩展特征提取（主题、经历类型）
- [ ] 实现聚类算法
- [ ] 生成可视化数据

### Phase 4: 优化
- [ ] 性能优化
- [ ] 视觉效果优化
- [ ] 响应式设计

## 注意事项

1. 数据文件路径：确保 `all_participants.json` 在正确的位置
2. 浏览器兼容性：需要支持ES6+和Canvas API的现代浏览器
3. 性能：大量节点时可能需要优化渲染

## 许可证

本项目用于学术研究目的。

