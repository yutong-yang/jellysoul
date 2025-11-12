/**
 * Emotive Generative Art
 * 情感化的生成艺术 - 每个glyph都是一个人，一个有故事的人
 * 让形状真正反映文本的情感、节奏、温度
 */

export class EmotiveArt {
    constructor() {
        // 预计算的噪声表（用于有机形状）
        this.noiseTable = this.generateNoiseTable(512);
    }
    
    /**
     * 生成噪声表（用于有机、有生命力的形状）
     */
    generateNoiseTable(size) {
        const table = [];
        for (let i = 0; i < size; i++) {
            // 使用更平滑的噪声，创造有机感
            const value = Math.sin(i * 0.1) * 0.4 + 
                        Math.sin(i * 0.3) * 0.3 + 
                        Math.sin(i * 0.7) * 0.2 + 
                        Math.random() * 0.1;
            table.push(value);
        }
        return table;
    }
    
    /**
     * 平滑噪声（多倍频，创造有机感）
     */
    smoothNoise(x, y, seed = 0, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            const nx = Math.floor((x * frequency + seed) * 100) % this.noiseTable.length;
            const ny = Math.floor((y * frequency + seed * 2) * 100) % this.noiseTable.length;
            const n = (this.noiseTable[Math.abs(nx)] + this.noiseTable[Math.abs(ny)]) / 2;
            value += n * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 1.8;
        }
        
        return value / maxValue;
    }
    
    /**
     * 从节点生成种子（基于个人特征）
     */
    generateSeed(node) {
        const id = node.original_id || node.id || '';
        const idNum = parseInt(id.match(/\d+/)?.[0] || '0');
        const semantic = node.isotype_signature?.semantic || [];
        const emotion = node.isotype_signature?.emotion || [];
        const text = node.text_content || '';
        
        // 结合多个特征生成唯一种子
        const semanticSum = semantic.slice(0, 10).reduce((a, b) => a + Math.abs(b), 0);
        const emotionSum = emotion.reduce((a, b) => a + Math.abs(b), 0);
        const textHash = text.length + (text.split(' ').length % 100);
        
        return idNum * 10000 + Math.floor(semanticSum * 1000) + Math.floor(emotionSum * 500) + textHash;
    }
    
    /**
     * 提取文本的情感特征（更深入的分析）
     */
    extractEmotionalFeatures(node) {
        const text = node.text_content || '';
        const emotion = node.isotype_signature?.emotion || [];
        const semantic = node.isotype_signature?.semantic || [];
        
        // 分析文本节奏（句子长度变化）
        const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
        const sentenceLengths = sentences.map(s => s.length);
        const avgLength = sentenceLengths.length > 0 
            ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length 
            : 100;
        const rhythmVariation = sentenceLengths.length > 1
            ? sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length / (avgLength * avgLength)
            : 0;
        
        // 情感强度
        const maxEmotion = emotion.length > 0 ? Math.max(...emotion) : 0.5;
        const emotionVariance = emotion.length > 0
            ? emotion.reduce((sum, e) => sum + Math.pow(e - maxEmotion, 2), 0) / emotion.length
            : 0;
        
        // 文本密度（段落结构）
        const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
        const density = paragraphs.length > 0 
            ? paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length / 500
            : text.length / 500;
        
        // 语义复杂度
        const complexity = semantic.length > 0
            ? semantic.slice(0, 20).reduce((sum, s) => sum + Math.abs(s), 0) / 20
            : 0.5;
        
        // 主要情感类型
        const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
        const emotionIndex = emotion.length > 0 
            ? emotion.indexOf(maxEmotion)
            : 6;
        const dominantEmotion = emotions[emotionIndex] || 'neutral';
        
        return {
            rhythm: Math.min(1, rhythmVariation), // 节奏变化
            emotionalIntensity: maxEmotion, // 情感强度
            emotionVariance: Math.min(1, emotionVariance * 10), // 情感变化
            density: Math.min(1, density), // 文本密度
            complexity: Math.min(1, complexity), // 语义复杂度
            dominantEmotion: dominantEmotion, // 主导情感
            textLength: text.length,
            sentenceCount: sentences.length
        };
    }
    
    /**
     * 生成有机的、有情感的形状（反映个人特征）
     */
    generateOrganicShape(ctx, x, y, radius, node) {
        const features = this.extractEmotionalFeatures(node);
        const seed = this.generateSeed(node);
        
        // 根据情感强度决定形状的"柔软度"
        const softness = 0.15 + features.emotionalIntensity * 0.15; // 15-30%的变化
        // 根据节奏决定形状的"不规则度"
        const irregularity = 0.08 + features.rhythm * 0.12; // 8-20%的不规则
        // 根据复杂度决定点数
        const numPoints = 24 + Math.floor(features.complexity * 16); // 24-40个点
        
        const points = [];
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            
            // 使用多层噪声创造有机感
            const noise1 = this.smoothNoise(
                Math.cos(angle) * 2,
                Math.sin(angle) * 2,
                seed,
                4
            );
            const noise2 = this.smoothNoise(
                Math.cos(angle) * 4,
                Math.sin(angle) * 4,
                seed + 1000,
                3
            );
            const noise3 = this.smoothNoise(
                Math.cos(angle) * 8,
                Math.sin(angle) * 8,
                seed + 2000,
                2
            );
            
            // 混合噪声，创造有机的变形
            const combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
            
            // 根据情感类型调整形状
            let emotionModifier = 1.0;
            if (features.dominantEmotion === 'joy') {
                // 快乐：更圆润、向外扩展
                emotionModifier = 1.0 + Math.sin(angle * 2) * 0.05;
            } else if (features.dominantEmotion === 'sadness') {
                // 悲伤：更内敛、轻微收缩
                emotionModifier = 0.95 + Math.sin(angle * 3) * 0.03;
            } else if (features.dominantEmotion === 'anger') {
                // 愤怒：更尖锐、不规则
                emotionModifier = 1.0 + Math.abs(combinedNoise) * 0.1;
            } else if (features.dominantEmotion === 'fear') {
                // 恐惧：更收缩、更不规则
                emotionModifier = 0.92 + combinedNoise * 0.08;
            } else {
                // 中性或其他：平衡
                emotionModifier = 0.98 + combinedNoise * 0.04;
            }
            
            // 根据节奏添加变化
            const rhythmModifier = 1.0 + Math.sin(angle * features.rhythm * 4) * (features.rhythm * 0.03);
            
            // 计算最终距离
            const baseDistance = radius * (0.92 + combinedNoise * softness);
            const distance = baseDistance * emotionModifier * rhythmModifier;
            
            points.push({
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                angle: angle
            });
        }
        
        return points;
    }
    
    /**
     * 生成内部纹理（反映文本的情感纹理）
     */
    generateEmotionalTexture(ctx, x, y, size, node) {
        const features = this.extractEmotionalFeatures(node);
        const seed = this.generateSeed(node);
        
        ctx.save();
        
        // 根据情感强度决定纹理密度
        const density = 0.3 + features.emotionalIntensity * 0.4;
        const numElements = Math.floor(density * 20); // 6-14个元素
        
        // 根据情感类型选择纹理风格
        if (features.dominantEmotion === 'joy') {
            // 快乐：明亮的点、流动的线条
            this.drawJoyfulTexture(ctx, x, y, size, seed, numElements, features);
        } else if (features.dominantEmotion === 'sadness') {
            // 悲伤：柔和的渐变、内敛的图案
            this.drawMelancholicTexture(ctx, x, y, size, seed, numElements, features);
        } else if (features.dominantEmotion === 'anger') {
            // 愤怒：尖锐的线条、强烈的对比
            this.drawIntenseTexture(ctx, x, y, size, seed, numElements, features);
        } else if (features.dominantEmotion === 'fear') {
            // 恐惧：破碎的图案、不规则的形状
            this.drawFragmentedTexture(ctx, x, y, size, seed, numElements, features);
        } else {
            // 中性：平衡的图案
            this.drawBalancedTexture(ctx, x, y, size, seed, numElements, features);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制快乐的纹理（明亮、流动）
     */
    drawJoyfulTexture(ctx, x, y, size, seed, numElements, features) {
        ctx.strokeStyle = `rgba(26, 26, 26, ${0.15 + features.emotionalIntensity * 0.15})`;
        ctx.lineWidth = 0.6;
        ctx.lineCap = 'round';
        
        // 流动的曲线
        for (let i = 0; i < numElements; i++) {
            const angle = (Math.PI * 2 * i) / numElements;
            const radius1 = size * (0.2 + (i % 3) * 0.15);
            const radius2 = size * (0.4 + (i % 3) * 0.2);
            
            ctx.beginPath();
            ctx.arc(x, y, radius1, angle, angle + Math.PI / 3);
            ctx.stroke();
        }
        
        // 明亮的点
        ctx.fillStyle = `rgba(26, 26, 26, ${0.2 + features.emotionalIntensity * 0.2})`;
        for (let i = 0; i < Math.floor(numElements / 2); i++) {
            const angle = (Math.PI * 2 * i) / (numElements / 2);
            const distance = size * (0.3 + (i % 2) * 0.2);
            ctx.beginPath();
            ctx.arc(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                1.5,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    /**
     * 绘制悲伤的纹理（柔和、内敛）
     */
    drawMelancholicTexture(ctx, x, y, size, seed, numElements, features) {
        ctx.strokeStyle = `rgba(26, 26, 26, ${0.1 + features.emotionalIntensity * 0.1})`;
        ctx.lineWidth = 0.4;
        ctx.lineCap = 'round';
        
        // 柔和的同心圆
        for (let i = 0; i < Math.floor(numElements / 2); i++) {
            const radius = size * (0.25 + i * 0.15);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 内敛的点
        ctx.fillStyle = `rgba(26, 26, 26, ${0.15 + features.emotionalIntensity * 0.1})`;
        for (let i = 0; i < Math.floor(numElements / 3); i++) {
            const angle = (Math.PI * 2 * i) / (numElements / 3);
            const distance = size * 0.35;
            ctx.beginPath();
            ctx.arc(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                1,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    /**
     * 绘制强烈的纹理（尖锐、对比）
     */
    drawIntenseTexture(ctx, x, y, size, seed, numElements, features) {
        ctx.strokeStyle = `rgba(26, 26, 26, ${0.2 + features.emotionalIntensity * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'butt';
        
        // 尖锐的线条
        for (let i = 0; i < numElements; i++) {
            const angle = (Math.PI * 2 * i) / numElements;
            const length = size * (0.3 + features.emotionalIntensity * 0.3);
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * length,
                y + Math.sin(angle) * length
            );
            ctx.stroke();
        }
    }
    
    /**
     * 绘制破碎的纹理（不规则、碎片化）
     */
    drawFragmentedTexture(ctx, x, y, size, seed, numElements, features) {
        ctx.strokeStyle = `rgba(26, 26, 26, ${0.12 + features.emotionalIntensity * 0.12})`;
        ctx.lineWidth = 0.5;
        ctx.lineCap = 'butt';
        
        // 不规则的短线段
        for (let i = 0; i < numElements * 2; i++) {
            const angle = (Math.PI * 2 * i) / (numElements * 2);
            const distance = size * (0.2 + (i % 3) * 0.15);
            const length = size * (0.1 + (i % 2) * 0.1);
            
            ctx.beginPath();
            ctx.moveTo(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance
            );
            ctx.lineTo(
                x + Math.cos(angle + 0.3) * (distance + length),
                y + Math.sin(angle + 0.3) * (distance + length)
            );
            ctx.stroke();
        }
    }
    
    /**
     * 绘制平衡的纹理（中性、和谐）
     */
    drawBalancedTexture(ctx, x, y, size, seed, numElements, features) {
        ctx.strokeStyle = `rgba(26, 26, 26, ${0.12 + features.complexity * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.lineCap = 'round';
        
        // 平衡的网格
        const gridSize = size * 0.25;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                ctx.beginPath();
                ctx.moveTo(x + i * gridSize, y + j * gridSize - gridSize * 0.3);
                ctx.lineTo(x + i * gridSize, y + j * gridSize + gridSize * 0.3);
                ctx.moveTo(x + i * gridSize - gridSize * 0.3, y + j * gridSize);
                ctx.lineTo(x + i * gridSize + gridSize * 0.3, y + j * gridSize);
                ctx.stroke();
            }
        }
    }
}

