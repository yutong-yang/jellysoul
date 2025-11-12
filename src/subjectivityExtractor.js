/**
 * Subjectivity提取模块
 * 从文本中提取个人主观性特征，用于生成独特的glyph
 */

export class SubjectivityExtractor {
    constructor() {
        // 定义subjectivity维度
        this.dimensions = {
            narrative_style: ['direct', 'reflective', 'metaphorical', 'conversational'],
            emotional_expression: ['reserved', 'moderate', 'expressive', 'intense'],
            temporal_orientation: ['past_focused', 'present_focused', 'future_focused', 'mixed'],
            self_reference: ['low', 'medium', 'high'],
            complexity: ['simple', 'moderate', 'complex'],
            authenticity: ['formal', 'casual', 'intimate']
        };
    }
    
    /**
     * 从节点提取完整的subjectivity特征
     */
    extractSubjectivity(node) {
        const text = node.text_content || '';
        const semantic = node.isotype_signature?.semantic || [];
        const emotion = node.isotype_signature?.emotion || [];
        
        return {
            // 叙事风格
            narrative_style: this.analyzeNarrativeStyle(text),
            
            // 情感表达强度
            emotional_expression: this.analyzeEmotionalExpression(text, emotion),
            
            // 时间导向
            temporal_orientation: this.analyzeTemporalOrientation(text),
            
            // 自我指涉程度
            self_reference: this.analyzeSelfReference(text),
            
            // 文本复杂度
            complexity: this.analyzeComplexity(text, semantic),
            
            // 真实性/亲密程度
            authenticity: this.analyzeAuthenticity(text),
            
            // 文本节奏
            rhythm: this.analyzeRhythm(text),
            
            // 反思深度
            reflection_depth: this.analyzeReflectionDepth(text),
            
            // 表达方式（直接/间接）
            expression_mode: this.analyzeExpressionMode(text),
            
            // 个人独特性指标
            uniqueness: this.calculateUniqueness(text, semantic, emotion)
        };
    }
    
    /**
     * 分析叙事风格
     */
    analyzeNarrativeStyle(text) {
        if (!text) return { type: 'conversational', score: 0.5 };
        
        const lowerText = text.toLowerCase();
        
        // 直接叙述指标
        const directIndicators = ['i said', 'i did', 'i went', 'i was', 'i am'];
        const directCount = directIndicators.reduce((sum, indicator) => {
            return sum + (lowerText.match(new RegExp(indicator, 'g')) || []).length;
        }, 0);
        
        // 反思性指标
        const reflectiveIndicators = ['i think', 'i feel', 'i believe', 'i realize', 'i understand', 'reflection', 'looking back'];
        const reflectiveCount = reflectiveIndicators.reduce((sum, indicator) => {
            return sum + (lowerText.match(new RegExp(indicator, 'g')) || []).length;
        }, 0);
        
        // 隐喻性指标
        const metaphoricalIndicators = ['like', 'as if', 'as though', 'metaphor', 'symbol'];
        const metaphoricalCount = metaphoricalIndicators.reduce((sum, indicator) => {
            return sum + (lowerText.match(new RegExp(indicator, 'g')) || []).length;
        }, 0);
        
        // 对话性指标
        const conversationalIndicators = ['you know', 'i mean', 'like i said', 'you know what', 'sayin'];
        const conversationalCount = conversationalIndicators.reduce((sum, indicator) => {
            return sum + (lowerText.match(new RegExp(indicator, 'g')) || []).length;
        }, 0);
        
        const total = directCount + reflectiveCount + metaphoricalCount + conversationalCount;
        
        if (total === 0) {
            return { type: 'conversational', score: 0.5 };
        }
        
        const scores = {
            direct: directCount / total,
            reflective: reflectiveCount / total,
            metaphorical: metaphoricalCount / total,
            conversational: conversationalCount / total
        };
        
        // 找到主导风格
        const maxScore = Math.max(...Object.values(scores));
        const dominantType = Object.keys(scores).find(key => scores[key] === maxScore);
        
        return {
            type: dominantType,
            score: maxScore,
            distribution: scores
        };
    }
    
    /**
     * 分析情感表达强度
     */
    analyzeEmotionalExpression(text, emotion) {
        if (!text) return { level: 'moderate', intensity: 0.5 };
        
        const lowerText = text.toLowerCase();
        
        // 情感词汇强度
        const intenseEmotions = ['love', 'hate', 'terrible', 'amazing', 'devastated', 'ecstatic', 'horrible', 'wonderful'];
        const moderateEmotions = ['happy', 'sad', 'angry', 'worried', 'excited', 'disappointed'];
        const reservedEmotions = ['okay', 'fine', 'alright', 'good', 'bad'];
        
        const intenseCount = intenseEmotions.reduce((sum, word) => {
            return sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);
        
        const moderateCount = moderateEmotions.reduce((sum, word) => {
            return sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);
        
        const reservedCount = reservedEmotions.reduce((sum, word) => {
            return sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);
        
        // 情感向量强度
        const emotionIntensity = emotion.length > 0 ? Math.max(...emotion) : 0.5;
        
        // 感叹号、重复字母等表达强度
        const exclamationCount = (text.match(/!/g) || []).length;
        const repetitionPattern = (text.match(/(.)\1{2,}/g) || []).length;
        
        const totalIndicators = intenseCount * 3 + moderateCount * 2 + reservedCount + 
                               exclamationCount * 0.5 + repetitionPattern * 0.3;
        const normalizedIntensity = Math.min(1, totalIndicators / 20 + emotionIntensity * 0.5);
        
        let level;
        if (normalizedIntensity < 0.3) {
            level = 'reserved';
        } else if (normalizedIntensity < 0.6) {
            level = 'moderate';
        } else if (normalizedIntensity < 0.8) {
            level = 'expressive';
        } else {
            level = 'intense';
        }
        
        return {
            level: level,
            intensity: normalizedIntensity
        };
    }
    
    /**
     * 分析时间导向
     */
    analyzeTemporalOrientation(text) {
        if (!text) return { orientation: 'mixed', score: 0.33 };
        
        const lowerText = text.toLowerCase();
        
        // 过去时态
        const pastIndicators = ['was', 'were', 'had', 'went', 'did', 'said', 'thought', 'felt', 'used to', 'before', 'ago', 'back then'];
        const pastCount = pastIndicators.reduce((sum, indicator) => {
            return sum + (lowerText.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
        }, 0);
        
        // 现在时态
        const presentIndicators = ['am', 'is', 'are', 'do', 'have', 'now', 'currently', 'today', 'right now'];
        const presentCount = presentIndicators.reduce((sum, indicator) => {
            return sum + (lowerText.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
        }, 0);
        
        // 未来时态
        const futureIndicators = ['will', 'going to', 'gonna', 'future', 'later', 'soon', 'hope', 'plan', 'want to'];
        const futureCount = futureIndicators.reduce((sum, indicator) => {
            return sum + (lowerText.match(new RegExp(`\\b${indicator}\\b`, 'g')) || []).length;
        }, 0);
        
        const total = pastCount + presentCount + futureCount;
        
        if (total === 0) {
            return { orientation: 'mixed', score: 0.33 };
        }
        
        const scores = {
            past: pastCount / total,
            present: presentCount / total,
            future: futureCount / total
        };
        
        const maxScore = Math.max(...Object.values(scores));
        const dominantOrientation = Object.keys(scores).find(key => scores[key] === maxScore);
        
        return {
            orientation: dominantOrientation === 'past' ? 'past_focused' : 
                        dominantOrientation === 'present' ? 'present_focused' : 
                        dominantOrientation === 'future' ? 'future_focused' : 'mixed',
            score: maxScore,
            distribution: scores
        };
    }
    
    /**
     * 分析自我指涉程度
     */
    analyzeSelfReference(text) {
        if (!text) return { level: 'medium', score: 0.5 };
        
        const lowerText = text.toLowerCase();
        
        // 第一人称代词
        const firstPerson = ['i ', 'i\'', 'me ', 'my ', 'myself', 'mine'];
        const firstPersonCount = firstPerson.reduce((sum, pronoun) => {
            return sum + (lowerText.match(new RegExp(pronoun, 'g')) || []).length;
        }, 0);
        
        // 文本长度归一化
        const wordCount = text.split(/\s+/).length;
        const normalizedScore = Math.min(1, firstPersonCount / (wordCount / 10));
        
        let level;
        if (normalizedScore < 0.3) {
            level = 'low';
        } else if (normalizedScore < 0.6) {
            level = 'medium';
        } else {
            level = 'high';
        }
        
        return {
            level: level,
            score: normalizedScore
        };
    }
    
    /**
     * 分析文本复杂度
     */
    analyzeComplexity(text, semantic) {
        if (!text) return { level: 'moderate', score: 0.5 };
        
        // 句子长度变化
        const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
        const avgSentenceLength = sentences.length > 0 
            ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length 
            : 50;
        const sentenceVariance = sentences.length > 1
            ? sentences.reduce((sum, s) => sum + Math.pow(s.length - avgSentenceLength, 2), 0) / sentences.length
            : 0;
        
        // 词汇多样性（简单估算）
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const uniqueWords = new Set(words);
        const diversity = uniqueWords.size / Math.max(1, words.length);
        
        // 语义向量复杂度
        const semanticComplexity = semantic.length > 0
            ? semantic.slice(0, 20).reduce((sum, val) => sum + Math.abs(val), 0) / 20
            : 0.5;
        
        // 综合复杂度
        const complexityScore = (
            Math.min(1, avgSentenceLength / 100) * 0.3 +
            Math.min(1, sentenceVariance / 1000) * 0.2 +
            diversity * 0.3 +
            semanticComplexity * 0.2
        );
        
        let level;
        if (complexityScore < 0.4) {
            level = 'simple';
        } else if (complexityScore < 0.7) {
            level = 'moderate';
        } else {
            level = 'complex';
        }
        
        return {
            level: level,
            score: complexityScore
        };
    }
    
    /**
     * 分析真实性/亲密程度
     */
    analyzeAuthenticity(text) {
        if (!text) return { style: 'casual', score: 0.5 };
        
        const lowerText = text.toLowerCase();
        
        // 正式语言指标
        const formalIndicators = ['therefore', 'however', 'furthermore', 'moreover', 'consequently', 'nevertheless'];
        const formalCount = formalIndicators.reduce((sum, word) => {
            return sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);
        
        // 非正式/口语化指标
        const casualIndicators = ['gonna', 'wanna', 'gotta', 'yeah', 'yep', 'nah', 'ain\'t', 'don\'t', 'can\'t'];
        const casualCount = casualIndicators.reduce((sum, word) => {
            return sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);
        
        // 亲密/个人化指标
        const intimateIndicators = ['i feel', 'i think', 'for me', 'personally', 'my heart', 'my soul', 'deeply'];
        const intimateCount = intimateIndicators.reduce((sum, phrase) => {
            return sum + (lowerText.match(new RegExp(phrase, 'g')) || []).length;
        }, 0);
        
        const total = formalCount + casualCount + intimateCount;
        
        if (total === 0) {
            return { style: 'casual', score: 0.5 };
        }
        
        const scores = {
            formal: formalCount / total,
            casual: casualCount / total,
            intimate: intimateCount / total
        };
        
        const maxScore = Math.max(...Object.values(scores));
        const dominantStyle = Object.keys(scores).find(key => scores[key] === maxScore);
        
        return {
            style: dominantStyle,
            score: maxScore,
            distribution: scores
        };
    }
    
    /**
     * 分析文本节奏
     */
    analyzeRhythm(text) {
        if (!text) return 0.5;
        
        const sentences = text.split(/[.!?。！？]/).filter(s => s.trim().length > 0);
        if (sentences.length < 2) return 0.5;
        
        const sentenceLengths = sentences.map(s => s.length);
        const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
        const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
        
        // 归一化节奏变化（0-1）
        return Math.min(1, variance / (avgLength * avgLength));
    }
    
    /**
     * 分析反思深度
     */
    analyzeReflectionDepth(text) {
        if (!text) return 0.5;
        
        const lowerText = text.toLowerCase();
        
        // 反思性词汇
        const reflectionIndicators = [
            'reflect', 'think about', 'realize', 'understand', 'learn', 
            'realized', 'understood', 'learned', 'came to understand',
            'looking back', 'in retrospect', 'now i see', 'i see now'
        ];
        
        const reflectionCount = reflectionIndicators.reduce((sum, phrase) => {
            return sum + (lowerText.match(new RegExp(phrase, 'g')) || []).length;
        }, 0);
        
        // 问题性思考
        const questionCount = (text.match(/\?/g) || []).length;
        
        // 条件性思考
        const conditionalCount = (lowerText.match(/\b(if|whether|what if|suppose)\b/g) || []).length;
        
        const wordCount = text.split(/\s+/).length;
        const depthScore = Math.min(1, (reflectionCount * 2 + questionCount * 0.5 + conditionalCount) / (wordCount / 50));
        
        return depthScore;
    }
    
    /**
     * 分析表达方式（直接/间接）
     */
    analyzeExpressionMode(text) {
        if (!text) return { mode: 'direct', score: 0.5 };
        
        const lowerText = text.toLowerCase();
        
        // 直接表达
        const directIndicators = ['i said', 'i told', 'i think', 'i believe', 'i feel', 'i know'];
        const directCount = directIndicators.reduce((sum, phrase) => {
            return sum + (lowerText.match(new RegExp(phrase, 'g')) || []).length;
        }, 0);
        
        // 间接表达（隐喻、暗示）
        const indirectIndicators = ['like', 'as if', 'seems', 'appears', 'maybe', 'perhaps', 'might', 'could'];
        const indirectCount = indirectIndicators.reduce((sum, word) => {
            return sum + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }, 0);
        
        const total = directCount + indirectCount;
        if (total === 0) {
            return { mode: 'direct', score: 0.5 };
        }
        
        const directScore = directCount / total;
        
        return {
            mode: directScore > 0.6 ? 'direct' : 'indirect',
            score: directScore
        };
    }
    
    /**
     * 计算个人独特性
     */
    calculateUniqueness(text, semantic, emotion) {
        // 结合多个维度计算独特性
        const textLength = text.length;
        const semanticVariance = semantic.length > 0
            ? this.calculateVariance(semantic)
            : 0.5;
        
        const emotionVariance = emotion.length > 0
            ? this.calculateVariance(emotion)
            : 0.5;
        
        // 文本独特性（基于词汇多样性）
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const uniqueWords = new Set(words);
        const lexicalDiversity = uniqueWords.size / Math.max(1, words.length);
        
        // 综合独特性
        const uniqueness = (
            semanticVariance * 0.4 +
            emotionVariance * 0.3 +
            lexicalDiversity * 0.3
        );
        
        return Math.min(1, Math.max(0, uniqueness));
    }
    
    /**
     * 计算向量方差
     */
    calculateVariance(vector) {
        if (vector.length === 0) return 0.5;
        
        const mean = vector.reduce((a, b) => a + b, 0) / vector.length;
        const variance = vector.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vector.length;
        const stdDev = Math.sqrt(variance);
        
        // 归一化
        return Math.min(1, stdDev / 0.3);
    }
}

