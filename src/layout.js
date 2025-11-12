/**
 * 布局管理模块
 * 实现不同的布局算法
 */

export class LayoutManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    
    applyLayout(nodes, links, layoutType, dimension) {
        switch (layoutType) {
            case 'force':
                // 力导向布局已经在main.js的simulation中处理
                break;
            case 'cluster':
                this.clusterLayout(nodes, dimension);
                break;
            case 'hierarchical':
                this.hierarchicalLayout(nodes, dimension);
                break;
            default:
                this.randomLayout(nodes);
        }
    }
    
    clusterLayout(nodes, dimension) {
        // 按聚类分组，每个聚类一个圆形区域
        const clusters = this.groupByCluster(nodes, dimension);
        const clusterCount = Object.keys(clusters).length;
        const angleStep = (Math.PI * 2) / clusterCount;
        const centerRadius = Math.min(this.width, this.height) * 0.3;
        
        let clusterIndex = 0;
        Object.values(clusters).forEach((clusterNodes, index) => {
            const angle = angleStep * index;
            const centerX = this.width / 2 + Math.cos(angle) * centerRadius;
            const centerY = this.height / 2 + Math.sin(angle) * centerRadius;
            
            // 在圆形区域内分布节点
            const nodeRadius = Math.min(this.width, this.height) * 0.15;
            clusterNodes.forEach((node, i) => {
                const nodeAngle = (Math.PI * 2 * i) / clusterNodes.length;
                node.x = centerX + Math.cos(nodeAngle) * nodeRadius;
                node.y = centerY + Math.sin(nodeAngle) * nodeRadius;
            });
        });
    }
    
    hierarchicalLayout(nodes, dimension) {
        // 层次布局：按维度分层
        const levels = this.groupByLevel(nodes, dimension);
        const levelHeight = this.height / (levels.length + 1);
        
        levels.forEach((levelNodes, levelIndex) => {
            const y = levelHeight * (levelIndex + 1);
            const nodeSpacing = this.width / (levelNodes.length + 1);
            
            levelNodes.forEach((node, index) => {
                node.x = nodeSpacing * (index + 1);
                node.y = y;
            });
        });
    }
    
    randomLayout(nodes) {
        // 随机布局
        nodes.forEach(node => {
            node.x = Math.random() * this.width;
            node.y = Math.random() * this.height;
        });
    }
    
    groupByCluster(nodes, dimension) {
        // 按聚类分组
        const clusters = {};
        
        nodes.forEach(node => {
            const clusterId = node.cluster_assignments?.[`${dimension}_cluster`] || 0;
            if (!clusters[clusterId]) {
                clusters[clusterId] = [];
            }
            clusters[clusterId].push(node);
        });
        
        return clusters;
    }
    
    groupByLevel(nodes, dimension) {
        // 按层次分组（简化实现）
        // 可以根据独特性分数或其他指标分层
        const sorted = [...nodes].sort((a, b) => {
            const scoreA = a.isotype_signature?.uniqueness_score || 0;
            const scoreB = b.isotype_signature?.uniqueness_score || 0;
            return scoreB - scoreA;
        });
        
        const levels = [];
        const levelCount = 3; // 3层
        const levelSize = Math.ceil(sorted.length / levelCount);
        
        for (let i = 0; i < sorted.length; i += levelSize) {
            levels.push(sorted.slice(i, i + levelSize));
        }
        
        return levels;
    }
}

