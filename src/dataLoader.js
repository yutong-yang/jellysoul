/**
 * 数据加载模块
 */

export class DataLoader {
    async load() {
        // 从data目录或processed_embeddings目录加载数据
        // 尝试多个可能的路径（因为文件可能在不同的相对位置）
        const possiblePaths = [
            // 从项目根目录的data文件夹（用于部署）
            './data/sample_participants.json',
            './data/all_participants.json',
            // 从 visualization/ 目录访问（本地开发）
            '../processed_embeddings/sample_participants.json',
            '../processed_embeddings/all_participants.json',
            // 从 visualization/examples/ 目录访问
            '../../processed_embeddings/sample_participants.json',
            '../../processed_embeddings/all_participants.json',
            // 从 visualization/src/ 目录访问（如果从模块导入）
            '../../processed_embeddings/sample_participants.json',
            '../../processed_embeddings/all_participants.json'
        ];
        
        // 优先尝试完整数据，然后尝试样本数据（作为后备）
        const dataFiles = [
            ...possiblePaths.filter(p => p.includes('all_participants')),
            ...possiblePaths.filter(p => p.includes('sample_participants'))
        ];
        
        // 去重
        const uniquePaths = [...new Set(dataFiles)];
        
        let lastError = null;
        for (const dataFile of uniquePaths) {
            try {
                const response = await fetch(dataFile);
                if (response.ok) {
        const rawData = await response.json();
                    console.log(`✓ 成功加载数据: ${dataFile} (${rawData.length} 个参与者)`);
        
        // 转换为可视化需要的格式
        return this.transformData(rawData);
                }
                // 如果响应不ok（如404），静默继续尝试下一个路径
                // 注意：浏览器控制台的网络面板仍会显示404，但这是正常的
            } catch (error) {
                // 网络错误或其他错误，静默继续
                lastError = error;
                continue;
            }
        }
        
        // 如果所有路径都失败，抛出错误
        throw new Error(`无法从任何路径加载数据。尝试的路径: ${uniquePaths.join(', ')}`);
    }
    
    transformData(rawData) {
        const participants = rawData.map(item => {
            // 计算独特性分数（基于文本长度和语义向量的方差）
            const uniquenessScore = this.calculateUniquenessScore(item);
            
            return {
                id: item.participant_id.replace(/ /g, '_'),
                original_id: item.participant_id,
                isotype_signature: {
                    semantic: item.semantic_embedding,
                    emotion: this.extractEmotionVector(item.emotion_scores),
                    unified: item.unified_embedding,
                    uniqueness_score: uniquenessScore,
                    dominant_dimensions: this.getDominantDimensions(item)
                },
                cluster_assignments: this.extractClusterAssignments(item),
                visual_properties: this.generateVisualProperties(item),
                metadata: item.metadata,
                text_content: item.text_content
            };
        });
        
        return {
            participants: participants,
            clusters: this.extractClusters(participants)
        };
    }
    
    calculateUniquenessScore(item) {
        // 基于语义向量的方差计算独特性
        const vec = item.semantic_embedding || [];
        if (vec.length === 0) return 0.5;
        
        const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
        const variance = vec.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vec.length;
        const stdDev = Math.sqrt(variance);
        
        // 归一化到0-1范围
        return Math.min(1, Math.max(0, (stdDev + 0.1) / 0.3));
    }
    
    getDominantDimensions(item) {
        // 确定主导维度（简化实现）
        // 基于情感分数和语义向量的特征
        const dimensions = [];
        
        const emotionVec = this.extractEmotionVector(item.emotion_scores);
        const maxEmotion = Math.max(...emotionVec);
        if (maxEmotion > 0.3) {
            dimensions.push('emotion');
        }
        
        // 语义维度总是存在
        dimensions.push('semantic');
        
        return dimensions;
    }
    
    extractEmotionVector(emotionScores) {
        // 将情感分数转换为向量
        // 当前数据只有neutral，扩展为7维向量
        const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
        const vector = emotions.map(emotion => emotionScores[emotion] || 0);
        
        // 如果只有neutral，将其值分散到其他维度（模拟情感分布）
        if (emotionScores.neutral && Object.keys(emotionScores).length === 1) {
            const neutralValue = emotionScores.neutral;
            // 将neutral值按比例分配到其他维度
            vector[0] = neutralValue * 0.1; // joy
            vector[1] = neutralValue * 0.2; // sadness
            vector[2] = neutralValue * 0.1; // anger
            vector[3] = neutralValue * 0.1; // fear
            vector[4] = neutralValue * 0.1; // surprise
            vector[5] = neutralValue * 0.1; // disgust
            vector[6] = neutralValue * 0.3; // neutral (保留大部分)
        }
        
        return vector;
    }
    
    extractClusterAssignments(item) {
        // 从数据中提取聚类信息
        // 如果数据中没有，可以根据相似度计算
        return {
            experience_cluster: 0, // 待实现
            emotion_cluster: 0,
            multidimensional_cluster: 0
        };
    }
    
    generateVisualProperties(item) {
        // 生成视觉属性
        // 使用文本长度作为独特性代理（文本越长可能越独特）
        const textLength = item.metadata?.text_length || 1000;
        const normalizedLength = Math.min(1, textLength / 5000); // 归一化到0-1
        const size = 8 + normalizedLength * 12; // 大小基于文本长度
        
        // 颜色基于参与者ID（确保每个人都有独特颜色）
        const color = this.generateColor(item);
        
        return {
            size: size,
            color: color,
            opacity: 0.8
        };
    }
    
    generateColor(item) {
        // 基于情感和语义特征分配颜色
        // 相同情感的人会有相似的颜色，不同情感的人会有不同的颜色
        
        // 1. 首先尝试基于情感向量分配颜色
        const emotionVec = this.extractEmotionVector(item.emotion_scores);
        const dominantEmotion = this.getDominantEmotion(emotionVec);
        
        // 2. 如果情感不明显，则基于语义向量的特征分配
        if (dominantEmotion === 'neutral' || emotionVec[6] > 0.7) {
            // 使用语义向量的某些特征来分配颜色
            return this.generateColorFromSemantic(item);
        }
        
        // 3. 基于主导情感分配颜色
        return this.getEmotionColor(dominantEmotion, emotionVec);
    }
    
    /**
     * 获取主导情感
     */
    getDominantEmotion(emotionVec) {
        const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'];
        if (!emotionVec || emotionVec.length === 0) return 'neutral';
        
        let maxIndex = 0;
        let maxValue = emotionVec[0];
        for (let i = 1; i < emotionVec.length; i++) {
            if (emotionVec[i] > maxValue) {
                maxValue = emotionVec[i];
                maxIndex = i;
            }
        }
        
        return emotions[maxIndex] || 'neutral';
    }
    
    /**
     * 根据情感获取颜色
     */
    getEmotionColor(emotion, emotionVec) {
        // 情感到颜色的映射（City Pulse 风格高对比度）
        const emotionColors = {
            joy: '#FFBE0B',      // 亮黄色 - 快乐
            sadness: '#3A86FF',  // 亮蓝色 - 悲伤
            anger: '#F44336',    // 红色 - 愤怒
            fear: '#8338EC',     // 紫色 - 恐惧
            surprise: '#06FFA5', // 青绿色 - 惊讶
            disgust: '#FF6F00',  // 深橙色 - 厌恶
            neutral: '#9C27B0'   // 深紫色 - 中性
        };
        
        const baseColor = emotionColors[emotion] || '#9C27B0';
        
        // 根据情感强度调整颜色的亮度/饱和度
        const emotionIndex = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'].indexOf(emotion);
        const intensity = emotionVec[emotionIndex] || 0.5;
        
        // 轻微调整颜色以反映强度（但保持颜色本质不变）
        return this.adjustColorIntensity(baseColor, intensity);
    }
    
    /**
     * 基于语义向量生成颜色
     */
    generateColorFromSemantic(item) {
        const semantic = item.semantic_embedding || [];
        if (semantic.length === 0) return '#9C27B0';
        
        // 使用语义向量的前几个维度来生成颜色
        // 提取前10个维度的值
        const features = semantic.slice(0, 10);
        
        // 计算特征的总和和方差
        const sum = features.reduce((a, b) => a + Math.abs(b), 0);
        const mean = sum / features.length;
        const variance = features.reduce((s, v) => s + Math.pow(Math.abs(v) - mean, 2), 0) / features.length;
        
        // 基于这些特征选择颜色
        // 使用多个颜色，根据特征值分布选择
        const colorPalette = [
            '#FF006E', // 粉红
            '#FFBE0B', // 黄色
            '#FB5607', // 橙红
            '#8338EC', // 紫色
            '#06FFA5', // 青绿
            '#FF9F1C', // 橙色
            '#C77DFF', // 淡紫
            '#FF1744', // 深粉红
            '#00E676', // 绿色
            '#E91E63', // 玫红
            '#4CAF50', // 绿色
            '#F44336', // 红色
            '#FF4081', // 粉红
            '#673AB7', // 深紫
            '#009688', // 青绿
            '#FF5722', // 深橙红
            '#FFC107', // 琥珀
            '#3A86FF', // 蓝色
            '#00F5FF', // 青色
            '#2196F3'  // 标准蓝
        ];
        
        // 使用特征值的组合来选择颜色索引
        const index1 = Math.floor((mean * 1000) % colorPalette.length);
        const index2 = Math.floor((variance * 10000) % colorPalette.length);
        const finalIndex = (index1 + index2) % colorPalette.length;
        
        return colorPalette[finalIndex];
    }
    
    /**
     * 根据强度调整颜色（轻微调整，保持颜色本质）
     */
    adjustColorIntensity(color, intensity) {
        // 只轻微调整亮度，不改变色相
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 根据强度轻微调整（0.9-1.1倍）
        const brightness = 0.9 + intensity * 0.2;
        
        const newR = Math.min(255, Math.max(0, Math.floor(r * brightness)));
        const newG = Math.min(255, Math.max(0, Math.floor(g * brightness)));
        const newB = Math.min(255, Math.max(0, Math.floor(b * brightness)));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    extractClusters(participants) {
        // 提取聚类信息
        // 这里需要实现聚类算法或从数据中读取
        return {
            experience: [],
            emotion: [],
            multidimensional: []
        };
    }
}

