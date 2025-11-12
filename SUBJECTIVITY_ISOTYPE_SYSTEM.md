# Subjectivity Isotype 设计系统
## 用主观性编码人：温暖、多元、尊重每个主体

> "我们不是在研究数据，而是在倾听生命。"

---

## 设计理念

### 核心原则
1. **统一编码，个人表达**：所有人使用相同的视觉框架，但每个人有独特的视觉特征
2. **尊重与关怀**：每一个节点都代表一个真实的人，需要被尊重和理解
3. **温暖多元**：避免冷冰冰的数据点，让每个主体都有自己的"声音"
4. **可解释性**：每个视觉特征都有明确的语义含义，可以解释给观众

### 设计哲学
- **不是分析，是理解**
- **不是分类，是连接**
- **不是统计，是叙事**

---

## 视觉编码系统

### 统一框架（共性）

所有glyph都基于**圆形基础**，象征：
- **完整**：每个人都是完整的个体
- **包容**：没有棱角，温和包容
- **统一**：在共同的框架中生活

### 个体特征（从subjectivity来）

每个glyph的独特性来自文本中提取的**主观性特征**：

#### 1. 形状特征
- **规则性**：基于叙事风格
  - 直接叙事 → 更规则（0.9）
  - 反思叙事 → 更不规则（0.6）
  - 隐喻叙事 → 更不规则（0.5）
- **变形程度**：基于情感表达强度
  - 强烈情感 → 更大变形（0.25）
  - 内敛情感 → 更少变形（0.05）
- **不对称性**：基于情感强度（0-0.15）

#### 2. 内部图案
- **图案类型**：基于反思深度
  - 深度反思（>0.7）→ 分层图案（同心圆+径向线条）
  - 中等反思（0.4-0.7）→ 中等图案（弧线+中心点）
  - 浅层反思（<0.4）→ 简单图案（点状）
- **图案密度**：基于文本复杂度
  - 复杂（0.6）→ 密集图案
  - 中等（0.4）→ 中等密度
  - 简单（0.2）→ 稀疏图案

#### 3. 边缘特征
- **清晰度**：基于真实性/亲密程度
  - 正式 → 清晰边缘（0.8）
  - 亲密 → 柔和边缘（0.3）
  - 随意 → 中等边缘（0.5）
- **规则性**：基于表达方式
  - 直接表达 → 规则边缘（0.9）
  - 间接表达 → 不规则边缘（0.5）

#### 4. 颜色特征
- **基础颜色**：基于情感和语义特征
  - 快乐 → 亮黄色
  - 悲伤 → 亮蓝色
  - 愤怒 → 红色
  - 恐惧 → 紫色
  - 惊讶 → 青绿色
  - 厌恶 → 深橙色
  - 中性 → 深紫色
- **颜色调整**：只调整透明度，不改变颜色本质
  - 保持颜色多样性，尊重每个主体的独特性

---

## 在实际数据可视化中的应用

### 适用场景

#### 细粒度展示（当前实现）

1. **数据故事（Data Storytelling）**
   - 用glyph代表故事中的不同人物
   - 通过视觉特征快速传达人物的主观性特征
   - 让观众更容易与故事产生共鸣

2. **社会研究可视化**
   - 展示不同群体的主观性差异
   - 避免将人群视为同质化整体
   - 尊重每个个体的独特性

3. **访谈数据分析**
   - 每个glyph代表一个受访者
   - 通过视觉特征快速识别不同的叙事风格和情感表达
   - 帮助研究者发现模式，同时保持对个体的关注

#### 粗粒度展示（群体规模可视化）

4. **群体规模可视化**
   - 用glyph数量表示群体规模（如：每个glyph = 10人）
   - 用glyph大小表示群体规模（如：大glyph = 大群体）
   - 适用于展示性别、年龄组、地区等分类数据
   
   **示例：性别分布**
   ```
   Male (150):    [15 glyphs, each = 10 people]
   Female (120):  [12 glyphs, each = 10 people]
   Other (30):    [3 glyphs, each = 10 people]
   ```
   
   **设计要点**：
   - 每个glyph代表群体的代表性特征
   - Glyph数量或大小直观反映数据
   - 保持统一的视觉编码框架

5. **人文数据可视化**
   - 任何需要"尊重每个主体"的数据场景
   - 避免冷冰冰的数据点
   - 让数据更有温度和人文关怀

### 使用指南

#### 场景1：细粒度展示（每个glyph代表一个人）

##### 1. 数据准备
```javascript
// 每个数据点需要包含：
{
  id: "unique_id",
  text_content: "完整的文本内容",  // 必需：用于提取subjectivity
  semantic_embedding: [384维向量],  // 可选：语义向量
  emotion_scores: {                // 可选：情感分数
    joy: 0.2,
    sadness: 0.3,
    // ...
  },
  metadata: {
    text_length: 1000,
    // 其他元数据
  }
}
```

##### 2. 初始化渲染器
```javascript
import { IsotypeRenderer } from './isotypeRenderer.js';
import { SubjectivityExtractor } from './subjectivityExtractor.js';

const renderer = new IsotypeRenderer(canvas, ctx);
// SubjectivityExtractor会自动初始化
```

##### 3. 渲染glyph
```javascript
// 为每个节点生成glyph
nodes.forEach(node => {
  renderer.renderIsotype(node, x, y, isHighlighted);
});
```

##### 4. 解释视觉特征
```javascript
// 获取节点的subjectivity特征
const subjectivity = renderer.subjectivityExtractor.extractSubjectivity(node);

// 向观众解释：
// - 形状的规则性 → 叙事风格
// - 内部图案 → 反思深度
// - 边缘特征 → 表达方式
// - 颜色 → 情感特征
```

#### 场景2：粗粒度展示（用glyph表示群体规模）

##### 1. 数据准备
```javascript
// 群体数据
const genderGroups = {
  male: {
    count: 150,
    label: 'Male',
    samples: [/* 该群体的样本数据 */]
  },
  female: {
    count: 120,
    label: 'Female',
    samples: [/* 该群体的样本数据 */]
  },
  other: {
    count: 30,
    label: 'Other',
    samples: [/* 该群体的样本数据 */]
  }
};
```

##### 2. 初始化Group渲染器
```javascript
import { GroupIsotypeRenderer } from './groupIsotypeRenderer.js';

const groupRenderer = new GroupIsotypeRenderer(canvas, ctx);
```

##### 3. 渲染群体可视化

**方式A：数量编码（推荐用于大规模数据）**
```javascript
groupRenderer.renderGroups(genderGroups, {
  encoding: 'count',      // 用数量编码
  unitSize: 10,          // 每个glyph = 10人
  layout: 'grid',        // 网格布局
  columns: 5,             // 每行5个glyph
  spacing: 15,           // glyph间距
  representativeMethod: 'median'  // 选择中位数样本
});
```

**方式B：大小编码（推荐用于小规模数据）**
```javascript
groupRenderer.renderGroups(genderGroups, {
  encoding: 'size',      // 用大小编码
  layout: 'horizontal',  // 水平排列
  spacing: 50,          // glyph间距
  representativeMethod: 'average'  // 选择平均特征样本
});
```

##### 4. 解释视觉编码
```javascript
// 向观众解释：
// - 数量编码：15个glyph = 150人（每个glyph = 10人）
// - 大小编码：大glyph = 大群体，小glyph = 小群体
// - 每个glyph的特征 = 该群体的代表性特征
```

---

## 设计系统组件

### 1. SubjectivityExtractor（主观性提取器）
- **功能**：从文本中提取个人主观性特征
- **输入**：文本内容、语义向量、情感分数
- **输出**：完整的subjectivity特征对象

### 2. IsotypeRenderer（Isotype渲染器）
- **功能**：根据subjectivity特征渲染独特的glyph
- **输入**：节点数据、位置坐标
- **输出**：Canvas上的视觉glyph

### 3. 视觉特征映射表

| Subjectivity特征 | 视觉编码 | 可解释性 |
|-----------------|---------|---------|
| 叙事风格（直接/反思/隐喻） | 形状规则性 | "这个人的叙事更直接，所以形状更规则" |
| 情感表达强度 | 形状变形程度 | "情感更强烈的人，形状变化更大" |
| 反思深度 | 内部图案类型 | "深度反思的人，内部有更多层次" |
| 文本复杂度 | 图案密度 | "表达更复杂的人，内部图案更密集" |
| 真实性/亲密程度 | 边缘清晰度 | "更亲密的表达，边缘更柔和" |
| 表达方式（直接/间接） | 边缘规则性 | "直接表达的人，边缘更规则" |
| 情感类型 | 基础颜色 | "快乐的人用黄色，悲伤的人用蓝色" |

---

## 设计原则在实际应用中的体现

### 1. 统一编码，个人表达
- ✅ 所有glyph都是圆形基础（统一）
- ✅ 但每个glyph的形状、图案、边缘都不同（个人表达）

### 2. 尊重与关怀
- ✅ 颜色基于情感和语义特征，不是随机分配
- ✅ 每个视觉特征都有明确的语义含义
- ✅ 避免将人简化为数据点

### 3. 温暖多元
- ✅ 使用温暖的渐变和柔和的光晕
- ✅ 避免尖锐的线条和硬边界
- ✅ 保持颜色的多样性，尊重每个主体的独特性

### 4. 可解释性
- ✅ 每个视觉特征都可以解释给观众
- ✅ 提供subjectivity特征的详细说明
- ✅ 支持从视觉特征回溯到文本特征

---

## 扩展性

### 添加新的Subjectivity维度

```javascript
// 在SubjectivityExtractor中添加新维度
extractSubjectivity(node) {
  return {
    // ... 现有维度
    new_dimension: this.analyzeNewDimension(text),
  };
}

// 在IsotypeRenderer中使用新维度
calculateNewVisualFeature(subjectivity) {
  const newDim = subjectivity.new_dimension;
  // 根据新维度计算视觉特征
  return visualFeature;
}
```

### 自定义视觉编码

```javascript
// 可以自定义颜色映射
getEmotionColor(emotion) {
  const customColors = {
    joy: '#YOUR_COLOR',
    sadness: '#YOUR_COLOR',
    // ...
  };
  return customColors[emotion];
}
```

---

## 最佳实践

### 1. 数据故事中的应用
- 用glyph代表故事中的不同人物
- 通过视觉特征快速传达人物特征
- 在故事中解释视觉编码的含义

### 2. 研究可视化中的应用
- 展示不同群体的主观性差异
- 避免过度聚合，保持对个体的关注
- 提供详细的视觉编码说明

### 3. 交互设计
- 悬停/点击显示完整的subjectivity特征
- 提供文本内容的访问
- 允许用户探索视觉特征的含义

---

## 技术实现

### 依赖
- Canvas 2D API
- SubjectivityExtractor（文本分析）
- 语义向量（可选，用于颜色分配）

### 性能考虑
- 每个glyph的渲染是独立的，可以并行处理
- 使用Canvas而非SVG，性能更好
- 可以缓存subjectivity特征，避免重复计算

---

## 参考文献

- **Isotype (International System of Typographic Picture Education)**: Otto Neurath, 1920s
- **Anthropographics**: 以人为中心的数据可视化方法
- **Data Storytelling**: 用数据讲述故事的方法

---

*"每一个数据点，都是一个活生生的人，有着自己的痛苦、希望、挣扎和成长。"*

