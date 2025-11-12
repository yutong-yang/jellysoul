/**
 * 节点渲染模块
 * 负责渲染圆形节点，每个人一个独特的isotype风格
 * 参考City Pulse和Africa Population Distribution的设计理念
 */

import { IsotypeRenderer } from './isotypeRenderer.js';

export class NodeRenderer {
    constructor(svg, canvas, ctx) {
        this.svg = svg;
        this.canvas = canvas;
        this.ctx = ctx;
        this.isotypeRenderer = new IsotypeRenderer(canvas, ctx);
        this.useIsotype = true; // 是否使用isotype设计（默认开启）
    }
    
    render(nodes, config, highlightedNode = null) {
        // 在Canvas上渲染节点（圆形）
        // 先渲染普通节点
        nodes.forEach(node => {
            if (node !== highlightedNode) {
                this.renderNode(node, config, false);
            }
        });
        
        // 再渲染高亮节点（在上面）
        if (highlightedNode) {
            this.renderNode(highlightedNode, config, true);
        }
    }
    
    renderNode(node, config, isHighlighted = false) {
        const x = node.x || 0;
        const y = node.y || 0;
        
        // 使用isotype设计（统一框架 + 个人特征）
        if (this.useIsotype) {
            this.isotypeRenderer.renderIsotype(node, x, y, isHighlighted);
        } else {
            // 回退到简单圆形设计
            this.renderSimpleNode(node, config, isHighlighted);
        }
    }
    
    /**
     * 简单圆形节点（回退方案）
     */
    renderSimpleNode(node, config, isHighlighted) {
        const props = node.visual_properties || {};
        const x = node.x || 0;
        const y = node.y || 0;
        const radius = props.size || 10;
        const color = props.color || '#667eea';
        const opacity = props.opacity || 0.8;
        
        // 高亮节点：更大、更亮
        const displayRadius = isHighlighted ? radius * 1.3 : radius;
        const displayOpacity = isHighlighted ? 1.0 : opacity;
        
        // 绘制圆形节点
        this.ctx.save();
        
        // 创建渐变（降低节点不透明度，让大圆更突出）
        const reducedOpacity = displayOpacity * 0.7; // 降低30%的不透明度
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, displayRadius);
        gradient.addColorStop(0, this.adjustColor(color, 1.2, reducedOpacity));
        gradient.addColorStop(0.7, this.adjustColor(color, 1.0, reducedOpacity));
        gradient.addColorStop(1, this.adjustColor(color, 0.8, reducedOpacity * 0.5));
        
        // 绘制主圆形
        this.ctx.beginPath();
        this.ctx.arc(x, y, displayRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 绘制边框（柔和的边缘，比大圆更细）
        if (isHighlighted) {
            // 高亮节点：柔和的米色边框
            this.ctx.strokeStyle = 'rgba(212, 165, 116, 0.5)'; // 降低不透明度
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else if (node.isotype_signature?.dominant_dimensions) {
            // 普通节点：基于主导维度的柔和边框（更细，更透明）
            const borderColor = this.getDimensionColor(
                node.isotype_signature.dominant_dimensions[0]
            );
            this.ctx.strokeStyle = this.addAlpha(borderColor, 0.3); // 降低到0.3
            this.ctx.lineWidth = 1.2; // 更细
            this.ctx.stroke();
        }
        
        // 可选：添加内部纹理/图案
        if (config.showPatterns) {
            this.addPattern(node, x, y, radius);
        }
        
        this.ctx.restore();
    }
    
    adjustColor(color, brightness, opacity) {
        // 调整颜色亮度和透明度
        // 简化实现，实际可以使用更复杂的颜色处理
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.min(255, Math.max(0, r * brightness));
        const newG = Math.min(255, Math.max(0, g * brightness));
        const newB = Math.min(255, Math.max(0, b * brightness));
        
        return `rgba(${newR}, ${newG}, ${newB}, ${opacity})`;
    }
    
    getDimensionColor(dimension) {
        // 根据维度返回颜色（优雅的艺术配色）
        const colors = {
            experience: '#D4A5A5', // 柔和的粉红色
            emotion: '#A8C5B8',   // 柔和的青绿色
            topic: '#B8A8C8',     // 柔和的紫色
            semantic: '#E8C5A0'    // 温暖的米色
        };
        return colors[dimension] || '#B8A8C8';
    }
    
    addAlpha(color, alpha) {
        // 添加透明度
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    addPattern(node, x, y, radius) {
        // 添加内部纹理/图案（可选）
        // 可以基于叙事风格添加不同的图案
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        // 示例：添加点状纹理
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const px = x + Math.cos(angle) * (radius * 0.6);
            const py = y + Math.sin(angle) * (radius * 0.6);
            
            this.ctx.beginPath();
            this.ctx.arc(px, py, radius * 0.15, 0, Math.PI * 2);
            this.ctx.fillStyle = 'white';
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
}

