/**
 * Flow渲染模块
 * 负责渲染连接线和流动效果
 */

export class FlowRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.animationFrame = null;
        this.animationStarted = false;
        this.lastLinkCount = 0;
    }
    
    render(links, nodes, config) {
        // 渲染连接线
        links.forEach(link => {
            this.renderLink(link, config);
        });
        
        // 只在第一次或链接变化时启动动画（避免重复启动）
        if (!this.animationStarted || this.lastLinkCount !== links.length) {
            this.animationStarted = true;
            this.lastLinkCount = links.length;
            this.animateFlow(links, config);
        }
    }
    
    renderLink(link, config) {
        const source = link.source;
        const target = link.target;
        const similarity = link.similarity || 0.5;
        
        if (!source || !target || !source.x || !source.y || !target.x || !target.y) {
            return;
        }
        
        const sourceColor = source.visual_properties?.color || '#667eea';
        const targetColor = target.visual_properties?.color || '#667eea';
        
        // 创建渐变（从源节点颜色到目标节点颜色）
        const gradient = this.ctx.createLinearGradient(
            source.x, source.y,
            target.x, target.y
        );
        gradient.addColorStop(0, this.addAlpha(sourceColor, similarity * 0.4));
        gradient.addColorStop(0.5, this.addAlpha(this.blendColors(sourceColor, targetColor), similarity * 0.5));
        gradient.addColorStop(1, this.addAlpha(targetColor, similarity * 0.4));
        
        // 绘制连接线（使用贝塞尔曲线让flow更自然）
        this.ctx.save();
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = similarity * 3;
        this.ctx.lineCap = 'round';
        
        // 计算控制点（让曲线更自然）
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const controlX = source.x + dx * 0.5 + (Math.random() - 0.5) * 50;
        const controlY = source.y + dy * 0.5 + (Math.random() - 0.5) * 50;
        
        this.ctx.beginPath();
        this.ctx.moveTo(source.x, source.y);
        this.ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    animateFlow(links, config) {
        // 创建流动粒子
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // 为每条连接线创建粒子
        this.particles = [];
        links.forEach((link, index) => {
            if (link.similarity > 0.7) { // 只在高相似度的连接上显示粒子
                this.particles.push({
                    link: link,
                    progress: Math.random(),
                    speed: link.similarity * 0.02
                });
            }
        });
        
        const animate = () => {
            // 清除画布（但保留节点）
            // 这里我们只清除连接线部分，节点由nodeRenderer负责
            
            // 更新并绘制粒子
            this.particles.forEach(particle => {
                particle.progress += particle.speed;
                if (particle.progress > 1) {
                    particle.progress = 0;
                }
                
                this.drawParticle(particle);
            });
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    drawParticle(particle) {
        const link = particle.link;
        const source = link.source;
        const target = link.target;
        
        if (!source || !target || !source.x || !source.y || !target.x || !target.y) {
            return;
        }
        
        // 计算粒子位置（沿贝塞尔曲线）
        const t = particle.progress;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const controlX = source.x + dx * 0.5;
        const controlY = source.y + dy * 0.5;
        
        // 二次贝塞尔曲线插值
        const x = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * controlX + t * t * target.x;
        const y = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * controlY + t * t * target.y;
        
        // 绘制粒子
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillStyle = link.source.visual_properties?.color || '#667eea';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    blendColors(color1, color2) {
        // 混合两种颜色
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.floor((r1 + r2) / 2);
        const g = Math.floor((g1 + g2) / 2);
        const b = Math.floor((b1 + b2) / 2);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    addAlpha(color, alpha) {
        // 添加透明度
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

