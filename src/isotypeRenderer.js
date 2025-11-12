/**
 * Isotype渲染模块 - 基于Subjectivity的统一框架设计
 * 
 * 设计理念：
 * 1. 统一框架（共性）：所有glyph都基于相同的圆形基础结构
 * 2. 个体特征（从subjectivity来）：根据文本提取的subjectivity特征调整视觉表现
 * 
 * 设计目标：
 * - 用主观性编码人，让graph更温暖多元，尊重每个主体
 * - 类似isotype或anthropographics，在实际数据可视化场景中可用
 * - 在data story中可以有这样的设计
 * 
 * 设计原则：
 * - 统一编码，个人表达：所有人使用相同的视觉框架，但每个人有独特的视觉特征
 * - 尊重与关怀：每一个节点都代表一个真实的人，需要被尊重和理解
 * - 温暖多元：避免冷冰冰的数据点，让每个主体都有自己的"声音"
 * - 可解释性：每个视觉特征都有明确的语义含义
 */

import { EmotiveArt } from './emotiveArt.js';
import { SubjectivityExtractor } from './subjectivityExtractor.js';

export class IsotypeRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.emotiveArt = new EmotiveArt();
        this.subjectivityExtractor = new SubjectivityExtractor();
    }
    
    /**
     * 生成个人的isotype签名（基于subjectivity的统一框架设计）
     */
    generateIsotypeSignature(node) {
        // 提取subjectivity特征
        const subjectivity = this.subjectivityExtractor.extractSubjectivity(node);
        
        const signature = {
            // 统一框架：基础圆形（所有glyph的共同基础）
            baseShape: 'circle', // 统一使用圆形作为基础
            baseSize: this.calculateBaseSize(node),
            baseColor: node.visual_properties?.color || '#8B7FA8',
            
            // 个体特征（从subjectivity来）
            subjectivity: subjectivity,
            
            // 形状变形参数（基于narrative_style和emotional_expression）
            shapeDeformation: this.calculateShapeDeformation(subjectivity),
            
            // 内部图案参数（基于complexity和reflection_depth）
            internalPattern: this.calculateInternalPattern(subjectivity),
            
            // 边缘特征参数（基于authenticity和expression_mode）
            edgeCharacteristics: this.calculateEdgeCharacteristics(subjectivity),
            
            // 颜色调整参数（基于emotional_expression和temporal_orientation）
            colorAdjustment: this.calculateColorAdjustment(subjectivity)
        };
        
        return signature;
    }
    
    /**
     * 计算形状变形参数（基于narrative_style和emotional_expression）
     */
    calculateShapeDeformation(subjectivity) {
        const narrativeStyle = subjectivity.narrative_style;
        const emotionalExpression = subjectivity.emotional_expression;
        
        // 叙事风格影响形状的规则性
        let regularity = 0.8; // 默认较规则
        if (narrativeStyle.type === 'reflective') {
            regularity = 0.6; // 反思性：更不规则
        } else if (narrativeStyle.type === 'metaphorical') {
            regularity = 0.5; // 隐喻性：更不规则
        } else if (narrativeStyle.type === 'direct') {
            regularity = 0.9; // 直接性：更规则
        }
        
        // 情感表达影响形状的变形程度
        let deformation = 0.1; // 默认轻微变形
        if (emotionalExpression.level === 'intense') {
            deformation = 0.25; // 强烈情感：更大变形
        } else if (emotionalExpression.level === 'expressive') {
            deformation = 0.18;
        } else if (emotionalExpression.level === 'reserved') {
            deformation = 0.05; // 内敛：更少变形
        }
        
        return {
            regularity: regularity,
            deformation: deformation,
            asymmetry: emotionalExpression.intensity * 0.15 // 不对称程度
        };
    }
    
    /**
     * 计算内部图案参数（基于complexity和reflection_depth）
     */
    calculateInternalPattern(subjectivity) {
        const complexity = subjectivity.complexity;
        const reflectionDepth = subjectivity.reflection_depth;
        
        // 复杂度影响图案密度
        let density = 0.3;
        if (complexity.level === 'complex') {
            density = 0.6;
        } else if (complexity.level === 'moderate') {
            density = 0.4;
        } else {
            density = 0.2;
        }
        
        // 反思深度影响图案类型
        let patternType = 'simple';
        if (reflectionDepth > 0.7) {
            patternType = 'layered'; // 深度反思：分层图案
        } else if (reflectionDepth > 0.4) {
            patternType = 'moderate'; // 中等反思：中等图案
        } else {
            patternType = 'simple'; // 浅层反思：简单图案
        }
        
        return {
            density: density,
            patternType: patternType,
            complexity: complexity.score,
            reflectionDepth: reflectionDepth
        };
    }
    
    /**
     * 计算边缘特征参数（基于authenticity和expression_mode）
     */
    calculateEdgeCharacteristics(subjectivity) {
        const authenticity = subjectivity.authenticity;
        const expressionMode = subjectivity.expression_mode;
        
        // 真实性影响边缘的清晰度
        let edgeSharpness = 0.5;
        if (authenticity.style === 'formal') {
            edgeSharpness = 0.8; // 正式：清晰边缘
        } else if (authenticity.style === 'intimate') {
            edgeSharpness = 0.3; // 亲密：柔和边缘
        } else {
            edgeSharpness = 0.5; // 随意：中等边缘
        }
        
        // 表达方式影响边缘的规则性
        let edgeRegularity = 0.7;
        if (expressionMode.mode === 'direct') {
            edgeRegularity = 0.9; // 直接：规则边缘
        } else {
            edgeRegularity = 0.5; // 间接：不规则边缘
        }
        
        return {
            sharpness: edgeSharpness,
            regularity: edgeRegularity,
            thickness: 0.5 + authenticity.score * 0.3
        };
    }
    
    /**
     * 计算颜色调整参数（基于emotional_expression和temporal_orientation）
     * 保持颜色多样性：基本不调整颜色，只调整透明度和亮度
     */
    calculateColorAdjustment(subjectivity) {
        const emotionalExpression = subjectivity.emotional_expression;
        
        // 完全不调整饱和度和色调，保持原始颜色的多样性
        const saturation = 1.0; // 不调整
        const hueShift = 0; // 不调整
        
        // 只调整透明度，完全不调整亮度，保持颜色完全原样
        const opacity = 0.7 + emotionalExpression.intensity * 0.25; // 0.7-0.95
        const brightness = 1.0; // 完全不调整亮度，保持原始颜色
        
        return {
            saturation: saturation,
            hueShift: hueShift,
            opacity: Math.min(1, opacity),
            brightness: Math.min(1.1, brightness)
        };
    }
    
    /**
     * 计算基础大小
     */
    calculateBaseSize(node) {
        const uniqueness = node.isotype_signature?.uniqueness_score || 0.5;
        const textLength = node.metadata?.text_length || 1000;
        const normalizedLength = Math.min(1, textLength / 5000);
        
        // 基础大小：10-25像素（稍大一些，以容纳艺术元素）
        return 10 + (uniqueness * 0.5 + normalizedLength * 0.5) * 15;
    }
    
    /**
     * 渲染isotype节点（基于subjectivity的统一框架设计）
     * 设计原则：
     * 1. 统一框架：所有glyph都基于圆形基础
     * 2. 个体特征：根据subjectivity调整形状、图案、边缘、颜色
     */
    renderIsotype(node, x, y, isHighlighted = false) {
        const signature = this.generateIsotypeSignature(node);
        const baseSize = signature.baseSize;
        const displaySize = isHighlighted ? baseSize * 1.3 : baseSize;
        
        this.ctx.save();
        
        // 1. 绘制统一框架的基础形状（圆形，但根据subjectivity变形）
        const shapePoints = this.generateUnifiedShape(
            x, y, displaySize, signature
        );
        this.drawUnifiedBase(shapePoints, signature, displaySize);
        
        // 2. 绘制内部图案（基于complexity和reflection_depth）
        this.drawInternalPattern(
            x, y, displaySize, signature
        );
        
        // 3. 绘制边缘（基于authenticity和expression_mode）
        this.drawEdge(shapePoints, signature, isHighlighted);
        
        this.ctx.restore();
    }
    
    /**
     * 生成统一框架的形状（圆形基础，根据subjectivity变形）
     */
    generateUnifiedShape(x, y, radius, signature) {
        const deformation = signature.shapeDeformation;
        const numPoints = 32; // 足够的点数以支持平滑变形
        const points = [];
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            
            // 基础圆形
            let distance = radius;
            
            // 根据regularity添加规则性变化
            const regularityNoise = Math.sin(angle * 4) * (1 - deformation.regularity) * 0.1;
            
            // 根据deformation添加变形
            const deformationNoise = Math.sin(angle * 3 + Math.PI / 4) * deformation.deformation;
            
            // 根据asymmetry添加不对称
            const asymmetryNoise = Math.sin(angle * 2) * deformation.asymmetry;
            
            // 综合变形
            distance = radius * (1 + regularityNoise + deformationNoise + asymmetryNoise);
            
            points.push({
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                angle: angle
            });
        }
        
        return points;
    }
    
    /**
     * 绘制统一框架的基础形状 - 温暖、包容、尊重每个主体
     * 设计理念：让每个glyph都有"生命感"，而不是冷冰冰的数据点
     */
    drawUnifiedBase(points, signature, size) {
        if (!points || points.length < 3) return;
        
        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        
        const colorAdj = signature.colorAdjustment;
        let baseColor = signature.baseColor;
        
        // 1. 绘制温暖的光晕效果（象征每个主体的"存在感"）
        this.ctx.save();
        this.ctx.shadowBlur = size * 0.4; // 更柔和的光晕
        this.ctx.shadowColor = baseColor;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 2. 创建温暖的渐变（多层渐变，象征生命的层次）
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, size * 1.3
        );
        
        const centerOpacity = Math.min(1, colorAdj.opacity);
        const midOpacity = centerOpacity * 0.9;
        const edgeOpacity = centerOpacity * 0.5;
        
        // 中心：明亮、温暖（象征核心自我）
        gradient.addColorStop(0, this.adjustColor(baseColor, 1.2, centerOpacity));
        // 中间层：保持温暖（象征内在世界）
        gradient.addColorStop(0.25, this.adjustColor(baseColor, 1.1, midOpacity));
        gradient.addColorStop(0.5, this.adjustColor(baseColor, 1.0, midOpacity * 0.95));
        gradient.addColorStop(0.75, this.adjustColor(baseColor, 0.9, edgeOpacity));
        // 边缘：柔和过渡（象征与世界的连接）
        gradient.addColorStop(0.9, this.adjustColor(baseColor, 0.8, edgeOpacity * 0.6));
        gradient.addColorStop(1, this.adjustColor(baseColor, 0.7, edgeOpacity * 0.2));
        
        // 3. 绘制形状（使用平滑曲线，象征生命的流动）
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            const p0 = points[(i - 1 + points.length) % points.length];
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            
            // 使用平滑的曲线，创造有机感
            const cpX = p1.x;
            const cpY = p1.y;
            const endX = (p1.x + p2.x) / 2;
            const endY = (p1.y + p2.y) / 2;
            
            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }
        
        this.ctx.closePath();
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 绘制内部图案（基于complexity和reflection_depth）
     */
    drawInternalPattern(x, y, size, signature) {
        const pattern = signature.internalPattern;
        const subjectivity = signature.subjectivity;
        
        this.ctx.save();
        
        // 根据patternType绘制不同的图案
        if (pattern.patternType === 'layered') {
            // 分层图案：反映深度反思
            this.drawLayeredPattern(x, y, size, pattern, subjectivity);
        } else if (pattern.patternType === 'moderate') {
            // 中等图案：反映中等反思
            this.drawModeratePattern(x, y, size, pattern, subjectivity);
        } else {
            // 简单图案：反映浅层反思
            this.drawSimplePattern(x, y, size, pattern, subjectivity);
        }
        
        this.ctx.restore();
    }
    
    /**
     * 绘制分层图案（深度反思）- 象征内在世界的层次
     * 设计理念：深度反思的人有更丰富的内在世界，用分层图案表达
     */
    drawLayeredPattern(x, y, size, pattern, subjectivity) {
        const numLayers = 2 + Math.floor(pattern.reflectionDepth * 2);
        const density = pattern.density;
        
        // 使用温暖的同心圆和线条组合，象征内在世界的层次
        for (let layer = 0; layer < numLayers; layer++) {
            const layerRadius = size * (0.25 + layer * 0.25);
            const opacity = 0.15 + pattern.reflectionDepth * 0.25; // 更柔和
            
            // 绘制同心圆（象征思考的层次）
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
            this.ctx.lineWidth = 0.4;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.arc(x, y, layerRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 绘制径向线条（象征思考的延伸）
            const numRays = Math.floor(density * 6 + layer * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.lineWidth = 0.3;
            
            for (let i = 0; i < numRays; i++) {
                const angle = (Math.PI * 2 * i) / numRays;
                const startRadius = layerRadius * 0.65;
                const endRadius = layerRadius * 0.9;
                
                this.ctx.beginPath();
                this.ctx.moveTo(
                    x + Math.cos(angle) * startRadius,
                    y + Math.sin(angle) * startRadius
                );
                this.ctx.lineTo(
                    x + Math.cos(angle) * endRadius,
                    y + Math.sin(angle) * endRadius
                );
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * 绘制中等图案 - 象征中等程度的反思
     * 设计理念：用弧线和中心点表达平衡的思考
     */
    drawModeratePattern(x, y, size, pattern, subjectivity) {
        const numElements = Math.floor(pattern.density * 8);
        const opacity = 0.15 + pattern.complexity * 0.25; // 更柔和
        
        // 绘制温暖的弧线图案（象征思考的流动）
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.lineWidth = 0.4;
        this.ctx.lineCap = 'round';
        
        for (let i = 0; i < numElements; i++) {
            const angle = (Math.PI * 2 * i) / numElements;
            const radius = size * (0.3 + (i % 3) * 0.12);
            
            // 绘制温暖的弧线
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, angle, angle + Math.PI / 2.2);
            this.ctx.stroke();
        }
        
        // 添加中心点（象征核心自我）
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 绘制简单图案 - 象征浅层反思
     * 设计理念：用简单的点状图案表达简洁的思考
     */
    drawSimplePattern(x, y, size, pattern, subjectivity) {
        const numElements = Math.floor(pattern.density * 5);
        const opacity = 0.2 + pattern.complexity * 0.2; // 更柔和
        
        // 绘制温暖的点状图案（象征思考的种子）
        for (let i = 0; i < numElements; i++) {
            const angle = (Math.PI * 2 * i) / numElements;
            const distance = size * (0.3 + (i % 2) * 0.08);
            const pointSize = 1.2 + (i % 3) * 0.4; // 不同大小的点
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * (0.7 + (i % 2) * 0.15)})`;
            this.ctx.beginPath();
            this.ctx.arc(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                pointSize,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }
    
    /**
     * 绘制边缘（基于authenticity和expression_mode）
     * 设计理念：边缘象征与世界的边界，不同的人有不同的边界方式
     */
    drawEdge(points, signature, isHighlighted) {
        if (!points || points.length < 3) return;
        
        const edge = signature.edgeCharacteristics;
        const baseColor = signature.baseColor;
        
        if (isHighlighted) {
            // 高亮：温暖的光晕，象征被关注和尊重
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = baseColor;
            this.ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`;
            this.ctx.lineWidth = 2;
        } else {
            // 根据真实性调整边缘：正式的人边界更清晰，亲密的人边界更柔和
            const opacity = 0.2 + edge.sharpness * 0.3; // 更柔和
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.lineWidth = edge.thickness * 0.9; // 稍细，更精致
        }
        
        // 总是使用平滑的曲线，象征温和的边界
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // 绘制边缘（象征与世界的边界）
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            const p0 = points[(i - 1 + points.length) % points.length];
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            
            // 使用平滑的曲线，创造温和的边界
            const cpX = p1.x;
            const cpY = p1.y;
            const endX = (p1.x + p2.x) / 2;
            const endY = (p1.y + p2.y) / 2;
            this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        
        // 清除阴影
        if (isHighlighted) {
            this.ctx.shadowBlur = 0;
        }
    }
    
    /**
     * 调整颜色色调
     */
    adjustColorHue(color, hueShift) {
        if (hueShift === 0) return color;
        
        // 简化的色调调整（RGB空间）
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 简单的色调偏移（偏向暖色或冷色）
        let newR = r, newG = g, newB = b;
        
        if (hueShift > 0) {
            // 偏冷色：增加蓝色，减少红色
            newR = Math.max(0, Math.min(255, r - hueShift * 2));
            newB = Math.max(0, Math.min(255, b + hueShift * 2));
        } else {
            // 偏暖色：增加红色，减少蓝色
            newR = Math.max(0, Math.min(255, r - hueShift * 2));
            newB = Math.max(0, Math.min(255, b + hueShift * 2));
        }
        
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    }
    
    // 辅助方法
    adjustColor(color, brightness, opacity) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.min(255, Math.max(0, r * brightness));
        const newG = Math.min(255, Math.max(0, g * brightness));
        const newB = Math.min(255, Math.max(0, b * brightness));
        
        return `rgba(${newR}, ${newG}, ${newB}, ${opacity})`;
    }
    
    addAlpha(color, alpha) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    getDimensionColor(dimension) {
        // City Pulse 风格的高对比度配色
        const colors = {
            experience: '#FF006E', // 鲜艳粉红
            emotion: '#00F5FF',   // 霓虹青色
            topic: '#8338EC',     // 紫色
            semantic: '#3A86FF'    // 亮蓝色
        };
        return colors[dimension] || '#FF006E';
    }
    
    /**
     * 获取glyph的可解释性描述
     * 用于在实际应用中向观众解释视觉编码的含义
     */
    getGlyphInterpretation(node) {
        const signature = this.generateIsotypeSignature(node);
        const subjectivity = signature.subjectivity;
        
        const interpretations = [];
        
        // Shape feature interpretation
        const shape = signature.shapeDeformation;
        if (shape.regularity < 0.7) {
            interpretations.push({
                feature: 'Shape',
                value: 'Irregular',
                meaning: 'This person\'s narrative style tends toward reflection or metaphor; the shape reflects the complexity of this thinking'
            });
        } else {
            interpretations.push({
                feature: 'Shape',
                value: 'Regular',
                meaning: 'This person\'s narrative style is more direct; the shape reflects the clarity of this expression'
            });
        }
        
        // Internal pattern interpretation
        const pattern = signature.internalPattern;
        if (pattern.patternType === 'layered') {
            interpretations.push({
                feature: 'Internal Pattern',
                value: 'Layered Pattern',
                meaning: 'This person has deep reflection; the multi-layered internal pattern symbolizes a rich inner world'
            });
        } else if (pattern.patternType === 'moderate') {
            interpretations.push({
                feature: 'Internal Pattern',
                value: 'Moderate Pattern',
                meaning: 'This person has moderate reflection; the arc pattern symbolizes balanced thinking'
            });
        } else {
            interpretations.push({
                feature: 'Internal Pattern',
                value: 'Simple Pattern',
                meaning: 'This person\'s thinking is more concise and direct; the dot pattern symbolizes seeds of thought'
            });
        }
        
        // Edge feature interpretation
        const edge = signature.edgeCharacteristics;
        if (edge.sharpness < 0.4) {
            interpretations.push({
                feature: 'Edge',
                value: 'Soft Edge',
                meaning: 'This person\'s expression is more intimate and authentic; the soft edge symbolizes open boundaries'
            });
        } else {
            interpretations.push({
                feature: 'Edge',
                value: 'Sharp Edge',
                meaning: 'This person\'s expression is more formal; the sharp edge symbolizes clear boundaries'
            });
        }
        
        // Color interpretation
        const emotion = subjectivity.emotional_expression;
        const emotionColors = {
            joy: 'Bright Yellow',
            sadness: 'Bright Blue',
            anger: 'Red',
            fear: 'Purple',
            surprise: 'Cyan Green',
            disgust: 'Deep Orange',
            neutral: 'Deep Purple'
        };
        
        // Infer emotion from color (simplified)
        const baseColor = signature.baseColor;
        let colorMeaning = 'This person\'s color reflects their emotional and semantic characteristics';
        
        interpretations.push({
            feature: 'Color',
            value: baseColor,
            meaning: colorMeaning
        });
        
        return {
            nodeId: node.id || node.original_id,
            interpretations: interpretations,
            subjectivity: subjectivity,
            summary: `This glyph represents a person with ${subjectivity.narrative_style.type} narrative style and ${emotion.level} emotional expression`
        };
    }
    
    /**
     * 增强颜色饱和度（轻微增强，保持颜色多样性）
     */
    enhanceColorSaturation(color, factor = 1.1) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 简化的饱和度增强
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        if (delta === 0) return color;
        
        const s = delta / max;
        const newS = Math.min(1, s * factor);
        const newDelta = newS * max;
        
        const ratio = newDelta / delta;
        const newR = Math.min(255, Math.max(0, r + (r - (r + g + b) / 3) * (ratio - 1)));
        const newG = Math.min(255, Math.max(0, g + (g - (r + g + b) / 3) * (ratio - 1)));
        const newB = Math.min(255, Math.max(0, b + (b - (r + g + b) / 3) * (ratio - 1)));
        
        return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
    }
}
