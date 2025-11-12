/**
 * 聚类融合模块 - 生成艺术版本
 * 使用生成艺术技术将相似的节点融合成有机的大圆
 */

import { EmotiveArt } from './emotiveArt.js';

export class ClusterFusion {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.emotiveArt = new EmotiveArt();
    }
    
    /**
     * 检测聚类（基于相似度）- 改进版，更宽松的阈值
     */
    detectClusters(nodes, links, similarityThreshold = 0.7) {
        const clusters = [];
        const visited = new Set();
        
        // 创建节点索引映射
        const nodeIndexMap = new Map();
        nodes.forEach((node, index) => {
            nodeIndexMap.set(node, index);
        });
        
        nodes.forEach((node, index) => {
            if (visited.has(index)) return;
            
            // 从当前节点开始BFS找聚类
            const cluster = [node];
            const queue = [index];
            visited.add(index);
            
            while (queue.length > 0) {
                const currentIndex = queue.shift();
                const currentNode = nodes[currentIndex];
                
                // 找所有连接的节点
                links.forEach(link => {
                    let neighborNode = null;
                    if (link.source === currentNode) {
                        neighborNode = link.target;
                    } else if (link.target === currentNode) {
                        neighborNode = link.source;
                    }
                    
                    if (neighborNode) {
                        const neighborIndex = nodeIndexMap.get(neighborNode);
                        
                        if (neighborIndex !== undefined && 
                            !visited.has(neighborIndex) && 
                            link.similarity >= similarityThreshold) {
                            visited.add(neighborIndex);
                            cluster.push(neighborNode);
                            queue.push(neighborIndex);
                        }
                    }
                });
            }
            
            // 只保留有多个节点的聚类
            if (cluster.length >= 2) {
                clusters.push(cluster);
            }
        });
        
        return clusters;
    }
    
    /**
     * 计算聚类的中心点和半径
     */
    calculateClusterBounds(cluster) {
        if (cluster.length === 0) return null;
        
        // 计算中心点
        const centerX = cluster.reduce((sum, node) => sum + (node.x || 0), 0) / cluster.length;
        const centerY = cluster.reduce((sum, node) => sum + (node.y || 0), 0) / cluster.length;
        
        // 计算最大距离（作为半径）
        let maxDistance = 0;
        cluster.forEach(node => {
            const dx = (node.x || 0) - centerX;
            const dy = (node.y || 0) - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            maxDistance = Math.max(maxDistance, distance);
        });
        
        // 添加一些padding
        const radius = maxDistance * 1.3;
        
        return {
            centerX,
            centerY,
            radius,
            nodes: cluster
        };
    }
    
    /**
     * 生成聚类的融合形状（基于生成艺术）
     */
    generateFusionShape(clusterBounds) {
        if (!clusterBounds || clusterBounds.nodes.length === 0) return null;
        
        // 使用聚类内节点的平均特征生成种子
        const seed = this.generateClusterSeed(clusterBounds.nodes);
        
        // 生成有机形状的点
        const numPoints = 32;
        const points = [];
        
        // 使用有机的形状（反映群体的共同特征）
        // 计算聚类内节点的平均情感特征
        const avgEmotion = clusterBounds.nodes.length > 0
            ? clusterBounds.nodes.reduce((sum, n) => {
                const e = n.isotype_signature?.emotion || [];
                const maxE = e.length > 0 ? Math.max(...e) : 0.5;
                return sum + maxE;
            }, 0) / clusterBounds.nodes.length
            : 0.5;
        
        const softness = 0.12 + avgEmotion * 0.1; // 根据平均情感调整柔软度
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            
            // 使用平滑噪声创造有机感
            const noise = this.emotiveArt.smoothNoise(
                Math.cos(angle) * 2,
                Math.sin(angle) * 2,
                seed,
                3
            );
            
            const distance = clusterBounds.radius * (0.94 + noise * softness);
            
            points.push({
                x: clusterBounds.centerX + Math.cos(angle) * distance,
                y: clusterBounds.centerY + Math.sin(angle) * distance
            });
        }
        
        return {
            points,
            seed,
            bounds: clusterBounds
        };
    }
    
    /**
     * 生成聚类的种子（基于节点特征）
     */
    generateClusterSeed(nodes) {
        // 使用聚类内所有节点的特征生成唯一种子
        let seed = 0;
        nodes.forEach((node, index) => {
            const id = node.original_id || node.id || '';
            const idNum = parseInt(id.match(/\d+/)?.[0] || '0');
            const semantic = node.isotype_signature?.semantic || [];
            const semanticSum = semantic.slice(0, 5).reduce((a, b) => a + Math.abs(b), 0);
            seed += (idNum * 100 + Math.floor(semanticSum * 100)) * (index + 1);
        });
        return seed;
    }
    
    /**
     * 绘制融合形状（有机的大圆）- 多色混合、丰富质感
     */
    drawFusionShape(fusionShape, opacity = 0.4) {
        if (!fusionShape || !fusionShape.points) return;
        
        const { points, bounds } = fusionShape;
        
        this.ctx.save();
        
        // 获取聚类内所有节点的颜色（保持多样性）
        const nodeColors = bounds.nodes.map(node => 
            node.visual_properties?.color || '#8B7FA8'
        ).filter(color => color);
        
        if (nodeColors.length === 0) {
            this.ctx.restore();
            return;
        }
        
        // 创建多色渐变 - 使用聚类内节点的多种颜色
        const gradient = this.ctx.createRadialGradient(
            bounds.centerX, bounds.centerY, 0,
            bounds.centerX, bounds.centerY, bounds.radius
        );
        
        // 根据节点数量分布颜色
        if (nodeColors.length === 1) {
            // 单个颜色：创建从中心到边缘的渐变
            gradient.addColorStop(0, this.addAlpha(nodeColors[0], opacity * 0.6));
            gradient.addColorStop(0.5, this.addAlpha(nodeColors[0], opacity * 0.4));
            gradient.addColorStop(1, this.addAlpha(nodeColors[0], opacity * 0.15));
        } else if (nodeColors.length === 2) {
            // 两个颜色：中心一种，边缘一种
            gradient.addColorStop(0, this.addAlpha(nodeColors[0], opacity * 0.6));
            gradient.addColorStop(0.5, this.addAlpha(nodeColors[1], opacity * 0.4));
            gradient.addColorStop(1, this.addAlpha(nodeColors[1], opacity * 0.15));
        } else {
            // 多个颜色：创建丰富的多色渐变
            const numStops = Math.min(5, nodeColors.length);
            for (let i = 0; i < numStops; i++) {
                const stop = i / (numStops - 1);
                const colorIndex = Math.floor((nodeColors.length - 1) * stop);
                const color = nodeColors[colorIndex];
                const stopOpacity = opacity * (0.6 - stop * 0.45); // 从中心到边缘逐渐变淡
                gradient.addColorStop(stop, this.addAlpha(color, stopOpacity));
            }
        }
        
        // 绘制有机形状
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        // 使用平滑的曲线连接，创造有机感
        for (let i = 1; i < points.length; i++) {
            const p0 = points[(i - 1 + points.length) % points.length];
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            
            if (i === 1) {
                this.ctx.moveTo(p0.x, p0.y);
            }
            
            // 使用二次贝塞尔曲线
            const endX = (p1.x + p2.x) / 2;
            const endY = (p1.y + p2.y) / 2;
            this.ctx.quadraticCurveTo(p1.x, p1.y, endX, endY);
        }
        
        this.ctx.closePath();
        
        // 填充
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 绘制多色边框 - 使用平均颜色或主要颜色
        const avgColor = this.calculateAverageColor(bounds.nodes);
        this.ctx.strokeStyle = this.addAlpha(avgColor, opacity * 0.6);
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        
        // 添加内部纹理 - 使用多个颜色创建更丰富的质感
        if (nodeColors.length > 1) {
            this.drawColorBlendTexture(bounds, nodeColors, opacity * 0.3);
        }
        
        this.ctx.restore();
    }
    
    /**
     * 绘制颜色混合纹理（增强质感）
     */
    drawColorBlendTexture(bounds, colors, opacity) {
        const numPoints = Math.min(colors.length * 3, 12);
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            const radius = bounds.radius * (0.4 + (i % 3) * 0.15);
            const colorIndex = i % colors.length;
            const color = colors[colorIndex];
            
            this.ctx.beginPath();
            this.ctx.arc(
                bounds.centerX + Math.cos(angle) * radius * 0.6,
                bounds.centerY + Math.sin(angle) * radius * 0.6,
                2,
                0,
                Math.PI * 2
            );
            this.ctx.fillStyle = this.addAlpha(color, opacity);
            this.ctx.fill();
        }
    }
    
    /**
     * 增强颜色饱和度（让颜色更鲜艳）
     */
    enhanceColorSaturation(color, factor = 1.2) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 转换为HSL
        const max = Math.max(r, g, b) / 255;
        const min = Math.min(r, g, b) / 255;
        const l = (max + min) / 2;
        let s = 0;
        
        if (max !== min) {
            s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
        }
        
        // 增加饱和度
        s = Math.min(1, s * factor);
        
        // 转换回RGB
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((max * 255 - min * 255) / (max - min)) / 60 % 2 - 1));
        const m = l * 255 - c * 255 / 2;
        
        let newR, newG, newB;
        if (max === min) {
            newR = newG = newB = l * 255;
        } else {
            const maxVal = max * 255;
            if (maxVal === r) {
                newR = c * 255 + m;
                newG = x + m;
                newB = m;
            } else if (maxVal === g) {
                newR = x + m;
                newG = c * 255 + m;
                newB = m;
            } else {
                newR = m;
                newG = x + m;
                newB = c * 255 + m;
            }
        }
        
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    }
    
    /**
     * 计算聚类内节点的平均颜色
     */
    calculateAverageColor(nodes) {
        if (nodes.length === 0) return '#8B7FA8';
        
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        nodes.forEach(node => {
            const color = node.visual_properties?.color || '#8B7FA8';
            const hex = color.replace('#', '');
            if (hex.length === 6) {
                r += parseInt(hex.substr(0, 2), 16);
                g += parseInt(hex.substr(2, 2), 16);
                b += parseInt(hex.substr(4, 2), 16);
                count++;
            }
        });
        
        if (count === 0) return '#8B7FA8';
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * 绘制聚类内的连接（已禁用 - 融合模式下不显示连接线）
     */
    drawClusterConnections(clusterBounds, links) {
        // 融合模式下不绘制连接线，只显示融合的大圆
        return;
    }
    
    /**
     * 绘制粒子流动效果（聚类内的能量流动）
     */
    drawParticleFlow(clusterBounds, seed) {
        if (!clusterBounds || clusterBounds.nodes.length < 2) return;
        
        this.ctx.save();
        
        // 在聚类边界内生成流动粒子
        const numParticles = Math.min(20, clusterBounds.nodes.length * 3);
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const noiseValue = this.emotiveArt.smoothNoise(
                Math.cos(angle) * 2,
                Math.sin(angle) * 2,
                seed + i,
                2
            );
            
            const radius = clusterBounds.radius * (0.3 + noiseValue * 0.5);
            const x = clusterBounds.centerX + Math.cos(angle) * radius;
            const y = clusterBounds.centerY + Math.sin(angle) * radius;
            
            const avgColor = this.calculateAverageColor(clusterBounds.nodes);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            this.ctx.fillStyle = this.addAlpha(avgColor, 0.3);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 渲染所有聚类融合
     */
    renderClusters(nodes, links, similarityThreshold = 0.7) {
        if (!nodes || nodes.length === 0 || !links || links.length === 0) {
            return [];
        }
        
        // 检测聚类（使用更宽松的阈值）
        const clusters = this.detectClusters(nodes, links, similarityThreshold * 0.9); // 降低阈值以检测更多聚类
        
        if (clusters.length === 0) {
            console.log('未检测到聚类');
            return [];
        }
        
        console.log(`检测到 ${clusters.length} 个聚类`);
        
        // 为每个聚类生成融合形状
        const fusionShapes = clusters.map((cluster, index) => {
            const bounds = this.calculateClusterBounds(cluster);
            if (!bounds) return null;
            console.log(`聚类 ${index}: ${cluster.length} 个节点, 半径: ${bounds.radius.toFixed(1)}`);
            return this.generateFusionShape(bounds);
        }).filter(shape => shape !== null);
        
        // 绘制所有融合形状（从大到小，避免遮挡）
        fusionShapes.sort((a, b) => b.bounds.radius - a.bounds.radius);
        
        fusionShapes.forEach((fusionShape, index) => {
            // 1. 绘制融合形状（最底层）- 多色混合、丰富质感
            this.drawFusionShape(fusionShape, 0.4); // 适中的不透明度，保持层次感
            
            // 2. 绘制粒子流动效果（可选，增加视觉丰富度）
            // this.drawParticleFlow(fusionShape.bounds, fusionShape.seed);
            
            // 3. 不绘制连接线（融合模式下只显示大圆）
        });
        
        return fusionShapes;
    }
    
    // 辅助方法
    addAlpha(color, alpha) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

