/**
 * 样式配置模块
 * 定义颜色方案、视觉风格等
 */

export class StyleConfig {
    constructor() {
        // 维度颜色方案（优雅的艺术配色）
        this.dimensionColors = {
            experience: ['#D4A5A5', '#E8B8B8', '#C89A8B', '#E8C5A0', '#D4A574'],
            emotion: ['#E8C5A0', '#A8B8C8', '#C89A8B', '#B8A8C8', '#D4C5A0'],
            topic: ['#B8A8C8', '#A8C8B8', '#C9A9A6', '#D4A574', '#A8B8C8'],
            semantic: ['#8B7FA8', '#C9A9A6', '#A8B8C8', '#D4A574', '#B8A8C8']
        };
        
        // 基础颜色调色板（优雅的、柔和的色彩）
        this.colorPalette = [
            '#D4A5A5', '#E8B8B8', '#A8C5B8', '#B8A8C8', '#C89A8B',
            '#E8C5A0', '#B8D4C8', '#C8B8D8', '#D4A574', '#A8C8B8',
            '#F5C9C9', '#A8B8C8', '#D4C4E8', '#E8D4C4', '#B8C8A8',
            '#C9A9A6', '#A8D8B8', '#D4C5A0', '#E8C5A0', '#B8D8A8'
        ];
    }
    
    getColorForDimension(dimension, index = 0) {
        const colors = this.dimensionColors[dimension] || this.colorPalette;
        return colors[index % colors.length];
    }
    
    generateGradient(color1, color2, steps = 10) {
        // 生成渐变色数组
        const gradient = [];
        const hex1 = this.hexToRgb(color1);
        const hex2 = this.hexToRgb(color2);
        
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            const r = Math.round(hex1.r + (hex2.r - hex1.r) * ratio);
            const g = Math.round(hex1.g + (hex2.g - hex1.g) * ratio);
            const b = Math.round(hex1.b + (hex2.b - hex1.b) * ratio);
            gradient.push(`rgb(${r}, ${g}, ${b})`);
        }
        
        return gradient;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }
}

