/**
 * 交互处理模块
 */

// d3通过CDN全局引入，不需要import

export class InteractionHandler {
    constructor(svg, app) {
        this.svg = svg;
        this.app = app;
        this.selectedNode = null;
        this.tooltip = null;
        this.jumpingNodes = new Set(); // 正在跳跃的节点
        this.initTooltip();
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
     * 从文本中提取真实句子（只从A:回答中提取，忽略Q:问题）
     */
    extractRealSentence(node) {
        const text = node.text_content || '';
        if (!text) return "I have a story to tell.";
        
        // 提取所有A:开头的回答（忽略Q:问题）
        const answerMatches = text.match(/(?:A:\s*|A：\s*)([^Q\n]+?)(?=\n\n|Q:|Q：|$)/gi);
        if (answerMatches && answerMatches.length > 0) {
            // 收集所有A:回答中的句子
            const allSentences = [];
            
            for (const answer of answerMatches) {
                const cleanAnswer = answer.replace(/^A:\s*|^A：\s*/i, '').trim();
                
                // 提取所有完整句子（以句号、问号、感叹号结尾）
                const sentences = cleanAnswer.match(/[^.!?。！？]+[.!?。！？]/g);
                if (sentences) {
                    sentences.forEach(s => {
                        const trimmed = s.trim();
                        if (trimmed.length > 10) {
                            allSentences.push(trimmed);
                        }
                    });
                }
                
                // 如果没有标点但长度足够，也加入（作为完整回答）
                if (cleanAnswer.length > 10 && !cleanAnswer.match(/[.!?。！？]/)) {
                    allSentences.push(cleanAnswer.substring(0, 150).trim() + (cleanAnswer.length > 150 ? '...' : ''));
                }
            }
            
            // 如果有提取到的句子，使用节点ID作为种子选择其中一个
            if (allSentences.length > 0) {
                const nodeId = node.id || node.original_id || '';
                const seed = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const index = seed % allSentences.length;
                return allSentences[index];
            }
        }
        
        // 如果没有A:回答，尝试从普通文本中提取（但要排除Q:开头的内容）
        const lines = text.split('\n').filter(line => {
            const trimmed = line.trim();
            // 排除Q:开头的行
            return trimmed.length > 10 && !trimmed.match(/^Q:\s*|^Q：\s*/i);
        });
        
        if (lines.length > 0) {
            const sentences = lines.join(' ').split(/[.!?。！？]/).filter(s => s.trim().length > 10);
            if (sentences.length > 0) {
                const nodeId = node.id || node.original_id || '';
                const seed = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const index = seed % sentences.length;
                return sentences[index].trim();
            }
        }
        
        // 如果都没有，返回默认
        return "I have a story to tell.";
    }
    
    /**
     * 显示tooltip（使用页面坐标）
     */
    showTooltip(pageX, pageY, quote) {
        if (!this.tooltip) return;
        
        this.tooltip.textContent = quote;
        this.tooltip.style.display = 'block';
        
        // 强制重新计算尺寸
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.display = 'block';
        const tooltipWidth = this.tooltip.offsetWidth || 200;
        const tooltipHeight = this.tooltip.offsetHeight || 50;
        this.tooltip.style.visibility = 'visible';
        
        const padding = 10;
        const arrowOffset = 20;
        
        // 默认显示在鼠标上方
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
            this.tooltip.classList.add('arrow-below');
            this.tooltip.classList.remove('arrow-above');
        } else {
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
     * 让节点跳跃（优化版本）
     */
    makeNodeJump(node) {
        if (!node || this.jumpingNodes.has(node.id)) return;
        
        this.jumpingNodes.add(node.id);
        const originalX = node.x || 0;
        const originalY = node.y || 0;
        const jumpHeight = 15;
        const jumpDuration = 400;
        const startTime = Date.now();
        
        // 保存canvas状态
        const canvas = this.app.canvas;
        const ctx = this.app.ctx;
        const transform = this.app.transform;
        
        // 创建离屏canvas保存状态
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.drawImage(canvas, 0, 0);
        
        // 保存原始节点位置（用于恢复）
        const savedX = originalX;
        const savedY = originalY;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / jumpDuration, 1);
            
            // 弹性缓动函数
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
            
            const bounce = easeOutBounce(progress);
            const currentY = originalY - jumpHeight * (1 - bounce);
            const currentX = originalX;
            
            // 计算需要清除的区域（考虑zoom变换）
            const glyphSize = (node.visual_properties?.size || 10) * 2;
            const scaledSize = glyphSize * transform.k;
            const minX = Math.min(savedX, currentX) - scaledSize;
            const minY = Math.min(savedY, currentY) - scaledSize;
            const maxX = Math.max(savedX, currentX) + scaledSize;
            const maxY = Math.max(savedY, currentY) + scaledSize;
            
            // 转换到canvas坐标
            const canvasMinX = (minX * transform.k) + transform.x;
            const canvasMinY = (minY * transform.k) + transform.y;
            const canvasMaxX = (maxX * transform.k) + transform.x;
            const canvasMaxY = (maxY * transform.k) + transform.y;
            
            const clearX = Math.max(0, Math.floor(canvasMinX));
            const clearY = Math.max(0, Math.floor(canvasMinY));
            const clearWidth = Math.min(canvas.width - clearX, Math.ceil(canvasMaxX - canvasMinX));
            const clearHeight = Math.min(canvas.height - clearY, Math.ceil(canvasMaxY - canvasMinY));
            
            // 清除区域
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(clearX, clearY, clearWidth, clearHeight);
            
            // 从离屏canvas恢复背景
            ctx.drawImage(
                offscreenCanvas,
                clearX, clearY, clearWidth, clearHeight,
                clearX, clearY, clearWidth, clearHeight
            );
            ctx.restore();
            
            // 临时更新节点位置用于渲染
            const tempX = node.x;
            const tempY = node.y;
            node.x = currentX;
            node.y = currentY;
            
            // 重新渲染节点
            ctx.save();
            ctx.translate(transform.x, transform.y);
            ctx.scale(transform.k, transform.k);
            if (this.app.nodeRenderer && this.app.nodeRenderer.isotypeRenderer) {
                this.app.nodeRenderer.isotypeRenderer.renderIsotype(node, currentX, currentY, true);
            }
            ctx.restore();
            
            // 恢复节点位置（不改变实际位置，只用于动画）
            node.x = tempX;
            node.y = tempY;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画结束，确保节点位置正确
                node.x = savedX;
                node.y = savedY;
                this.jumpingNodes.delete(node.id);
                // 重新渲染整个画布
                this.app.render();
            }
        };
        
        animate();
    }
    
    setup(nodes, links) {
        // 保存引用
        this.nodes = nodes;
        this.links = links;
        
        // 设置节点交互
        // 由于节点在Canvas上，我们需要用透明SVG元素作为交互层
        this.setupInteractionLayer(nodes);
    }
    
    setupInteractionLayer(nodes) {
        // 清除旧的交互层
        this.svg.select('.interaction-layer').remove();
        
        // 创建透明的交互层（放在zoom容器内，这样会自动应用变换）
        const zoomContainer = this.svg.select('.zoom-container');
        const interactionGroup = zoomContainer.append('g')
            .attr('class', 'interaction-layer')
            .style('pointer-events', 'all'); // 确保可以交互
        
        // 为每个节点创建透明的圆形用于交互
        // 增加半径以匹配实际的glyph渲染大小（包括光晕和边缘）
        const circles = interactionGroup.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('r', d => {
                const baseSize = d.visual_properties?.size || 10;
                // 考虑光晕和边缘，增加点击区域
                return baseSize * 1.5 + 10;
            })
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.onNodeHover(event, d))
            .on('mouseout', (event, d) => this.onNodeLeave(event, d))
            .on('click', (event, d) => this.onNodeClick(event, d));
        
        // 更新位置
        this.updateInteractionLayer(nodes);
    }
    
    updateInteractionLayer(nodes) {
        if (!nodes || nodes.length === 0) return;
        
        const circles = this.svg.selectAll('.interaction-layer circle')
            .data(nodes);
        
        // 更新现有元素（直接使用节点坐标，zoom容器会自动应用变换）
        circles
            .attr('cx', d => d.x || 0)
            .attr('cy', d => d.y || 0);
        
        // 添加新元素
        circles.enter()
            .append('circle')
            .attr('r', d => {
                const baseSize = d.visual_properties?.size || 10;
                // 考虑光晕和边缘，增加点击区域
                return baseSize * 1.5 + 10;
            })
            .attr('fill', 'transparent')
            .attr('stroke', 'none')
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.onNodeHover(event, d))
            .on('mouseout', (event, d) => this.onNodeLeave(event, d))
            .on('click', (event, d) => this.onNodeClick(event, d))
            .attr('cx', d => d.x || 0)
            .attr('cy', d => d.y || 0);
        
        // 移除不存在的元素
        circles.exit().remove();
    }
    
    onNodeHover(event, node) {
        // 使用事件的实际鼠标位置来显示tooltip
        const quote = this.extractRealSentence(node);
        this.showTooltip(event.clientX, event.clientY, quote);
        
        // 高亮节点和相关连接
        this.highlightNode(node);
        this.showNodeInfo(node);
    }
    
    onNodeLeave(event, node) {
        // 隐藏tooltip
        this.hideTooltip();
        
        // 如果不是选中的节点，取消高亮
        if (this.selectedNode !== node) {
            this.clearHighlight();
            // 如果鼠标离开时没有选中节点，清空信息面板
            if (!this.selectedNode) {
                this.clearNodeInfo();
            }
        }
    }
    
    onNodeClick(event, node) {
        // 点击节点 - 让节点跳跃
        this.makeNodeJump(node);
        
        // 选中节点并显示信息
        this.selectedNode = node;
        this.highlightNode(node);
        this.showNodeInfo(node);
    }
    
    highlightNode(node) {
        // 高亮节点（在Canvas上重新渲染）
        // 这里需要通知app重新渲染
        if (this.app) {
            this.app.highlightedNode = node;
            this.app.highlightedLinks = this.links ? this.links.filter(link => 
                link.source === node || link.target === node
            ) : [];
            this.app.render();
        }
    }
    
    clearHighlight() {
        if (this.app) {
            this.app.highlightedNode = null;
            this.app.highlightedLinks = [];
            this.app.render();
        }
    }
    
    showNodeInfo(node) {
        // 在侧边栏显示节点信息
        const infoPanel = d3.select('#node-info');
        
        // 计算连接数
        const connectedNodes = this.links ? this.links.filter(link => 
            link.source === node || link.target === node
        ).length : 0;
        
        // 获取情感分数
        const emotionScores = node.isotype_signature?.emotion || [];
        const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
        const emotionData = emotions.map((emotion, i) => ({
            name: emotion,
            value: emotionScores[i] || 0
        })).filter(e => e.value > 0.1).sort((a, b) => b.value - a.value);
        
        // 获取聚类信息
        const clusters = node.cluster_assignments || {};
        
        // 获取完整文本内容
        const fullText = node.text_content || 'No text content';
        
        // 格式化文本：保留换行和段落结构
        const formattedText = this.formatInterviewText(fullText);
        
        // 获取glyph的解释（用于在实际应用中向观众解释视觉编码）
        let glyphInterpretation = null;
        if (this.app.nodeRenderer && this.app.nodeRenderer.isotypeRenderer) {
            try {
                glyphInterpretation = this.app.nodeRenderer.isotypeRenderer.getGlyphInterpretation(node);
            } catch (e) {
                console.warn('Failed to get glyph interpretation:', e);
            }
        }
        
        // Ensure all data exists (debug log)
        // console.log('Node data:', {
        //     id: node.original_id || node.id,
        //     hasText: !!fullText,
        //     textLength: fullText.length,
        //     hasEmotion: emotionData.length > 0,
        //     hasClusters: Object.keys(clusters).length > 0,
        //     hasGlyphInterpretation: !!glyphInterpretation
        // });
        
        const html = `
            <div class="node-detail">
                <div class="node-header">
                    <h4>${node.original_id || node.id}</h4>
                    <div class="node-meta">
                        <span class="meta-item">Connections: ${connectedNodes}</span>
                        <span class="meta-item">Uniqueness: ${(node.isotype_signature?.uniqueness_score || 0).toFixed(2)}</span>
                    </div>
                </div>
                
                ${glyphInterpretation ? `
                <div class="glyph-interpretation">
                    <div class="interpretation-header">
                        <h5>Visual Feature Interpretation</h5>
                        <p class="interpretation-summary">${glyphInterpretation.summary}</p>
                    </div>
                    <div class="interpretation-details">
                        ${glyphInterpretation.interpretations && glyphInterpretation.interpretations.length > 0 ? glyphInterpretation.interpretations.map(interp => `
                            <div class="interpretation-item">
                                <div class="interpretation-feature">
                                    <strong>${interp.feature}:</strong> ${interp.value}
                                </div>
                                <div class="interpretation-meaning">${interp.meaning}</div>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="text-content">
                    <div class="text-header">
                        <h5>Interview Content</h5>
                        <span class="text-length">${node.metadata?.text_length || fullText.length || 0} chars</span>
                    </div>
                    <div class="text-body">${formattedText || 'No text content available'}</div>
                </div>
                
                <div class="detail-sections-collapsed">
                    <details class="detail-section">
                        <summary>Dimensions & Clusters</summary>
                        <div class="detail-content">
                            <div class="detail-item">
                                <span class="detail-label">Dominant Dimensions:</span>
                                <span class="detail-value">${(node.isotype_signature?.dominant_dimensions || ['semantic']).join(', ')}</span>
                            </div>
                            ${Object.keys(clusters).length > 0 ? `
                            <div class="detail-item">
                                <span class="detail-label">Clusters:</span>
                                <span class="detail-value">${Object.entries(clusters).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
                            </div>
                            ` : ''}
                        </div>
                    </details>
                    
                    ${emotionData.length > 0 ? `
                    <details class="detail-section">
                        <summary>Emotion Distribution</summary>
                        <div class="detail-content">
                            ${emotionData.map(e => `
                                <div class="emotion-bar">
                                    <span class="emotion-name">${e.name}:</span>
                                    <div class="emotion-bar-container">
                                        <div class="emotion-bar-fill" style="width: ${e.value * 100}%"></div>
                                    </div>
                                    <span class="emotion-value">${(e.value * 100).toFixed(1)}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                    ` : ''}
                </div>
            </div>
        `;
        
        infoPanel.html(html);
    }
    
    clearNodeInfo() {
        const infoPanel = d3.select('#node-info');
        infoPanel.html(`
            <p style="text-align: center; color: rgba(255, 255, 255, 0.7); padding: 3rem 2rem; font-style: italic; line-height: 1.8;">
                Each circle is a person with story<br>
                Hover or click to listen
            </p>
        `);
    }
    
    formatInterviewText(text) {
        if (!text) return 'No text content';
        
        // 转义HTML特殊字符
        const escapeHtml = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };
        
        let formatted = escapeHtml(text);
        
        // 先处理SCRIPT部分（避免干扰Q&A匹配）
        formatted = formatted.replace(/(SCRIPT:\s*)(.+?)(?=Q:|Q：|A:|A：|SCRIPT:|$)/gis, '<div class="script"><em>SCRIPT:</em> $2</div>');
        
        // 使用更简单的方法：先标记所有Q和A，然后统一替换
        // 使用特殊标记避免重复替换
        const markers = [];
        let markerIndex = 0;
        
        // 标记所有Q
        formatted = formatted.replace(/(Q:\s*|Q：\s*)([\s\S]*?)(?=(?:A:\s*|A：\s*|Q:\s*|Q：\s*|$))/gi, (match, prefix, content) => {
            const marker = `__Q_MARKER_${markerIndex}__`;
            markers.push({
                marker: marker,
                type: 'question',
                content: content.trim()
            });
            markerIndex++;
            return marker;
        });
        
        // 标记所有A
        formatted = formatted.replace(/(A:\s*|A：\s*)([\s\S]*?)(?=(?:Q:\s*|Q：\s*|A:\s*|A：\s*|$))/gi, (match, prefix, content) => {
            const marker = `__A_MARKER_${markerIndex}__`;
            markers.push({
                marker: marker,
                type: 'answer',
                content: content.trim()
            });
            markerIndex++;
            return marker;
        });
        
        // 替换所有标记为HTML
        markers.forEach(item => {
            if (item.type === 'question') {
                formatted = formatted.replace(item.marker, `<div class="question"><strong>Q:</strong> ${item.content}</div>`);
            } else {
                formatted = formatted.replace(item.marker, `<div class="answer"><strong>A:</strong> ${item.content}</div>`);
            }
        });
        
        // 保留换行（但不在已格式化的div内）
        formatted = formatted.replace(/\n(?![^<]*<\/div>)/g, '<br>');
        
        // 如果没有任何格式化，至少保留换行
        if (!formatted.includes('<div')) {
            formatted = formatted.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('');
        }
        
        return formatted;
    }
}

