/**
 * Group Isotype Renderer
 * 用于粗粒度展示群体规模的Isotype渲染器
 * 
 * 应用场景：
 * - 展示不同群体的size（如性别、年龄组、地区等）
 * - 用glyph的数量或大小表示群体规模
 * - 每个glyph代表群体的代表性特征
 */

import { IsotypeRenderer } from './isotypeRenderer.js';

export class GroupIsotypeRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isotypeRenderer = new IsotypeRenderer(canvas, ctx);
        this.glyphPositions = []; // 存储每个glyph的位置和样本信息
        this.tooltip = null; // tooltip元素
        this.lastRenderConfig = null; // 保存最后一次渲染的配置，用于重新渲染
        this.offscreenCanvas = null; // 离屏canvas，用于保存画布状态
        this.offscreenCtx = null;
        this.initTooltip();
        this.initOffscreenCanvas();
    }
    
    /**
     * 初始化离屏canvas（用于保存画布状态）
     */
    initOffscreenCanvas() {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { 
            alpha: true,  // 确保支持透明度
            willReadFrequently: true  // 优化读取性能
        });
        // 确保离屏canvas背景透明
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }
    
    /**
     * 保存当前画布状态到离屏canvas
     */
    saveCanvasState() {
        if (this.offscreenCanvas && this.offscreenCtx) {
            // 确保离屏canvas尺寸匹配
            if (this.offscreenCanvas.width !== this.canvas.width || 
                this.offscreenCanvas.height !== this.canvas.height) {
                this.offscreenCanvas.width = this.canvas.width;
                this.offscreenCanvas.height = this.canvas.height;
            }
            // 先清除离屏canvas，确保透明背景
            this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
            // 填充背景色（与主canvas一致）
            this.offscreenCtx.fillStyle = '#0A0A0A';
            this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
            // 复制当前画布内容到离屏canvas
            this.offscreenCtx.drawImage(this.canvas, 0, 0);
        }
    }
    
    /**
     * 从离屏canvas恢复画布状态
     */
    restoreCanvasState(x, y, width, height) {
        if (this.offscreenCanvas && this.offscreenCtx) {
            // 使用整数坐标，确保像素完美对齐
            const intX = Math.floor(x);
            const intY = Math.floor(y);
            const intWidth = Math.ceil(width);
            const intHeight = Math.ceil(height);
            
            // 先清除目标区域，确保完全透明
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-over';
            // 填充背景色
            this.ctx.fillStyle = '#0A0A0A';
            this.ctx.fillRect(intX, intY, intWidth, intHeight);
            
            // 从离屏canvas恢复内容
            this.ctx.imageSmoothingEnabled = true; // 启用平滑，确保质量
            this.ctx.drawImage(
                this.offscreenCanvas,
                intX, intY, intWidth, intHeight,  // 源区域
                intX, intY, intWidth, intHeight   // 目标区域
            );
            this.ctx.restore();
        }
    }
    
    /**
     * 初始化tooltip元素
     */
    initTooltip() {
        // 创建tooltip元素（如果不存在）
        if (!document.getElementById('glyph-tooltip')) {
            const tooltip = document.createElement('div');
            tooltip.id = 'glyph-tooltip';
            tooltip.className = 'glyph-tooltip';
            document.body.appendChild(tooltip);
            this.tooltip = tooltip;
        } else {
            this.tooltip = document.getElementById('glyph-tooltip');
        }
    }
    
    /**
     * 生成共情台词 - 揭示数据背后的真实生命
     * 根据样本的情感、特征生成能引起共情的个性化表达
     */
    extractQuote(sample) {
        // 共情台词库 - 反映真实生命体验
        const empathyQuotes = [
            // 关于成长与变化
            "I'm still figuring out who I am, and that's okay.",
            "Every day feels different, and I'm learning to embrace that.",
            "I thought I knew myself, but life keeps surprising me.",
            "Change is scary, but staying the same feels worse.",
            
            // 关于情感与感受
            "Sometimes I feel everything so deeply, it's overwhelming.",
            "I'm trying to find the words for what I'm feeling.",
            "There are days when I feel lost, and days when I feel found.",
            "I carry so much inside, but I'm learning to let it out.",
            
            // 关于连接与孤独
            "I want to be understood, but I'm afraid to be vulnerable.",
            "Sometimes I feel alone even when I'm surrounded by people.",
            "I'm searching for someone who sees the real me.",
            "Connection feels rare, but when it happens, it's everything.",
            
            // 关于希望与挣扎
            "I'm trying to hold onto hope, even when it's hard.",
            "Some days are harder than others, but I keep going.",
            "I don't have all the answers, but I'm asking the questions.",
            "I'm learning that it's okay to not be okay sometimes.",
            
            // 关于自我与身份
            "I'm more than the labels people put on me.",
            "I'm discovering parts of myself I never knew existed.",
            "I refuse to be reduced to a single story.",
            "My identity is complex, and I'm learning to love that.",
            
            // 关于时间与记忆
            "I carry my past with me, but I'm not defined by it.",
            "Time moves differently when you're paying attention.",
            "Some moments stay with you forever, others fade away.",
            "I'm trying to be present, even when my mind wanders.",
            
            // 关于梦想与现实
            "I have dreams that feel impossible, but I hold onto them.",
            "Reality is complicated, but so am I.",
            "I'm learning to balance what I want with what I need.",
            "My dreams keep me going, even when reality is tough.",
            
            // 关于勇气与脆弱
            "Being vulnerable is the bravest thing I know how to do.",
            "I'm learning that strength doesn't mean never breaking.",
            "It takes courage to be yourself in a world that wants you to fit in.",
            "I'm showing up, even when I'm scared.",
            
            // 关于爱与失去
            "Love is complicated, but I keep choosing it.",
            "I've lost things I thought I couldn't live without, but here I am.",
            "Grief taught me that love never really leaves.",
            "I'm learning to love myself, even the parts I don't like.",
            
            // 关于未来与不确定性
            "I don't know what comes next, and that's both terrifying and exciting.",
            "The future feels uncertain, but I'm trying to trust the process.",
            "I'm making it up as I go, and that's okay.",
            "I'm learning to be okay with not knowing everything.",
            
            // 关于真实与面具
            "I wear different masks, but underneath, I'm always me.",
            "I'm tired of pretending, but I'm not sure how to stop.",
            "Being authentic is harder than it looks.",
            "I'm learning to show my real self, one step at a time.",
            
            // 关于声音与沉默
            "I have so much to say, but sometimes words fail me.",
            "My voice matters, even when I'm the only one listening.",
            "I'm learning to speak up, even when my voice shakes.",
            "Silence can be powerful, but so can speaking your truth.",
            
            // 关于理解与误解
            "I wish people could see the world through my eyes.",
            "I'm often misunderstood, but I keep trying to explain.",
            "Understanding someone takes time, and I'm learning patience.",
            "I'm learning that not everyone will understand, and that's okay."
        ];
        
        // 根据样本特征选择台词
        // 使用样本的ID或特征来生成一个稳定的索引
        const emotion = sample.isotype_signature?.emotion || [];
        const semantic = sample.isotype_signature?.semantic || [];
        const uniqueness = sample.isotype_signature?.uniqueness_score || 0;
        
        // 计算一个基于样本特征的索引
        let index = 0;
        if (emotion.length > 0) {
            const emotionSum = emotion.reduce((a, b) => a + b, 0);
            index += Math.floor(emotionSum * 100) % empathyQuotes.length;
        }
        if (semantic.length > 0) {
            const semanticSum = semantic.slice(0, 10).reduce((a, b) => a + Math.abs(b), 0);
            index += Math.floor(semanticSum * 50) % empathyQuotes.length;
        }
        index += Math.floor(uniqueness * 100) % empathyQuotes.length;
        index = index % empathyQuotes.length;
        
        return empathyQuotes[index];
    }
    
    /**
     * 显示tooltip
     */
    showTooltip(x, y, quote) {
        if (!this.tooltip) return;
        
        this.tooltip.textContent = quote;
        this.tooltip.style.display = 'block';
        
        // 强制重新计算尺寸（因为textContent刚改变）
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.display = 'block';
        const tooltipWidth = this.tooltip.offsetWidth || 200;
        const tooltipHeight = this.tooltip.offsetHeight || 50;
        this.tooltip.style.visibility = 'visible';
        
        const padding = 10;
        const arrowOffset = 20; // glyph到tooltip的距离
        
        // 获取canvas在页面中的位置
        const rect = this.canvas.getBoundingClientRect();
        const pageX = rect.left + x;
        const pageY = rect.top + y;
        
        // 默认显示在glyph上方
        let tooltipX = pageX - tooltipWidth / 2;
        let tooltipY = pageY - tooltipHeight - padding - arrowOffset;
        let showArrowBelow = false;
        
        // 确保不超出屏幕
        if (tooltipX < padding) tooltipX = padding;
        if (tooltipX + tooltipWidth > window.innerWidth - padding) {
            tooltipX = window.innerWidth - tooltipWidth - padding;
        }
        
        // 如果上方空间不够，显示在下方
        if (tooltipY < padding) {
            tooltipY = pageY + padding + arrowOffset;
            showArrowBelow = true;
        }
        
        this.tooltip.style.left = `${tooltipX}px`;
        this.tooltip.style.top = `${tooltipY}px`;
        
        // 调整箭头位置
        if (showArrowBelow) {
            this.tooltip.style.setProperty('--arrow-position', 'top');
            this.tooltip.classList.add('arrow-below');
            this.tooltip.classList.remove('arrow-above');
        } else {
            this.tooltip.style.setProperty('--arrow-position', 'bottom');
            this.tooltip.classList.add('arrow-above');
            this.tooltip.classList.remove('arrow-below');
        }
    }
    
    /**
     * 隐藏tooltip
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
    
    /**
     * 检查鼠标是否在glyph上，返回匹配的glyph
     */
    findGlyphAt(mouseX, mouseY) {
        for (const glyph of this.glyphPositions) {
            const dx = mouseX - glyph.x;
            const dy = mouseY - glyph.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = (glyph.sample.visual_properties?.size || 10) + 5; // 增加一点容差
            
            if (distance <= radius) {
                return glyph;
            }
        }
        return null;
    }
    
    /**
     * 检查鼠标是否在glyph上（用于hover）
     */
    checkGlyphHover(mouseX, mouseY) {
        const glyph = this.findGlyphAt(mouseX, mouseY);
        if (glyph) {
            this.showTooltip(glyph.x, glyph.y, glyph.quote);
            return true;
        }
        this.hideTooltip();
        return false;
    }
    
    /**
     * 让glyph跳跃（双击响应动画）
     */
    makeGlyphJump(glyph) {
        if (!glyph || glyph.isJumping) return; // 防止重复触发
        
        glyph.isJumping = true;
        const originalX = glyph.originalX || glyph.x;
        const originalY = glyph.originalY || glyph.y;
        const jumpHeight = 15; // 跳跃高度
        const jumpDuration = 400; // 动画时长（毫秒）
        const startTime = Date.now();
        
        // 保存上一次的位置，用于清除
        let lastX = originalX;
        let lastY = originalY;
        
        // 创建动画函数
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / jumpDuration, 1);
            
            // 使用弹性缓动函数（ease-out bounce效果）
            const easeOutBounce = (t) => {
                if (t < 1 / 2.75) {
                    return 7.5625 * t * t;
                } else if (t < 2 / 2.75) {
                    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                } else if (t < 2.5 / 2.75) {
                    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                } else {
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                }
            };
            
            // 计算当前跳跃高度（向上跳，然后弹回）
            const bounce = easeOutBounce(progress);
            const currentY = originalY - jumpHeight * (1 - bounce);
            const currentX = originalX;
            
            // 清除旧位置和新位置的区域（覆盖整个移动范围）
            this.clearGlyphArea(lastX, lastY, currentX, currentY, glyph);
            
            // 更新glyph位置
            glyph.x = currentX;
            glyph.y = currentY;
            
            // 渲染glyph在新位置
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-over';
            this.isotypeRenderer.renderIsotype(glyph.sample, currentX, currentY, false);
            this.ctx.restore();
            
            // 更新上一次位置
            lastX = currentX;
            lastY = currentY;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画结束，清除最后位置，恢复原位置
                this.clearGlyphArea(lastX, lastY, originalX, originalY, glyph);
                glyph.x = originalX;
                glyph.y = originalY;
                glyph.isJumping = false;
                // 在原始位置重新渲染
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'source-over';
                this.isotypeRenderer.renderIsotype(glyph.sample, originalX, originalY, false);
                this.ctx.restore();
            }
        };
        
        animate();
    }
    
    /**
     * 清除glyph移动区域的背景（从旧位置到新位置）
     */
    clearGlyphArea(oldX, oldY, newX, newY, glyph) {
        const glyphSize = glyph.sample.visual_properties?.size || 10;
        const padding = glyphSize + 20; // 足够的边距
        
        // 计算需要清除的矩形区域（覆盖旧位置和新位置）
        const minX = Math.min(oldX, newX) - padding;
        const minY = Math.min(oldY, newY) - padding;
        const maxX = Math.max(oldX, newX) + padding;
        const maxY = Math.max(oldY, newY) + padding;
        
        const clearX = Math.max(0, Math.floor(minX));
        const clearY = Math.max(0, Math.floor(minY));
        const clearWidth = Math.min(this.canvas.width - clearX, Math.ceil(maxX - minX));
        const clearHeight = Math.min(this.canvas.height - clearY, Math.ceil(maxY - minY));
        
        // 从离屏canvas恢复背景
        if (this.offscreenCanvas && this.offscreenCtx) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(
                this.offscreenCanvas,
                clearX, clearY, clearWidth, clearHeight,  // 源区域
                clearX, clearY, clearWidth, clearHeight  // 目标区域
            );
            this.ctx.restore();
        } else {
            // 如果没有离屏canvas，用背景色填充
            this.ctx.fillStyle = '#0A0A0A';
            this.ctx.fillRect(clearX, clearY, clearWidth, clearHeight);
        }
    }
    
    /**
     * 渲染单个glyph（用于动画）
     * 使用离屏canvas恢复背景，确保完全透明
     */
    renderSingleGlyph(glyph) {
        // 计算需要清除和恢复的区域（稍微大一点，确保完全覆盖）
        const glyphSize = glyph.sample.visual_properties?.size || 10;
        const clearRadius = glyphSize + 30; // 增加边距，确保完全覆盖
        const clearX = Math.max(0, Math.floor(glyph.x - clearRadius));
        const clearY = Math.max(0, Math.floor(glyph.y - clearRadius));
        const clearWidth = Math.min(this.canvas.width - clearX, Math.ceil(clearRadius * 2));
        const clearHeight = Math.min(this.canvas.height - clearY, Math.ceil(clearRadius * 2));
        
        // 从离屏canvas恢复背景（包括其他glyph和标签）
        // 直接使用drawImage，不先填充背景，避免混合问题
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        
        // 使用copy模式，完全替换目标区域
        if (this.offscreenCanvas && this.offscreenCtx) {
            const intX = clearX;
            const intY = clearY;
            const intWidth = clearWidth;
            const intHeight = clearHeight;
            
            // 直接复制，不进行任何混合
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(
                this.offscreenCanvas,
                intX, intY, intWidth, intHeight,  // 源区域
                intX, intY, intWidth, intHeight   // 目标区域
            );
        }
        this.ctx.restore();
        
        // 重新渲染这个glyph
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        this.isotypeRenderer.renderIsotype(glyph.sample, glyph.x, glyph.y, false);
        this.ctx.restore();
    }
    
    /**
     * 重新绘制所有glyph（动画结束后使用）
     * 只重新渲染，不重新选择样本，保持glyph不变
     */
    redrawAllGlyphs() {
        // 不清除glyph位置，只重新渲染所有glyph
        // 这样可以保持每个glyph的样本不变
        this.glyphPositions.forEach(glyph => {
            // 确保位置恢复（防止动画修改了位置）
            if (glyph.originalX !== undefined) {
                glyph.x = glyph.originalX;
            }
            if (glyph.originalY !== undefined) {
                glyph.y = glyph.originalY;
            }
            
            // 重新渲染这个glyph
            this.renderSingleGlyph(glyph);
        });
    }
    
    /**
     * 处理双击事件
     */
    handleDoubleClick(mouseX, mouseY) {
        const glyph = this.findGlyphAt(mouseX, mouseY);
        if (glyph) {
            this.makeGlyphJump(glyph);
            return true;
        }
        return false;
    }
    
    /**
     * 清空glyph位置记录
     */
    clearGlyphPositions() {
        this.glyphPositions = [];
    }
    
    /**
     * 渲染群体可视化 - 反刻板印象设计
     * 每个群体使用多样化的glyph，展现群体的多样性
     * @param {Object} groups - 群体数据 {groupName: {count, samples, label}}
     * @param {Object} config - 配置
     *   - encoding: 'count' | 'size' (数量编码或大小编码)
     *   - unitSize: number (数量编码时，每个glyph代表的人数，默认10)
     *   - layout: 'grid' | 'horizontal' | 'vertical' | 'circle' | 'mixed'
     *   - columns: number (网格布局时，每行的glyph数量)
     *   - spacing: number (glyph之间的间距)
     *   - diversityMethod: 'random' | 'stratified' | 'representative' (选择多样化样本的方法)
     */
    renderGroups(groups, config = {}) {
        const {
            encoding = 'count',
            unitSize = 10,
            layout = 'grid',
            columns = 5,
            spacing = 15,
            diversityMethod = 'random'
        } = config;
        
        // 保存渲染配置（用于动画后重新渲染）
        this.lastRenderConfig = { groups, config };
        
        // 清空画布和glyph位置记录
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 填充背景色
        this.ctx.fillStyle = '#0A0A0A';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.clearGlyphPositions();
        
        // 对于circle布局，需要预先计算所有群体的统一半径基准
        // 确保规模大的群体circle更大
        let maxGlyphCount = 0;
        let circleRadiusBase = null;
        let circleMaxRadius = null;
        
        if (layout === 'circle') {
            // 计算所有群体中的最大glyph数量
            Object.values(groups).forEach(group => {
                const glyphCount = encoding === 'count' 
                    ? Math.ceil(group.count / unitSize)
                    : 1;
                maxGlyphCount = Math.max(maxGlyphCount, glyphCount);
            });
            
            // 基于最大glyph数量计算统一的半径基准
            // 使用canvas的可用空间（考虑每个群体需要垂直空间）
            const padding = 30;
            const avgGlyphSize = 10; // 估算平均glyph大小
            const numGroups = Object.keys(groups).length;
            const estimatedHeightPerGroup = (this.canvas.height - 50) / numGroups; // 估算每个群体的可用高度
            
            // 计算基准半径：使用统一的约束，确保所有群体都能容纳
            // 使用canvas宽度和每个群体的估算高度中的较小值
            circleMaxRadius = Math.min(
                (this.canvas.width / 2) - padding - avgGlyphSize,
                (estimatedHeightPerGroup / 2) - padding - avgGlyphSize
            );
            
            // 计算基准半径（基于最大glyph数量）
            // 确保基准半径足够大，能容纳最大群体的glyph
            const maxGlyphSize = avgGlyphSize;
            const minSpacingForMax = maxGlyphSize * 1.8; // 使用与renderCountEncoding中相同的间距
            const maxCircumference = maxGlyphCount * minSpacingForMax;
            const minRadiusForMax = maxCircumference / (Math.PI * 2);
            
            // 基准半径应该至少能容纳最大群体，同时考虑可用空间
            // 使用更大的系数，确保基准半径足够大
            circleRadiusBase = Math.min(
                Math.max(
                    spacing * Math.sqrt(maxGlyphCount) * 1.0, // 增加系数到1.0
                    minRadiusForMax * 1.4 // 至少能容纳最大群体，加40%边距
                ),
                circleMaxRadius
            );
        }
        
        let currentY = 50; // 起始Y位置
        
        Object.entries(groups).forEach(([groupName, group], groupIndex) => {
            const { count, samples, label } = group;
            const displayLabel = label || groupName;
            
            if (encoding === 'count') {
                // 数量编码：用glyph数量表示规模，每个glyph都不同
                this.renderCountEncoding(
                    displayLabel,
                    count,
                    samples,
                    unitSize,
                    layout,
                    columns,
                    spacing,
                    currentY,
                    diversityMethod,
                    circleRadiusBase,
                    maxGlyphCount,
                    groups
                );
            } else {
                // 大小编码：用glyph大小表示规模，但glyph仍然多样化
                this.renderSizeEncoding(
                    displayLabel,
                    count,
                    samples,
                    groups,
                    groupIndex,
                    layout,
                    spacing,
                    currentY,
                    diversityMethod
                );
            }
            
            // 更新Y位置（为下一个群体留空间）
            const maxCount = Math.max(...Object.values(groups).map(g => g.count));
            const glyphCount = encoding === 'count' 
                ? Math.ceil(count / unitSize)
                : 1;
            const rows = Math.ceil(glyphCount / columns);
            currentY += rows * (spacing * 2) + 80; // 80是标签和间距
        });
    }
    
    /**
     * 数量编码：用glyph数量表示规模
     * 反刻板印象：每个glyph都不同，展现群体的多样性
     */
    renderCountEncoding(label, count, samples, unitSize, layout, columns, spacing, startY, diversityMethod, circleRadiusBase = null, maxGlyphCount = null, groups = null) {
        const glyphCount = Math.ceil(count / unitSize);
        const rows = Math.ceil(glyphCount / columns);
        
        // 选择多样化的样本（每个glyph都不同）
        const diverseSamples = this.selectDiverseSamples(samples, glyphCount, diversityMethod);
        
        // 绘制标签
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.fillText(`${label} (${count})`, 20, startY - 10);
        
        // 计算起始位置（居中）
        const totalWidth = columns * spacing * 2;
        const startX = (this.canvas.width - totalWidth) / 2 + spacing;
        
        // 对于circle布局，使用统一的半径基准，按比例缩放
        let circleCenterX, circleCenterY, circleRadius;
        if (layout === 'circle') {
            circleCenterX = this.canvas.width / 2;
            circleCenterY = startY;
            
            // 估算glyph的平均大小
            const avgGlyphSize = diverseSamples.length > 0 
                ? (diverseSamples[0].visual_properties?.size || 10) 
                : 10;
            
            // 计算可用的最大半径（考虑容器边界和glyph大小）
            // 使用统一的约束，不依赖当前位置，确保所有群体使用相同的最大半径
            const padding = 30;
            const maxRadiusX = (this.canvas.width / 2) - padding - avgGlyphSize;
            // 对于Y方向，使用统一的约束（基于canvas高度和群体数量）
            // 不依赖circleCenterY，确保所有群体使用相同的约束
            let numGroups = 1;
            if (groups) {
                numGroups = Object.keys(groups).length;
            } else {
                // 如果没有传递groups，尝试从lastRenderConfig获取
                if (this.lastRenderConfig && this.lastRenderConfig.groups) {
                    numGroups = Object.keys(this.lastRenderConfig.groups).length;
                }
            }
            const estimatedHeightPerGroup = (this.canvas.height - 50) / numGroups;
            const maxRadiusY = (estimatedHeightPerGroup / 2) - padding - avgGlyphSize;
            const maxRadius = Math.min(maxRadiusX, maxRadiusY);
            
            if (circleRadiusBase !== null && maxGlyphCount !== null && maxGlyphCount > 0) {
                // 计算最小半径：确保能容纳所有glyph
                // 每个glyph需要一定的空间，考虑glyph大小和间距
                const glyphSize = avgGlyphSize;
                const minSpacing = glyphSize * 1.8; // 增加间距，避免glyph挤在一起
                const circumference = glyphCount * minSpacing; // 需要的周长
                const minRadius = circumference / (Math.PI * 2); // 最小半径
                
                // 使用统一的半径基准，根据glyph数量按比例缩放
                // 使用线性缩放，确保比例关系更明显
                const scale = glyphCount / maxGlyphCount;
                const scaledRadius = circleRadiusBase * scale;
                
                // 取较大值：确保能容纳所有glyph，同时保持比例关系
                // 但不要超过maxRadius太多
                const targetRadius = Math.max(scaledRadius, minRadius * 1.3); // 增加边距到30%
                circleRadius = Math.min(targetRadius, maxRadius);
                
                // 调试信息（可以注释掉）
                // console.log(`${label}: glyphCount=${glyphCount}, scale=${scale.toFixed(2)}, minRadius=${minRadius.toFixed(1)}, scaledRadius=${scaledRadius.toFixed(1)}, finalRadius=${circleRadius.toFixed(1)}`);
            } else {
                // 回退方案：如果没有提供基准，使用原来的计算方式
                const glyphSize = avgGlyphSize;
                const minSpacing = glyphSize * 1.5;
                const circumference = glyphCount * minSpacing;
                const minRadius = circumference / (Math.PI * 2);
                
                circleRadius = Math.min(
                    Math.max(
                        spacing * Math.sqrt(glyphCount) * 0.6,
                        minRadius * 1.2
                    ),
                    maxRadius
                );
            }
        }
        
        // 渲染glyph（每个都不同）
        for (let i = 0; i < glyphCount; i++) {
            const row = Math.floor(i / columns);
            const col = i % columns;
            
            let x, y;
            
            if (layout === 'grid') {
                x = startX + col * spacing * 2;
                y = startY + row * spacing * 2;
            } else if (layout === 'horizontal') {
                x = startX + i * spacing * 2;
                y = startY;
            } else if (layout === 'circle') {
                // 紧凑的circle布局：自动适应容器大小
                const angle = (Math.PI * 2 * i) / glyphCount;
                
                // 如果glyph数量很多，使用多层circle
                let radius = circleRadius;
                if (glyphCount > 20) {
                    const layer = Math.floor(i / 20);
                    const layerRadius = circleRadius * (0.3 + layer * 0.3);
                    const maxRadius = Math.min(
                        (this.canvas.width / 2) - 30 - (diverseSamples[0]?.visual_properties?.size || 10),
                        Math.min(
                            circleCenterY - 30 - (diverseSamples[0]?.visual_properties?.size || 10),
                            (this.canvas.height - circleCenterY) - 30 - (diverseSamples[0]?.visual_properties?.size || 10)
                        )
                    );
                    radius = Math.min(layerRadius, maxRadius);
                }
                
                x = circleCenterX + Math.cos(angle) * radius;
                y = circleCenterY + Math.sin(angle) * radius;
            } else if (layout === 'mixed') {
                // 混合布局：随机但有序的排列，创造有机感
                const baseX = startX + (col * spacing * 2);
                const baseY = startY + (row * spacing * 2);
                x = baseX + (Math.random() - 0.5) * spacing * 0.3;
                y = baseY + (Math.random() - 0.5) * spacing * 0.3;
            } else {
                x = startX;
                y = startY + i * spacing * 2;
            }
            
            // 使用不同的样本渲染glyph（展现多样性）
            const sample = diverseSamples[i] || diverseSamples[0];
            if (sample) {
                this.isotypeRenderer.renderIsotype(sample, x, y, false);
                
                // 记录glyph位置和样本信息（用于hover交互和动画）
                const quote = this.extractQuote(sample);
                this.glyphPositions.push({
                    x: x,
                    y: y,
                    originalX: x,  // 保存原始位置
                    originalY: y,  // 保存原始位置
                    sample: sample,
                    quote: quote,
                    isJumping: false  // 动画状态标志
                });
            }
        }
        
        // 绘制单位说明
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.fillText(
            `${glyphCount} diverse glyphs, each = ${unitSize} people`,
            this.canvas.width - 280,
            startY - 10
        );
        
        // 保存画布状态（用于动画）
        this.saveCanvasState();
    }
    
    /**
     * 大小编码：用glyph大小表示规模
     * 反刻板印象：使用多个不同大小的glyph组成"彩图"，展现多样性
     */
    renderSizeEncoding(label, count, samples, allGroups, groupIndex, layout, spacing, startY, diversityMethod) {
        const maxCount = Math.max(...Object.values(allGroups).map(g => g.count));
        const baseSize = 15;
        const scale = count / maxCount;
        const mainSize = baseSize * (0.5 + scale * 0.5); // 0.5-1.0倍基础大小
        
        // 选择多样化的样本（用多个不同glyph组成"彩图"）
        const numGlyphs = Math.min(5, Math.max(3, Math.ceil(count / 30))); // 根据规模决定glyph数量
        
        // 计算X位置（水平排列，紧凑布局）
        // X轴：按群体顺序排列（无实际数据含义，仅用于展示和比较）
        // Y轴：固定位置（无实际数据含义，仅用于展示）
        const totalGroups = Object.keys(allGroups).length;
        const padding = 120; // 左右边距
        const availableWidth = this.canvas.width - padding * 2;
        
        let centerX;
        if (totalGroups === 1) {
            // 只有一个群体时，居中显示
            centerX = this.canvas.width / 2;
        } else {
            // 多个群体时，使用紧凑的均匀分布
            // 估算每个群体需要的宽度（基于glyph簇的大小）
            const estimatedClusterWidth = mainSize * numGlyphs * 0.5 + mainSize * 1.5; // 考虑glyph间距和大小
            const minSpacing = estimatedClusterWidth * 1.2; // 最小间距为簇宽度的1.2倍
            
            // 计算总需要的宽度
            const totalNeededWidth = totalGroups * minSpacing;
            
            if (totalNeededWidth <= availableWidth) {
                // 如果空间足够，使用紧凑但均匀的分布
                const groupSpacing = availableWidth / (totalGroups + 1); // 在两端也留空间
                centerX = padding + groupSpacing * (groupIndex + 1);
            } else {
                // 如果空间不够，使用最小间距均匀分布
                const totalSpacing = (totalGroups - 1) * minSpacing;
                const extraSpace = availableWidth - totalSpacing;
                centerX = padding + extraSpace / 2 + groupIndex * minSpacing;
            }
        }
        
        // 绘制标签
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${label}`, centerX, startY - 20);
        this.ctx.fillText(`(${count})`, centerX, startY - 5);
        this.ctx.textAlign = 'left';
        
        // 选择多样化的样本
        const diverseSamples = this.selectDiverseSamples(samples, numGlyphs, diversityMethod);
        
        // 创建一个"彩图"：多个不同大小的glyph组合
        // 使用更紧凑的间距，让glyph稍微重叠，形成更紧密的"彩图"效果
        const glyphSpacing = mainSize * 0.5; // 减小间距，让glyph更紧密
        const startOffset = -(numGlyphs - 1) * glyphSpacing / 2;
        
        diverseSamples.forEach((sample, i) => {
            // 每个glyph大小略有不同，但整体与规模相关
            const sizeVariation = 0.8 + (i / numGlyphs) * 0.4; // 0.8-1.2倍
            const glyphSize = mainSize * sizeVariation;
            
            // 位置：围绕中心点排列
            let x, y;
            if (layout === 'horizontal') {
                x = centerX + startOffset + i * glyphSpacing;
                y = startY;
            } else {
                // vertical: 垂直排列
                x = centerX;
                y = startY + startOffset + i * glyphSpacing;
            }
            
            // 临时调整glyph大小
            const originalSize = sample.visual_properties?.size || 10;
            sample.visual_properties = {
                ...sample.visual_properties,
                size: glyphSize
            };
            
            // 渲染glyph
            this.isotypeRenderer.renderIsotype(sample, x, y, false);
            
            // 记录glyph位置和样本信息（用于hover交互和动画）
            const quote = this.extractQuote(sample);
            this.glyphPositions.push({
                x: x,
                y: y,
                originalX: x,  // 保存原始位置
                originalY: y,  // 保存原始位置
                sample: sample,
                quote: quote,
                isJumping: false  // 动画状态标志
            });
            
            // 恢复原始大小
            sample.visual_properties.size = originalSize;
        });
        
        // 保存画布状态（用于动画）
        this.saveCanvasState();
    }
    
    /**
     * 选择多样化的样本（反刻板印象：每个glyph都不同）
     * @param {Array} samples - 样本数组
     * @param {Number} count - 需要的样本数量
     * @param {String} method - 选择方法：'random', 'stratified', 'representative'
     */
    selectDiverseSamples(samples, count, method = 'random') {
        if (!samples || samples.length === 0) {
            return [];
        }
        
        if (samples.length <= count) {
            // 如果样本数量不足，返回所有样本（可能重复）
            const result = [...samples];
            while (result.length < count) {
                result.push(samples[Math.floor(Math.random() * samples.length)]);
            }
            return result.slice(0, count);
        }
        
        switch (method) {
            case 'random':
                // 随机选择，确保多样性
                const shuffled = [...samples].sort(() => Math.random() - 0.5);
                return shuffled.slice(0, count);
                
            case 'stratified':
                // 分层选择：从不同特征范围选择样本，确保多样性
                // 按uniqueness_score排序，然后均匀采样
                const sorted = [...samples].sort((a, b) => {
                    const scoreA = a.isotype_signature?.uniqueness_score || 0;
                    const scoreB = b.isotype_signature?.uniqueness_score || 0;
                    return scoreA - scoreB;
                });
                
                const stratified = [];
                for (let i = 0; i < count; i++) {
                    const index = Math.floor((i / count) * sorted.length);
                    stratified.push(sorted[index]);
                }
                return stratified;
                
            case 'representative':
                // 代表性选择：选择最能代表群体多样性的样本
                // 使用k-means类似的方法，选择分布在不同特征空间的样本
                const selected = [];
                const used = new Set();
                
                // 第一个：随机选择
                let current = samples[Math.floor(Math.random() * samples.length)];
                selected.push(current);
                used.add(current.id || current.original_id);
                
                // 后续：选择与已选样本差异最大的
                while (selected.length < count) {
                    let maxDistance = -1;
                    let bestCandidate = null;
                    
                    samples.forEach(sample => {
                        if (used.has(sample.id || sample.original_id)) return;
                        
                        // 计算与已选样本的最小距离
                        let minDist = Infinity;
                        selected.forEach(selectedSample => {
                            const dist = this.calculateSampleDistance(sample, selectedSample);
                            minDist = Math.min(minDist, dist);
                        });
                        
                        if (minDist > maxDistance) {
                            maxDistance = minDist;
                            bestCandidate = sample;
                        }
                    });
                    
                    if (bestCandidate) {
                        selected.push(bestCandidate);
                        used.add(bestCandidate.id || bestCandidate.original_id);
                    } else {
                        // 如果没有更多样本，随机选择
                        const remaining = samples.filter(s => 
                            !used.has(s.id || s.original_id)
                        );
                        if (remaining.length > 0) {
                            const random = remaining[Math.floor(Math.random() * remaining.length)];
                            selected.push(random);
                            used.add(random.id || random.original_id);
                        } else {
                            break;
                        }
                    }
                }
                
                return selected;
                
            default:
                // 默认：随机选择
                const shuffledDefault = [...samples].sort(() => Math.random() - 0.5);
                return shuffledDefault.slice(0, count);
        }
    }
    
    /**
     * 计算两个样本之间的距离（用于选择多样化样本）
     */
    calculateSampleDistance(sample1, sample2) {
        // 基于多个特征计算距离
        let distance = 0;
        
        // 1. Uniqueness score差异
        const score1 = sample1.isotype_signature?.uniqueness_score || 0;
        const score2 = sample2.isotype_signature?.uniqueness_score || 0;
        distance += Math.abs(score1 - score2);
        
        // 2. 情感向量差异
        const emotion1 = sample1.isotype_signature?.emotion || [];
        const emotion2 = sample2.isotype_signature?.emotion || [];
        if (emotion1.length === emotion2.length && emotion1.length > 0) {
            const emotionDist = emotion1.reduce((sum, val, i) => 
                sum + Math.abs(val - (emotion2[i] || 0)), 0
            );
            distance += emotionDist / emotion1.length;
        }
        
        // 3. 颜色差异
        const color1 = sample1.visual_properties?.color || '#000000';
        const color2 = sample2.visual_properties?.color || '#000000';
        distance += this.colorDistance(color1, color2);
        
        return distance;
    }
    
    /**
     * 计算两个颜色之间的距离
     */
    colorDistance(color1, color2) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // 欧几里得距离
        return Math.sqrt(
            Math.pow(r1 - r2, 2) + 
            Math.pow(g1 - g2, 2) + 
            Math.pow(b1 - b2, 2)
        ) / 255; // 归一化到0-1
    }
    
    /**
     * 密度可视化：glyph在紧凑的簇中排列，密度和扩散表示规模
     */
    renderDensityEncoding(label, count, samples, unitSize, density, startY, diversityMethod) {
        const glyphCount = Math.ceil(count / unitSize);
        const diverseSamples = this.selectDiverseSamples(samples, glyphCount, diversityMethod);
        
        // 绘制标签
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.fillText(`${label} (${count})`, 20, startY - 10);
        
        // 计算簇的中心和半径（基于glyph数量和密度）
        const centerX = this.canvas.width / 2;
        const centerY = startY;
        const baseRadius = Math.sqrt(glyphCount) * 15 * density; // 基础半径随密度变化
        
        // 渲染glyph（使用随机但受控的位置，形成有机的簇）
        for (let i = 0; i < glyphCount; i++) {
            // 使用极坐标，但添加随机性
            const angle = (Math.PI * 2 * i) / glyphCount + (Math.random() - 0.5) * 0.5;
            const radiusVariation = (Math.random() - 0.5) * baseRadius * 0.4; // 半径变化
            const radius = baseRadius + radiusVariation;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const sample = diverseSamples[i] || diverseSamples[0];
            if (sample) {
                this.isotypeRenderer.renderIsotype(sample, x, y, false);
                
                const quote = this.extractQuote(sample);
                this.glyphPositions.push({
                    x: x,
                    y: y,
                    originalX: x,
                    originalY: y,
                    sample: sample,
                    quote: quote,
                    isJumping: false
                });
            }
        }
        
        this.saveCanvasState();
    }
    
    /**
     * 堆叠条形图：垂直堆叠glyph，高度表示规模
     */
    renderStackedBarEncoding(label, count, samples, unitSize, barWidth, startY, diversityMethod) {
        const glyphCount = Math.ceil(count / unitSize);
        const diverseSamples = this.selectDiverseSamples(samples, glyphCount, diversityMethod);
        
        // 绘制标签
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.fillText(`${label} (${count})`, 20, startY - 10);
        
        // 计算条形的位置（居中）
        const barX = (this.canvas.width - barWidth) / 2;
        const glyphSize = 12; // 堆叠时的glyph大小
        const glyphSpacing = glyphSize * 1.2; // glyph之间的间距
        
        // 从底部开始堆叠
        const barBottom = startY + 50; // 条形底部位置
        let currentY = barBottom;
        
        // 计算每行能放多少个glyph
        const glyphsPerRow = Math.floor(barWidth / glyphSpacing);
        let currentX = barX + (barWidth - glyphsPerRow * glyphSpacing) / 2; // 居中
        let row = 0;
        
        for (let i = 0; i < glyphCount; i++) {
            if (i > 0 && i % glyphsPerRow === 0) {
                // 换行
                row++;
                currentY = barBottom - row * glyphSpacing;
                currentX = barX + (barWidth - glyphsPerRow * glyphSpacing) / 2;
            }
            
            const x = currentX + (i % glyphsPerRow) * glyphSpacing;
            const y = currentY;
            
            const sample = diverseSamples[i] || diverseSamples[0];
            if (sample) {
                // 临时调整glyph大小
                const originalSize = sample.visual_properties?.size || 10;
                sample.visual_properties = {
                    ...sample.visual_properties,
                    size: glyphSize
                };
                
                this.isotypeRenderer.renderIsotype(sample, x, y, false);
                
                // 恢复原始大小
                sample.visual_properties.size = originalSize;
                
                const quote = this.extractQuote(sample);
                this.glyphPositions.push({
                    x: x,
                    y: y,
                    originalX: x,
                    originalY: y,
                    sample: sample,
                    quote: quote,
                    isJumping: false
                });
            }
        }
        
        this.saveCanvasState();
    }
    
    /**
     * 比例圆形：每个群体用一个圆形表示，半径与规模成正比，内部填充glyph
     */
    renderProportionalCircleEncoding(label, count, samples, allGroups, groupIndex, unitSize, showCircle, startY, diversityMethod) {
        const maxCount = Math.max(...Object.values(allGroups).map(g => g.count));
        const glyphCount = Math.ceil(count / unitSize);
        const diverseSamples = this.selectDiverseSamples(samples, Math.min(glyphCount, 30), diversityMethod); // 限制glyph数量
        
        // 计算圆形的半径（与规模成正比）
        const baseRadius = 80;
        const scale = count / maxCount;
        const circleRadius = baseRadius * (0.4 + scale * 0.6); // 0.4-1.0倍基础半径
        
        // 计算圆形中心位置
        const totalGroups = Object.keys(allGroups).length;
        const padding = 150;
        const availableWidth = this.canvas.width - padding * 2;
        const groupSpacing = availableWidth / (totalGroups - 1 || 1);
        const centerX = padding + groupIndex * groupSpacing;
        const centerY = startY;
        
        // 绘制标签
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${label}`, centerX, startY - 30);
        this.ctx.fillText(`(${count})`, centerX, startY - 15);
        this.ctx.textAlign = 'left';
        
        // 绘制圆形边框（可选）
        if (showCircle) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // 在圆形内分布glyph
        const glyphSize = 8;
        const maxGlyphsInCircle = Math.min(diverseSamples.length, Math.floor((circleRadius * 2) / (glyphSize * 1.5)));
        
        for (let i = 0; i < maxGlyphsInCircle; i++) {
            // 使用极坐标，在圆形内均匀分布
            const angle = (Math.PI * 2 * i) / maxGlyphsInCircle;
            // 使用多层，避免glyph重叠
            const layer = Math.floor(i / 12);
            const layerRadius = circleRadius * (0.3 + layer * 0.25);
            const radius = Math.min(layerRadius, circleRadius - glyphSize);
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const sample = diverseSamples[i] || diverseSamples[0];
            if (sample) {
                // 临时调整glyph大小
                const originalSize = sample.visual_properties?.size || 10;
                sample.visual_properties = {
                    ...sample.visual_properties,
                    size: glyphSize
                };
                
                this.isotypeRenderer.renderIsotype(sample, x, y, false);
                
                // 恢复原始大小
                sample.visual_properties.size = originalSize;
                
                const quote = this.extractQuote(sample);
                this.glyphPositions.push({
                    x: x,
                    y: y,
                    originalX: x,
                    originalY: y,
                    sample: sample,
                    quote: quote,
                    isJumping: false
                });
            }
        }
        
        this.saveCanvasState();
    }
    
    /**
     * 统一社区：将所有群体融合在一起，形成一个多样化的、包容的社区
     * 展示当打破群体边界时，所有人自然地融合成一个有机的整体
     */
    renderUnifiedCommunity(allSamples, totalCount, unitSize, layout, density) {
        const glyphCount = Math.ceil(totalCount / unitSize);
        
        // 随机打乱所有样本，确保不同群体的glyph混合在一起
        const shuffledSamples = [...allSamples].sort(() => Math.random() - 0.5);
        
        // 选择多样化的样本（确保视觉多样性）
        const diverseSamples = this.selectDiverseSamples(shuffledSamples, Math.min(glyphCount, shuffledSamples.length), 'representative');
        
        // 绘制标题
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Unified Community', this.canvas.width / 2, 30);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        this.ctx.fillText(`${totalCount} individuals, ${glyphCount} glyphs`, this.canvas.width / 2, 50);
        this.ctx.textAlign = 'left';
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const padding = 50;
        const availableRadius = Math.min(
            (this.canvas.width / 2) - padding,
            (this.canvas.height / 2) - padding
        );
        
        // 根据布局类型渲染
        if (layout === 'organic') {
            // 有机流动：glyph自然分布，形成流动的、有机的形状
            const baseRadius = Math.sqrt(glyphCount) * 12 * density;
            
            for (let i = 0; i < diverseSamples.length; i++) {
                // 使用极坐标，但添加随机性和有机感
                const angle = (Math.PI * 2 * i) / diverseSamples.length + (Math.random() - 0.5) * 0.8;
                const radiusVariation = (Math.random() - 0.5) * baseRadius * 0.5;
                const radius = baseRadius * (0.3 + Math.random() * 0.7) + radiusVariation;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                const sample = diverseSamples[i];
                if (sample) {
                    this.isotypeRenderer.renderIsotype(sample, x, y, false);
                    
                    const quote = this.extractQuote(sample);
                    this.glyphPositions.push({
                        x: x,
                        y: y,
                        originalX: x,
                        originalY: y,
                        sample: sample,
                        quote: quote,
                        isJumping: false
                    });
                }
            }
        } else if (layout === 'circle') {
            // 统一圆形：所有glyph围绕中心形成一个大的圆形
            const circleRadius = Math.min(availableRadius, Math.sqrt(glyphCount) * 15 * density);
            
            for (let i = 0; i < diverseSamples.length; i++) {
                const angle = (Math.PI * 2 * i) / diverseSamples.length;
                
                // 使用多层，避免重叠
                const layer = Math.floor(i / 20);
                const layerRadius = circleRadius * (0.4 + layer * 0.3);
                const radius = Math.min(layerRadius, circleRadius - 10);
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                const sample = diverseSamples[i];
                if (sample) {
                    this.isotypeRenderer.renderIsotype(sample, x, y, false);
                    
                    const quote = this.extractQuote(sample);
                    this.glyphPositions.push({
                        x: x,
                        y: y,
                        originalX: x,
                        originalY: y,
                        sample: sample,
                        quote: quote,
                        isJumping: false
                    });
                }
            }
        } else if (layout === 'spiral') {
            // 螺旋：glyph沿着螺旋线分布，形成流动感
            const maxRadius = availableRadius * density;
            
            for (let i = 0; i < diverseSamples.length; i++) {
                const t = i / diverseSamples.length;
                const angle = t * Math.PI * 8; // 4圈螺旋
                const radius = maxRadius * t;
                
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                
                const sample = diverseSamples[i];
                if (sample) {
                    this.isotypeRenderer.renderIsotype(sample, x, y, false);
                    
                    const quote = this.extractQuote(sample);
                    this.glyphPositions.push({
                        x: x,
                        y: y,
                        originalX: x,
                        originalY: y,
                        sample: sample,
                        quote: quote,
                        isJumping: false
                    });
                }
            }
        } else if (layout === 'scatter') {
            // 自然散点：glyph随机但均匀地分布在整个画布上
            const spreadX = (this.canvas.width - padding * 2) * density;
            const spreadY = (this.canvas.height - padding * 2) * density;
            
            for (let i = 0; i < diverseSamples.length; i++) {
                // 使用伪随机分布，确保均匀但自然
                const seed = i * 0.618; // 黄金比例，创造更自然的分布
                const x = padding + (Math.sin(seed) * 0.5 + 0.5) * spreadX;
                const y = padding + (Math.cos(seed * 1.618) * 0.5 + 0.5) * spreadY;
                
                const sample = diverseSamples[i];
                if (sample) {
                    this.isotypeRenderer.renderIsotype(sample, x, y, false);
                    
                    const quote = this.extractQuote(sample);
                    this.glyphPositions.push({
                        x: x,
                        y: y,
                        originalX: x,
                        originalY: y,
                        sample: sample,
                        quote: quote,
                        isJumping: false
                    });
                }
            }
        }
        
        this.saveCanvasState();
    }
}

