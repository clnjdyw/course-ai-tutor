# 🌈 情绪反馈系统文档

统一的情绪反馈系统，所有 6 个 Skills 都已适配。

## 📊 系统架构

```
┌─────────────────────────────────────────────────┐
│          所有 Skills (6 个)                      │
│  ┌──────────┬──────────┬──────────┬──────────┐ │
│  │ Planner  │  Tutor   │  Helper  │Evaluator │ │
│  └──────────┴──────────┴──────────┴──────────┘ │
│  ┌──────────┬──────────┐                       │
│  │Companion │ Manager  │                       │
│  └──────────┴──────────┘                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│       shared/mood-service.js (共享服务)         │
│  - 情绪状态管理                                  │
│  - 情绪计算逻辑                                  │
│  - 情绪历史记录                                  │
│  - 情绪反馈生成                                  │
└─────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│          情绪状态存储 (Memory/DB)               │
│  - userId -> MoodState                          │
│  - userId -> MoodHistory[]                      │
└─────────────────────────────────────────────────┘
```

## 🎭 情绪类型

| 情绪 | Emoji | 触发条件 | 表现 |
|------|-------|---------|------|
| **EXCITED** | 🤩 | 正确率≥80% + 连续 7 天 | 兴奋、庆祝、高挑战 |
| **HAPPY** | 😊 | 正确率≥80% | 开心、表扬、鼓励 |
| **NEUTRAL** | 🙂 | 正确率 50-79% | 平静、肯定、正常 |
| **CONCERNED** | 😔 | 正确率<50% | 关心、安慰、鼓励 |
| **ENCOURAGING** | 💪 | 需要额外鼓励时 | 支持、打气、陪伴 |

## 📡 所有 Skills 的统一接口

### 输入参数（所有 Skills 都支持）

```javascript
{
  userId: string,           // 用户 ID
  moodState?: {             // 可选：传入当前情绪状态
    currentMood: MoodType,
    accuracy: number,       // 正确率 0-100
    streakDays: number,     // 连续学习天数
    moodScore: number       // 情绪分数 0-100
  },
  // ... 其他技能特定参数
}
```

### 输出响应（所有 Skills 都返回）

```javascript
{
  success: boolean,
  agentType: string,        // planner/tutor/helper/evaluator/companion
  mood: {
    currentMood: {
      type: string,         // HAPPY/NEUTRAL/CONCERNED/EXCITED
      emoji: string,        // 😊/🙂/😔/🤩
      description: string   // 开心/平静/关心/兴奋
    },
    accuracy: number,
    streakDays: number,
    moodScore: number
  },
  moodFeedback?: string,    // 情绪反馈消息
  // ... 其他技能特定数据
}
```

## 🔄 情绪更新流程

### 1. 用户发起请求

```javascript
// 通过 Agent Manager
openclaw skill run skill-agent-manager handleMessage {
  "userId": "student_001",
  "message": "我想学习 Python"
}
```

### 2. Agent Manager 获取情绪状态

```javascript
// 从 mood-service 获取
const moodState = moodService.getMoodState(userId);
// 返回：{ currentMood: HAPPY, accuracy: 85, streakDays: 3, ... }
```

### 3. 路由到对应 Skill

```javascript
// 根据意图路由，并传递情绪状态
skill-study-planner.createPlan({
  userId,
  goal: "学习 Python",
  moodState  // 传递情绪状态
});
```

### 4. Skill 根据情绪调整响应

```javascript
// skill-study-planner/index.js
const planStrategy = adjustPlanByMood(mood.currentMood, params);
// 情绪高涨 → 设置更有挑战性的计划
// 情绪低落 → 降低难度，更多鼓励
```

### 5. 更新情绪历史（如需要）

```javascript
// 记录情绪变化
moodService.recordMoodHistory(userId, mood.currentMood, '创建学习计划');
```

### 6. 返回统一格式的响应

```javascript
return {
  success: true,
  agentType: 'planner',
  mood: { ... },           // 当前情绪状态
  moodFeedback: '...',     // 情绪反馈消息
  planContent: '...'       // 技能特定数据
};
```

## 📊 情绪计算逻辑

### 正确率计算

```javascript
accuracy = (correctQuestions / totalQuestions) * 100
```

### 情绪分数计算

```javascript
moodScore = (accuracy * 0.7) + (min(streakDays * 5, 30))
// 正确率占 70%，连续天数占 30%（最多 30 分）
```

### 情绪类型判定

```javascript
if (accuracy >= 80 && streakDays >= 7) {
  return EXCITED;  // 🤩
} else if (accuracy >= 80) {
  return HAPPY;    // 😊
} else if (accuracy >= 50) {
  return NEUTRAL;  // 🙂
} else {
  return CONCERNED; // 😔
}
```

## 🎯 各 Skills 的情绪适配策略

### 1. skill-study-planner（学习规划）

| 情绪状态 | 调整策略 |
|---------|---------|
| EXCITED/HAPPY | 设置更有挑战性的目标，增加关卡数量 |
| NEUTRAL | 保持正常难度，适当鼓励 |
| CONCERNED | 降低难度，减少关卡，增加休息时间和鼓励 |

**示例**:
```javascript
// 情绪高涨时
{
  difficulty: 'challenging',
  stages: 5,
  message: '情绪高涨，可以挑战更高目标'
}

// 情绪低落时
{
  difficulty: 'easy',
  stages: 3,
  restFrequency: 'frequent',
  message: '情绪低落，降低难度，多鼓励'
}
```

### 2. skill-tutor（教学讲解）

| 情绪状态 | 调整策略 |
|---------|---------|
| EXCITED | 加快节奏，增加挑战性问题，高互动 |
| HAPPY | 正常节奏，高鼓励 |
| NEUTRAL | 正常节奏，正常互动 |
| CONCERNED | 放慢节奏，高鼓励，降低难度，高互动 |

### 3. skill-homework-helper（答疑辅导）

| 情绪状态 | 调整策略 |
|---------|---------|
| HAPPY/EXCITED | 引导更多思考，减少直接提示 |
| NEUTRAL | 平衡引导和提示 |
| CONCERNED | 更多提示，更多鼓励，降低问题难度 |

### 4. skill-evaluator（评估批改）

| 情绪状态 | 调整策略 |
|---------|---------|
| HAPPY/EXCITED | 可以指出更多改进空间 |
| NEUTRAL | 平衡反馈（优点 + 改进） |
| CONCERNED | 更多鼓励，减少批评，强调进步 |

### 5. skill-companion（陪伴聊天）

| 情绪状态 | 调整策略 |
|---------|---------|
| EXCITED | 一起庆祝，分享喜悦 |
| HAPPY | 表扬鼓励，保持积极 |
| NEUTRAL | 日常关心，温和交流 |
| CONCERNED | 安慰支持，心理疏导 |

### 6. skill-agent-manager（智能路由）

- 统一获取情绪状态
- 传递给对应 Skill
- 附加情绪反馈到响应

## 🧪 测试示例

### 测试 1: 获取情绪状态

```bash
openclaw skill run skill-companion getMoodState --userId "student_001"
```

**预期输出**:
```json
{
  "success": true,
  "moodState": {
    "currentMood": {
      "type": "HAPPY",
      "emoji": "😊",
      "description": "开心"
    },
    "accuracy": 85,
    "streakDays": 3,
    "moodScore": 74
  }
}
```

### 测试 2: 更新学习表现

```bash
openclaw skill run skill-agent-manager updatePerformance '{
  "userId": "student_001",
  "correct": 8,
  "total": 10
}'
```

**预期输出**:
```json
{
  "success": true,
  "moodState": {
    "currentMood": {
      "type": "HAPPY",
      "emoji": "😊"
    },
    "accuracy": 85,
    "streakDays": 3
  },
  "feedback": "😊 **太棒了！小勇士！**..."
}
```

### 测试 3: 带情绪的学习规划

```bash
openclaw skill run skill-study-planner createPlan '{
  "userId": "student_001",
  "goal": "学习 Python",
  "currentLevel": "beginner",
  "moodState": {
    "currentMood": {"type": "CONCERNED", "emoji": "😔"},
    "accuracy": 45,
    "streakDays": 2
  }
}'
```

**预期输出**:
```json
{
  "success": true,
  "planContent": "...",
  "mood": {
    "currentMood": {
      "type": "CONCERNED",
      "emoji": "😔"
    }
  },
  "moodFeedback": "😔 **小勇士，别灰心！**\n\n我知道开始一个新计划可能有点压力..."
}
```

### 测试 4: 情绪历史

```bash
openclaw skill run skill-companion getMoodHistory --userId "student_001" --limit 5
```

**预期输出**:
```json
{
  "success": true,
  "history": [
    {
      "mood": {"type": "HAPPY", "emoji": "😊"},
      "reason": "创建学习计划：学习 Python",
      "timestamp": "2026-04-17T10:30:00Z"
    },
    {
      "mood": {"type": "NEUTRAL", "emoji": "🙂"},
      "reason": "学习主题：变量概念",
      "timestamp": "2026-04-17T09:15:00Z"
    }
  ]
}
```

## 📈 情绪反馈示例

### 兴奋状态 (🤩)

```
🤩 **哇！小勇士，你太厉害了！**

你的正确率达到了 **92%**，简直完美！
🔥 已经连续学习 **7** 天了！

这种状态太棒了，继续保持！
我为你感到超级骄傲！🎉
```

### 开心状态 (😊)

```
😊 **太棒了！小勇士！**

你的正确率达到了 **85%**，真的超级厉害！

🔥 已经连续学习 **3** 天啦！

继续保持这个状态，你一定能达成目标的！
加油！🌸
```

### 平静状态 (🙂)

```
🙂 **做得不错哦！**

你的正确率是 **65%**，表现很稳定！

👍 已经坚持 **2** 天啦！

再细心一点，你会更棒的！
有什么不懂的随时问我～
```

### 关心状态 (😔)

```
😔 **小勇士，别灰心！**

我知道现在的正确率 **42%** 可能让你有点沮丧...

但是！
💡 每一道错题都是学习的机会
💡 每一次尝试都让你离成功更近一步

而且你已经坚持了 **2** 天，这本身就很棒了！

我们一起分析一下错题，下次一定会更好！
我相信你，加油！💪❤️
```

## 🔧 配置说明

### 情绪阈值调整

编辑 `shared/mood-service.js`:

```javascript
export const MOOD_TYPES = {
  HAPPY: {
    type: 'HAPPY',
    minAccuracy: 80,  // 调整这个值
    // ...
  },
  NEUTRAL: {
    type: 'NEUTRAL',
    minAccuracy: 50,  // 调整这个值
    // ...
  }
};
```

### 情绪分数权重

```javascript
export function calculateMoodScore(state) {
  const accuracyScore = accuracy * 0.7;  // 调整权重
  const streakScore = Math.min(streakDays * 5, 30);  // 调整系数
  return Math.round(accuracyScore + streakScore);
}
```

### 情绪反馈文案

在每个 Skill 的 `generateMoodFeedback` 函数中调整：

```javascript
function generateMoodFeedback(mood, accuracy, streakDays) {
  switch (mood.type) {
    case 'HAPPY':
      return `😊 **太棒了！**\n\n你的正确率是 **${accuracy}%**...`;
    // ...
  }
}
```

## 📊 监控和调试

### 查看情绪日志

```javascript
// 在每个 Skill 中
console.log(`[SkillName] 当前情绪：${mood.currentMood.emoji} ${mood.currentMood.description}`);
```

### 检查情绪状态

```bash
# 检查特定用户的情绪状态
openclaw skill run skill-companion getMoodState --userId "student_001"
```

### 重置情绪状态（开发用）

```javascript
// 在 mood-service.js 中添加
export function resetMoodState(userId) {
  moodStore.delete(userId);
  moodHistory.delete(userId);
}
```

## 🎯 最佳实践

1. **始终传递 moodState**: 所有 Skill 调用都应该传递情绪状态
2. **统一响应格式**: 确保所有 Skill 返回的情绪字段一致
3. **及时更新情绪**: 在重要事件（答题、评估）后更新情绪
4. **记录情绪历史**: 便于分析和调试
5. **情绪适配要自然**: 根据情绪调整语气，但不要过度

---

**更新时间**: 2026-04-17  
**状态**: ✅ 已完成  
**适配 Skills**: 6/6  
**共享服务**: shared/mood-service.js
