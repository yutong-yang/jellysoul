/**
 * Subjectivity Isotype Flow Visualization
 * 主入口文件
 */

// d3通过CDN全局引入，不需要import
import { DataLoader } from './dataLoader.js';
import { NodeRenderer } from './nodeRenderer.js';
import { FlowRenderer } from './flowRenderer.js';
import { LayoutManager } from './layout.js';
import { InteractionHandler } from './interaction.js';
import { StyleConfig } from './style.js';
import { ClusterFusion } from './clusterFusion.js';

class VisualizationApp {
    constructor() {
        this.infoPanelWidth = 450;
        this.width = window.innerWidth - this.infoPanelWidth; // 减去侧边栏宽度
        this.height = window.innerHeight - 100; // 减去header高度
        
        this.data = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.renderScheduled = false; // 防止重复渲染
        this.highlightedNode = null; // 高亮的节点
        this.highlightedLinks = []; // 高亮的连接
        
        // 视图变换
        this.transform = d3.zoomIdentity;
        this.zoom = null;
        
        // 配置
        this.config = {
            dimension: 'multidimensional', // 默认使用多维度（有数据）
            similarityThreshold: 0.95, // 高阈值以形成多个独立的聚类
            layout: 'force',
            showLabels: false,
            visualMode: 'isotype' // isotype设计或simple简单圆形
        };
        
        // 聚类融合
        this.showClusterFusion = true; // 是否显示聚类融合（将在initComponents中初始化）
        
        // 初始化组件
        this.initComponents();
        this.setupEventListeners();
    }
    
    initComponents() {
        // 创建SVG容器组（用于zoom变换）
        this.svg = d3.select('#main-svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .attr('preserveAspectRatio', 'none');
        
        // 创建容器组用于zoom
        this.svgContainer = this.svg.append('g').attr('class', 'zoom-container');
        
        // 创建Canvas用于Flow渲染
        this.canvas = document.getElementById('flow-canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化zoom行为
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .filter((event) => {
                // 允许滚轮缩放
                if (event.type === 'wheel') return true;
                // 允许鼠标拖动（左键），但点击交互层内的元素时不触发拖动
                if (event.type === 'mousedown' && event.button === 0) {
                    const target = event.target;
                    // 如果点击的是交互层的circle，不触发zoom
                    if (target && target.classList && target.classList.contains('interaction-layer')) {
                        return false;
                    }
                    // 检查是否在交互层内
                    const interactionLayer = this.svg.select('.interaction-layer').node();
                    if (interactionLayer && interactionLayer.contains && interactionLayer.contains(target)) {
                        return false;
                    }
                    return true;
                }
                return true;
            })
            .on('zoom', (event) => {
                this.transform = event.transform;
                this.svgContainer.attr('transform', event.transform);
                // Canvas需要手动应用变换
                this.render();
                // 更新交互层位置（交互层在zoom容器内，会自动应用变换）
            });
        
        this.svg.call(this.zoom);
        
        // 初始化组件
        this.dataLoader = new DataLoader();
        this.nodeRenderer = new NodeRenderer(this.svgContainer, this.canvas, this.ctx);
        this.flowRenderer = new FlowRenderer(this.canvas, this.ctx);
        this.layoutManager = new LayoutManager(this.width, this.height);
        this.interactionHandler = new InteractionHandler(this.svg, this);
        this.styleConfig = new StyleConfig();
        this.clusterFusion = new ClusterFusion(this.canvas, this.ctx);
    }
    
    setupEventListeners() {
        // 维度选择
        d3.select('#dimension-select').on('change', (event) => {
            this.config.dimension = event.target.value;
            this.updateVisualization();
        });
        
        // 相似度阈值
        const thresholdSlider = d3.select('#similarity-threshold');
        const thresholdValue = d3.select('#threshold-value');
        
        thresholdSlider.on('input', (event) => {
            this.config.similarityThreshold = parseFloat(event.target.value);
            thresholdValue.text(this.config.similarityThreshold.toFixed(2));
            this.updateVisualization();
        });
        
        // 布局选择
        d3.select('#layout-select').on('change', (event) => {
            this.config.layout = event.target.value;
            this.updateLayout();
        });
        
        // 视觉模式选择
        d3.select('#visual-mode-select').on('change', (event) => {
            this.config.visualMode = event.target.value;
            this.nodeRenderer.useIsotype = (event.target.value === 'isotype');
            this.render();
        });
        
        // 聚类融合开关
        d3.select('#cluster-fusion-toggle').on('change', (event) => {
            this.showClusterFusion = event.target.checked;
            this.render();
        });
        
        // 重置视图
        d3.select('#reset-view').on('click', () => {
            this.resetView();
        });
        
        // 信息面板收缩/展开
        const togglePanel = () => {
            const panel = d3.select('#info-panel');
            const isCollapsed = panel.classed('collapsed');
            
            if (isCollapsed) {
                panel.classed('collapsed', false);
                this.infoPanelWidth = 450;
            } else {
                panel.classed('collapsed', true);
                this.infoPanelWidth = 0;
            }
            
            this.width = window.innerWidth - this.infoPanelWidth;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.svg.attr('width', this.width)
                .attr('height', this.height)
                .attr('viewBox', `0 0 ${this.width} ${this.height}`);
            this.updateLayout();
        };
        
        d3.select('#toggle-panel').on('click', togglePanel);
        d3.select('#toggle-panel-collapsed').on('click', togglePanel);
        
        // 窗口大小调整
        window.addEventListener('resize', () => {
            const panel = d3.select('#info-panel');
            const isCollapsed = panel.classed('collapsed');
            this.infoPanelWidth = isCollapsed ? 0 : 450;
            
            this.width = window.innerWidth - this.infoPanelWidth;
            this.height = window.innerHeight - 100;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.svg.attr('width', this.width)
                .attr('height', this.height)
                .attr('viewBox', `0 0 ${this.width} ${this.height}`);
            this.updateLayout();
        });
    }
    
    async loadData() {
        try {
            this.showLoading('Loading data...');
            console.log('Loading data...');
            
            this.data = await this.dataLoader.load();
            console.log(`Loaded ${this.data.participants.length} participants`);
            
            this.showLoading('Processing data...');
            // 使用setTimeout让UI有机会更新
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.processData();
            
            this.showLoading('Rendering visualization...');
            await new Promise(resolve => setTimeout(resolve, 100));
            
            this.render();
            
            // 延迟设置布局和交互，让初始渲染先完成
            setTimeout(() => {
                this.updateLayout();
                this.interactionHandler.setup(this.nodes, this.links);
                // 自动适配视图以显示所有节点
                setTimeout(() => {
                    this.fitToView();
                }, 500);
            }, 100);
            
            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please check data file: ' + error.message);
        }
    }
    
    showLoading(message) {
        const container = d3.select('#visualization-container');
        container.select('.loading').remove();
        container.append('div')
            .attr('class', 'loading')
            .html(`<div style="text-align: center; padding: 2rem;">
                <div style="font-size: 1.2rem; color: white; margin-bottom: 1rem;">${message}</div>
                <div style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;"></div>
            </div>`);
    }
    
    hideLoading() {
        d3.select('#visualization-container').select('.loading').remove();
    }
    
    showError(message) {
        const container = d3.select('#visualization-container');
        container.select('.loading').remove();
        container.append('div')
            .attr('class', 'loading')
            .html(`<div style="text-align: center; padding: 2rem; color: #ff6b6b;">
                <div style="font-size: 1.2rem; margin-bottom: 1rem;">❌ 错误</div>
                <div>${message}</div>
            </div>`);
    }
    
    processData() {
        const startTime = performance.now();
        
        // 处理节点
        this.nodes = this.data.participants.map(p => ({
            id: p.id,
            ...p,
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: 0,
            vy: 0
        }));
        
        console.log(`Processing ${this.nodes.length} nodes...`);
        const nodeTime = performance.now();
        console.log(`节点处理耗时: ${(nodeTime - startTime).toFixed(2)}ms`);
        
        // 优化：使用更高效的连接生成策略
        const linkStartTime = performance.now();
        this.links = this.generateLinksOptimized();
        const linkTime = performance.now();
        
        console.log(`Generated ${this.links.length} links`);
        console.log(`连接生成耗时: ${(linkTime - linkStartTime).toFixed(2)}ms`);
        console.log(`总处理耗时: ${(linkTime - startTime).toFixed(2)}ms`);
    }
    
    generateLinksOptimized() {
        // 优化策略：限制每个节点的连接数，使用采样
        const links = [];
        const threshold = this.config.similarityThreshold;
        
        // 根据节点数量动态调整参数
        const nodeCount = this.nodes.length;
        let maxLinksPerNode, sampleSize;
        
        if (nodeCount <= 20) {
            // 小样本：每个节点可以连接更多，采样更多
            maxLinksPerNode = Math.min(10, nodeCount - 1); // 减少到10个
            sampleSize = nodeCount; // 小样本时比较所有节点
        } else if (nodeCount <= 50) {
            // 中等样本
            maxLinksPerNode = 8;
            sampleSize = Math.min(30, nodeCount);
        } else {
            // 大样本：严格限制
            maxLinksPerNode = 5;
            sampleSize = Math.min(50, nodeCount);
        }
        
        console.log(`连接参数: maxLinksPerNode=${maxLinksPerNode}, sampleSize=${sampleSize}, threshold=${threshold}`);
        
        // 使用Set来快速检查重复连接
        const linkSet = new Set();
        
        // 为每个节点找最相似的几个节点
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const candidates = [];
            
            // 采样策略：不是和所有节点比较，而是采样
            const sampleIndices = this.getSampleIndices(i, sampleSize);
            
            for (const j of sampleIndices) {
                if (i === j) continue;
                
                // 检查是否已经处理过这个连接
                const linkKey = i < j ? `${i}-${j}` : `${j}-${i}`;
                if (linkSet.has(linkKey)) continue;
                
                const similarity = this.calculateSimilarity(
                    node,
                    this.nodes[j],
                    this.config.dimension
                );
                
                if (similarity >= threshold) {
                    candidates.push({
                        target: this.nodes[j],
                        similarity: similarity,
                        targetIndex: j
                    });
                }
            }
            
            // 只保留最相似的几个
            candidates.sort((a, b) => b.similarity - a.similarity);
            const topCandidates = candidates.slice(0, maxLinksPerNode);
            
            topCandidates.forEach(candidate => {
                const linkKey = i < candidate.targetIndex ? `${i}-${candidate.targetIndex}` : `${candidate.targetIndex}-${i}`;
                
                if (!linkSet.has(linkKey)) {
                    linkSet.add(linkKey);
                    links.push({
                        source: node,
                        target: candidate.target,
                        similarity: candidate.similarity,
                        dimension: this.config.dimension
                    });
                }
            });
        }
        
        return links;
    }
    
    getSampleIndices(currentIndex, sampleSize) {
        // 获取采样索引：包括附近的节点和随机节点
        const indices = new Set();
        const n = this.nodes.length;
        
        // 添加附近的节点（局部相似性）
        const windowSize = Math.min(20, n);
        const start = Math.max(0, currentIndex - windowSize);
        const end = Math.min(n, currentIndex + windowSize);
        for (let i = start; i < end; i++) {
            if (i !== currentIndex) indices.add(i);
        }
        
        // 添加随机节点（全局探索）
        const randomCount = sampleSize - indices.size;
        for (let i = 0; i < randomCount && indices.size < sampleSize; i++) {
            const randomIndex = Math.floor(Math.random() * n);
            if (randomIndex !== currentIndex) {
                indices.add(randomIndex);
            }
        }
        
        return Array.from(indices);
    }
    
    calculateSimilarity(node1, node2, dimension) {
        // 根据选择的维度计算相似度
        if (dimension === 'multidimensional') {
            // 使用统一向量
            const vec1 = node1.isotype_signature.unified;
            const vec2 = node2.isotype_signature.unified;
            return this.cosineSimilarity(vec1, vec2);
        } else {
            // 使用特定维度
            const vec1 = node1.isotype_signature[dimension] || node1.isotype_signature.semantic;
            const vec2 = node2.isotype_signature[dimension] || node2.isotype_signature.semantic;
            return this.cosineSimilarity(vec1, vec2);
        }
    }
    
    cosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
        
        // 优化：使用更快的计算方式，减少循环开销
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        // 如果向量太长，可以采样计算（但384维还可以接受）
        const step = vec1.length > 500 ? 2 : 1; // 如果超过500维，每隔一个计算
        
        for (let i = 0; i < vec1.length; i += step) {
            const v1 = vec1[i];
            const v2 = vec2[i];
            dotProduct += v1 * v2;
            norm1 += v1 * v1;
            norm2 += v2 * v2;
        }
        
        // 如果采样了，需要调整
        if (step > 1) {
            dotProduct *= step;
            norm1 *= step;
            norm2 *= step;
        }
        
        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 应用zoom变换到Canvas
        this.ctx.save();
        this.ctx.translate(this.transform.x, this.transform.y);
        this.ctx.scale(this.transform.k, this.transform.k);
        
        // 1. 先渲染聚类融合（最底层）
        if (this.showClusterFusion && this.clusterFusion && this.nodes.length > 0 && this.links.length > 0) {
            this.clusterFusion.renderClusters(
                this.nodes, 
                this.links, 
                this.config.similarityThreshold
            );
            // 聚类融合模式下不渲染连接线，只显示融合的大圆
        } else {
            // 2. 非融合模式：渲染连接线（在节点下面）
            this.renderLinks();
        }
        
        // 3. 渲染节点（在最上层）
        this.nodeRenderer.render(this.nodes, this.config, this.highlightedNode);
        
        // 恢复Canvas变换
        this.ctx.restore();
        
        // 更新交互层位置（如果节点在移动）
        if (this.interactionHandler && this.nodes.length > 0) {
            this.interactionHandler.updateInteractionLayer(this.nodes);
        }
    }
    
    renderLinks() {
        // 如果开启了聚类融合，不渲染连接线
        if (this.showClusterFusion && this.clusterFusion) {
            return;
        }
        
        // 渲染连接线（艺术化的柔和风格）
        this.ctx.save();
        
        // 先渲染普通连接
        this.links.forEach(link => {
            const isHighlighted = this.highlightedLinks.includes(link);
            if (isHighlighted) return; // 高亮的连接稍后渲染
            
            const source = link.source;
            const target = link.target;
            const similarity = link.similarity || 0.5;
            
            if (!source || !target || !source.x || !source.y || !target.x || !target.y) {
                return;
            }
            
            // City Pulse 风格：使用高对比度的亮色连接线
            const linkColor = '#FFFFFF'; // 白色
            
            // 连接线（高对比度）
            this.ctx.strokeStyle = this.addAlpha(linkColor, similarity * 0.15); // 根据相似度调整透明度
            this.ctx.lineWidth = similarity * 0.8 + 0.3;
            this.ctx.lineCap = 'round';
            
            // 使用直线
            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
        });
        
        // 再渲染高亮的连接（在上面）
        this.highlightedLinks.forEach(link => {
            const source = link.source;
            const target = link.target;
            const similarity = link.similarity || 0.5;
            
            if (!source || !target || !source.x || !source.y || !target.x || !target.y) {
                return;
            }
            
            // 高亮连接：使用主题色或白色，高对比度
            this.ctx.strokeStyle = this.addAlpha('#FF006E', 0.6); // 使用主题色
            this.ctx.lineWidth = similarity * 1.2 + 0.8;
            this.ctx.lineCap = 'round';
            
            // 使用直线，更简约
            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
        });
        
        this.ctx.restore();
    }
    
    addAlpha(color, alpha) {
        // 添加透明度
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    updateLayout() {
        if (!this.nodes.length) return;
        
        this.layoutManager.applyLayout(
            this.nodes,
            this.links,
            this.config.layout,
            this.config.dimension
        );
        
        // 启动力导向模拟
        if (this.simulation) {
            this.simulation.stop();
        }
        
        // 优化：减少更新频率，使用节流
        let renderCount = 0;
        const renderThrottle = 5; // 每5次tick渲染一次（减少渲染频率）
        
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => 80 / (d.similarity || 0.5)) // 固定距离，减少跳动
                .strength(0.3)) // 降低连接强度
            .force('charge', d3.forceManyBody().strength(-150)) // 进一步降低强度
            .force('center', d3.forceCenter(this.width / 2, this.height / 2).strength(0.1)) // 降低中心力
            .force('collision', d3.forceCollide().radius(d => (d.visual_properties?.size || 10) + 3).strength(0.5))
            .alphaDecay(0.1) // 大幅加快收敛（从0.02到0.1）
            .alphaMin(0.01) // 设置最小alpha，避免无限运行
            .velocityDecay(0.6) // 增加阻尼，减少跳动
            .on('tick', () => {
                renderCount++;
                const alpha = this.simulation.alpha();
                
                // 每次tick都更新交互层位置（确保点击位置准确）
                if (this.interactionHandler && this.nodes.length > 0) {
                    this.interactionHandler.updateInteractionLayer(this.nodes);
                }
                
                // 只在需要时渲染，并且随着alpha降低减少渲染频率
                const shouldRender = renderCount % renderThrottle === 0 || 
                                    renderCount < 10 || 
                                    (alpha > 0.1 && renderCount % 2 === 0);
                
                if (shouldRender) {
                    // 使用requestAnimationFrame来避免阻塞
                    if (!this.renderScheduled) {
                        this.renderScheduled = true;
                        requestAnimationFrame(() => {
                            this.render();
                            this.renderScheduled = false;
                        });
                    }
                }
                
                // 如果alpha很小，停止模拟
                if (alpha < 0.01) {
                    this.simulation.stop();
                    console.log('力导向模拟已收敛');
                }
            })
            .on('end', () => {
                // 模拟结束时确保渲染一次
                console.log('力导向模拟结束');
                this.render();
            });
    }
    
    updateVisualization() {
        // 停止当前模拟
        if (this.simulation) {
            this.simulation.stop();
        }
        
        this.processData();
        this.render();
        
        // 延迟更新布局，避免立即启动新的模拟
        setTimeout(() => {
            this.updateLayout();
        }, 50);
    }
    
    resetView() {
        // 重置zoom变换
        this.transform = d3.zoomIdentity;
        this.svg.call(this.zoom.transform, this.transform);
        
        // 自动适配视图以显示所有节点
        this.fitToView();
    }
    
    fitToView() {
        if (!this.nodes || this.nodes.length === 0) return;
        
        // 计算所有节点的边界
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            if (node.x !== undefined && node.y !== undefined) {
                minX = Math.min(minX, node.x);
                minY = Math.min(minY, node.y);
                maxX = Math.max(maxX, node.x);
                maxY = Math.max(maxY, node.y);
            }
        });
        
        // 如果没有有效节点，返回
        if (minX === Infinity) return;
        
        // 添加边距
        const padding = 50;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;
        
        // 计算缩放比例
        const scaleX = this.width / width;
        const scaleY = this.height / height;
        const scale = Math.min(scaleX, scaleY, 1); // 不超过1，不放大
        
        // 计算平移
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const translateX = this.width / 2 - centerX * scale;
        const translateY = this.height / 2 - centerY * scale;
        
        // 应用变换
        this.transform = d3.zoomIdentity
            .translate(translateX, translateY)
            .scale(scale);
        
        this.svg.call(this.zoom.transform, this.transform);
    }
}

// 启动应用
const app = new VisualizationApp();
app.loadData();

