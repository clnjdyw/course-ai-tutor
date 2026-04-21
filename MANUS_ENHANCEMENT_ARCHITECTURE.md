# 🚀 Manus 级智能体系统增强架构

**版本**: v3.0  
**目标**: 将课程辅导系统升级为完整的类 Manus 智能体系统  
**更新日期**: 2026-04-21

---

## 一、当前差距分析

### 与 Manus 的核心差距

```
┌─────────────────┐     ┌─────────────────┐
│   当前系统      │ ──→ │   Manus 级别    │
├─────────────────┤     ├─────────────────┤
│ 预设思维链      │     │ 自主任务规划    │
│ 固定工具调用    │     │ 动态工具生态    │
│ 简单记忆存储    │     │ 长期记忆系统    │
│ 单一 Agent 响应 │     │ 多 Agent 协作   │
│ 纯文本交互      │     │ 多模态支持      │
└─────────────────┘     └─────────────────┘
```

---

## 二、增强后架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互层                                │
│   文本 │ 图片 │ 语音 │ 文件 │ 实时协作                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      中枢智能体 (Orchestrator)                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • 意图理解 (Intent Understanding)                        │   │
│  │ • 任务分解 (Task Decomposition)                          │   │
│  │ • 资源协调 (Resource Orchestration)                      │   │
│  │ • 结果整合 (Result Integration)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ 规划引擎      │    │ 工具生态      │    │ 协作协议      │
│ (Planner)    │    │ (Tools)       │    │ (Protocol)    │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      记忆系统 (Memory)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 短期记忆 │  │ 长期记忆 │  │ 语义记忆 │  │ 程序记忆 │   │
│  │(Working) │  │ (Vector) │  │(Semantic)│  │(Procedural)│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ 子智能体池    │    │ 工具执行器    │    │ 知识库 (RAG) │
│ • Planner    │    │ • Browser    │    │ • 课程知识   │
│ • Tutor      │    │ • Calculator │    │ • 用户画像   │
│ • Helper     │    │ • FileOp     │    │ • 学习记录   │
│ • Evaluator  │    │ • CodeExec   │    │ • 知识点图谱 │
│ • Companion  │    │ • Search     │    │             │
│ • Researcher  │    │ • Dalle      │    │             │
│ • Coder      │    │ • TTS/STT    │    │             │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 三、核心模块设计

### 3.1 中枢智能体增强 (Orchestrator)

**职责升级**：
- 接收并理解多模态输入
- 自主分解复杂任务为子任务
- 动态调度工具和子智能体
- 监控执行状态，处理异常
- 整合多源结果生成最终响应

**新增能力**：

```java
public interface Orchestrator {
    // 意图理解
    Intent parseIntent(UserInput input);
    
    // 任务规划
    TaskPlan createPlan(Intent intent);
    
    // 任务执行
    ExecutionResult executePlan(TaskPlan plan);
    
    // 动态调整
    TaskPlan adjustPlan(TaskPlan plan, ExecutionFeedback feedback);
    
    // 结果整合
    Response integrateResults(List<SubTaskResult> results);
}
```

**任务分解示例**：
```
用户：帮我准备一场关于 Spring Boot 的考试

分解为：
1. [Research] 搜索 Spring Boot 核心知识点
2. [Tutor] 分析学生水平
3. [Planner] 生成考试大纲
4. [Tool: CodeExec] 生成选择题代码
5. [Tool: FileOp] 保存试卷文件
6. [Evaluator] 审核试卷质量
7. [Output] 整合输出
```

---

### 3.2 工具生态 (Tool Ecosystem)

#### 工具分类

| 类别 | 工具 | 功能 |
|------|------|------|
| **信息获取** | WebSearch | 搜索互联网 |
| | KnowledgeBase | 查询知识库 |
| | DocumentReader | 读取文档 |
| **计算执行** | Calculator | 数学计算 |
| | CodeExecutor | 执行代码 |
| | SQLExecutor | 执行 SQL |
| **文件操作** | FileReader | 读取文件 |
| | FileWriter | 写入文件 |
| | ImageGenerator | 生成图片 |
| **通信** | EmailSender | 发送邮件 |
| | CalendarManager | 日程管理 |
| **多媒体** | ImageAnalysis | 图片理解 |
| | TTS | 文字转语音 |
| | STT | 语音转文字 |

#### 工具调用接口

```java
public interface Tool {
    String getName();                    // 工具名称
    String getDescription();             // 功能描述
    List<Parameter> getParameters();     // 参数定义
    boolean validate(Map<String, Object> params);  // 参数校验
    
    ToolResult execute(Map<String, Object> params);  // 执行
    String getSchema();                  // 返回 MCP Schema
}

public class ToolManager {
    Map<String, Tool> tools;
    ToolResult execute(String toolName, Map<String, Object> params);
    List<Tool> suggestTools(Intent intent);  // 根据意图推荐工具
}
```

#### MCP 协议集成

```yaml
# tools/mcp-schema.yaml
tools:
  - name: web_search
    protocol: mcp
    command: npx @modelcontextprotocol/server-web-search
    
  - name: file_system
    protocol: mcp  
    command: npx @modelcontextprotocol/server-filesystem
    params:
      allowedDirectories: ["/data", "/workspace"]
      
  - name: code_executor
    protocol: mcp
    command: python tools/code_executor.py
```

---

### 3.3 自主规划引擎 (Planning Engine)

**核心能力**：

```
┌────────────────────────────────────────────────────┐
│                   规划引擎                          │
├────────────────────────────────────────────────────┤
│                                                    │
│  1. 目标理解                                        │
│     ↓                                              │
│  2. 现状分析                                        │
│     ↓                                              │
│  3. 任务分解 ──→ 子任务1 ──┐                        │
│     │              子任务2 ──┼──→ 依赖图            │
│     │              子任务3 ──┘                        │
│     ↓                                              │
│  4. 资源规划                                        │
│     ↓                                              │
│  5. 执行排序 (拓扑排序)                              │
│     ↓                                              │
│  6. 异常预案                                        │
│     ↓                                              │
│  7. 生成执行计划                                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

**规划算法**：

```java
public class PlanningEngine {
    
    public TaskPlan createPlan(String goal, Context context) {
        // 1. 理解目标
        GoalUnderstanding understoodGoal = understandGoal(goal);
        
        // 2. 分析现状
        CurrentState state = analyzeCurrentState(context);
        
        // 3. 分解任务
        List<SubTask> subTasks = decompose(understoodGoal, state);
        
        // 4. 构建依赖图
        DependencyGraph graph = buildDependencyGraph(subTasks);
        
        // 5. 排序执行
        List<SubTask> executionOrder = topologicalSort(graph);
        
        // 6. 分配资源
        Map<SubTask, List<Tool>> resourceMap = allocateResources(executionOrder);
        
        // 7. 生成计划
        return new TaskPlan(executionOrder, resourceMap, graph);
    }
    
    // ReAct 模式
    public ExecutionResult executeWithReAct(TaskPlan plan) {
        for (SubTask task : plan.getExecutionOrder()) {
            String thought = think(task);      // 思考
            String action = act(task);         // 行动
            String observation = observe();    // 观察
            
            if (!validate(observation)) {
                // 回退并重试
                task = revise(task, observation);
            }
        }
    }
}
```

**规划示例**：

```
用户目标：帮我分析这个月的学习情况并给出改进建议

┌─────────────────────────────────────────────────────────┐
│                    规划执行过程                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Step 1: 目标理解                                        │
│   "分析学习情况" + "给出改进建议"                        │
│                                                         │
│ Step 2: 任务分解                                        │
│   ├── T1: 获取本月学习数据 (Database)                   │
│   ├── T2: 分析答题正确率趋势 (Analyzer)                 │
│   ├── T3: 识别薄弱知识点 (ML)                           │
│   ├── T4: 对比历史表现 (Comparison)                     │
│   ├── T5: 生成改进建议 (LLM)                            │
│   └── T6: 创建下月计划 (Planner)                        │
│                                                         │
│ Step 3: 依赖关系                                        │
│   T1 → T2 → T3 → T4 → T5 → T6                          │
│                                                         │
│ Step 4: 执行                                             │
│   [执行 T1] → [执行 T2] → [执行 T3-4] → [执行 T5] → [T6]│
│                                                         │
│ Step 5: 输出                                            │
│   📊 月度学习报告 + 📝 改进建议 + 📅 下月计划            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 3.4 Agent 动态协作协议 (Collaboration Protocol)

#### 协作模式

```
┌──────────────────────────────────────────────────────────┐
│                    Agent 协作模式                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  模式 1: 串行协作 (Pipeline)                              │
│  ┌────┐   ┌────┐   ┌────┐   ┌────┐                      │
│  │ A  │ → │ B  │ → │ C  │ → │ D  │                      │
│  └────┘   └────┘   └────┘   └────┘                      │
│  例: 问题 → 检索 → 回答 → 评估                           │
│                                                          │
│  模式 2: 并行协作 (Parallel)                             │
│       ┌────┐                                           │
│  ┌────│ B  │────┐                                       │
│  │    └────┘    │                                       │
│  ▼              ▼                                       │
│ ┌────┐    ┌────┐                                       │
│ │ A  │    │ C  │                                       │
│ └────┘    └────┘                                       │
│  例: 同时查询多个知识库                                  │
│                                                          │
│  模式 3: 循环协作 (Loop)                                 │
│  ┌─────────────────────┐                                 │
│  │   ┌────┐   ┌────┐   │                                 │
│  └──→│ A  │ → │ B  │←─┘                                 │
│      └────┘   └────┘                                    │
│  例: 迭代优化直到满足条件                                │
│                                                          │
│  模式 4: 层次协作 (Hierarchical)                          │
│       ┌──────────────┐                                  │
│       │  Orchestrator │                                  │
│       └──────┬───────┘                                  │
│         ┌────┴────┐                                      │
│         ▼         ▼                                      │
│      ┌────┐    ┌────┐                                   │
│      │ A1 │    │ A2 │  ← 子 Agent                       │
│      └────┘    └────┘                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### 协作协议定义

```java
public interface AgentProtocol {
    // 消息类型
    enum MessageType {
        REQUEST,    // 请求
        RESPONSE,   // 响应
        QUERY,      // 查询
        NOTIFY,     // 通知
        RESULT,     // 结果
        ERROR       // 错误
    }
    
    // 协作消息
    class AgentMessage {
        String messageId;
        String sourceAgent;
        String targetAgent;
        MessageType type;
        Object payload;
        Map<String, Object> metadata;
        long timestamp;
    }
    
    // 协作接口
    void sendMessage(AgentMessage message);
    void onMessage(AgentMessage message);
    void onResult(String taskId, Object result);
    void onError(String taskId, Exception error);
}
```

#### 协作示例：复杂考试准备

```
场景：用户要求"准备一场 Java 期末考试"

┌─────────────────────────────────────────────────────────────┐
│                    协作流程                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Orchestrator                                                │
│     │                                                       │
│     ├── [T1] 调度 Researcher                                │
│     │   └→ 搜索 Java 核心知识点                             │
│     │                                                        │
│     ├── [T2] 并行调度多个 Tutor                             │
│     │   ├→ Tutor-JavaSE  → 生成基础题                       │
│     │   ├→ Tutor-Spring  → 生成框架题                      │
│     │   └→ Tutor-SQL      → 生成数据库题                    │
│     │                                                        │
│     ├── [T3] 调度 Evaluator                                  │
│     │   └→ 审核题目质量，标记重复                           │
│     │                                                        │
│     ├── [T4] 调度 Planner                                   │
│     │   └→ 生成答案和评分标准                               │
│     │                                                        │
│     └── [T5] 整合结果                                       │
│         └→ 输出完整试卷 + 答案册                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Agent 间消息：
{
  "type": "TASK_RESULT",
  "source": "Tutor-JavaSE",
  "target": "Orchestrator",
  "payload": {
    "taskId": "generate-basic-questions",
    "questions": [...],
    "difficulty": "MEDIUM"
  }
}
```

---

### 3.5 长期记忆系统 (Memory System)

#### 记忆分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     记忆系统架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    工作记忆 (Working)                 │   │
│  │  • 当前对话上下文                                     │   │
│  │  • 活跃任务状态                                       │   │
│  │  • 临时计算结果                                       │   │
│  │  • 容量: 有限的 tokens                                │   │
│  │  • 淘汰: LRU / 重要性                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    情景记忆 (Episodic)                │   │
│  │  • 用户交互历史                                       │   │
│  │  • 任务执行记录                                       │   │
│  │  • 时间序列事件                                       │   │
│  │  • 存储: Vector DB                                    │   │
│  │  • 检索: 相关性 + 时间衰减                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    语义记忆 (Semantic)                │   │
│  │  • 用户画像特征                                       │   │
│  │  • 知识概念图谱                                       │   │
│  │  • 学习偏好模型                                       │   │
│  │  • 存储: Graph DB                                     │   │
│  │  • 检索: 关系推理                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    程序记忆 (Procedural)              │   │
│  │  • 工具使用经验                                       │   │
│  │  • Agent 协作模式                                     │   │
│  │  • 成功/失败案例                                      │   │
│  │  • 存储: 规则 + 神经网络                              │   │
│  │  • 检索: 模式匹配                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 记忆接口

```java
public interface MemorySystem {
    
    // 工作记忆
    void addToWorkingMemory(String key, Object value);
    Object getFromWorkingMemory(String key);
    void clearWorkingMemory();
    
    // 情景记忆
    void storeEpisode(Episode episode);
    List<Episode> retrieveEpisodes(String query, int limit);
    List<Episode> getRecentEpisodes(int count);
    
    // 语义记忆
    void updateUserProfile(UserProfile profile);
    UserProfile getUserProfile(Long userId);
    void addKnowledge(KnowledgeNode knowledge);
    List<KnowledgeNode> queryKnowledge(String concept);
    
    // 程序记忆
    void recordProcedure(Procedure proc);
    Procedure getBestProcedure(String taskType);
    void learnFromResult(String taskId, boolean success);
    
    // 统一检索
    MemoryResult search(String query, SearchOptions options);
}
```

#### 记忆检索示例

```
用户：上次我们学习 Spring 时我遇到的问题是什么？

检索过程：
1. 工作记忆 → 无相关上下文
2. 情景记忆 → 
   - 检索向量: "Spring 学习 困难 问题"
   - 结果: "2026-04-15 学习 Spring IOC 容器时遇到循环依赖问题"
3. 语义记忆 →
   - 查询用户薄弱点
   - 结果: Spring IOC (掌握度 45%)
4. 程序记忆 →
   - 查询类似问题处理经验
   - 结果: "建议使用 @Lazy 注解解决"

响应：
"我记得上次学习 Spring 时，你在 IOC 容器遇到了循环依赖的问题。
当时我们通过 @Lazy 注解解决了。你现在对这个概念掌握得怎么样了？"
```

---

## 四、技术实现路线

### 阶段一：基础设施增强 (1-2 周)

```
任务清单：
□ 1.1 扩展 BaseAgent，添加工具调用能力
□ 1.2 实现 ToolManager 工具管理器
□ 1.3 集成 MCP 协议支持
□ 1.4 升级 AgentController 支持流式 + 工具调用
□ 1.5 添加常用工具实现
```

**代码示例 - 扩展 BaseAgent**：

```java
// BaseAgent.java 增强
public abstract class BaseAgent {
    
    @Autowired
    protected ChatClient chatClient;
    
    @Autowired
    private ToolManager toolManager;
    
    // 工具调用能力
    protected String callWithTools(String userPrompt) {
        // 1. 让 LLM 决定是否需要调用工具
        ChatResponse response = chatClient.prompt()
            .user(userPrompt)
            .tools(toolManager.getFunctionSchemas())  // 注入工具定义
            .call()
            .chatResponse();
        
        // 2. 处理函数调用
        while (response.hasToolCalls()) {
            for (ToolCall call : response.getToolCalls()) {
                ToolResult result = toolManager.execute(
                    call.getFunctionName(), 
                    call.getArguments()
                );
                // 3. 将结果反馈给 LLM
                response = chatClient.prompt()
                    .user("继续处理，结果：" + result.getContent())
                    .functions(toolManager.getFunctionSchemas())
                    .call()
                    .chatResponse();
            }
        }
        
        return response.getContent();
    }
}
```

### 阶段二：规划引擎实现 (2-3 周)

```
任务清单：
□ 2.1 实现 PlanningEngine 核心类
□ 2.2 实现任务分解算法
□ 2.3 实现 ReAct 执行循环
□ 2.4 实现异常处理和回退机制
□ 2.5 集成到 Orchestrator
```

### 阶段三：协作协议实现 (2 周)

```
任务清单：
□ 3.1 定义 AgentMessage 协议格式
□ 3.2 实现 AgentMessageBus 消息总线
□ 3.3 实现 AgentRegistry 注册中心
□ 3.4 实现各种协作模式
□ 3.5 添加协作监控和日志
```

### 阶段四：记忆系统实现 (2-3 周)

```
任务清单：
□ 4.1 扩展数据库表结构
□ 4.2 实现 WorkingMemory
□ 4.3 集成 Vector DB (Milvus/Chroma)
□ 4.4 实现 SemanticMemory (图数据库可选)
□ 4.5 实现 ProceduralMemory
□ 4.6 实现统一检索接口
```

### 阶段五：集成与优化 (2 周)

```
任务清单：
□ 5.1 端到端集成测试
□ 5.2 性能优化
□ 5.3 错误处理完善
□ 5.4 监控告警
□ 5.5 文档编写
```

---

## 五、实施优先级

### P0 - 核心必须

```
1. 工具调用系统
   ├── ToolManager
   ├── WebSearch
   ├── Calculator
   └── CodeExecutor

2. 规划引擎基础
   ├── 任务分解
   ├── 基础执行

3. 记忆系统基础
   ├── 工作记忆
   └── 简单情景记忆
```

### P1 - 重要增强

```
4. 协作协议基础
   ├── 消息总线
   └── 串行协作

5. 更多工具
   ├── FileOperation
   ├── KnowledgeBase
   └── ImageAnalysis

6. 记忆系统增强
   └── 向量检索
```

### P2 - 高级功能

```
7. 复杂协作模式
8. 语义记忆
9. 程序记忆学习
10. 多模态支持
```

---

## 六、预期效果

### 增强前后对比

| 能力 | 增强前 | 增强后 |
|------|--------|--------|
| **任务处理** | 预设问答 | 自主规划复杂任务 |
| **工具使用** | 固定模板 | 动态选择 + 执行 |
| **记忆能力** | 简单存储 | 分层记忆 + 智能检索 |
| **协作模式** | 单一调用 | 动态多 Agent 协作 |
| **响应质量** | 基础生成 | 基于事实 + 工具增强 |
| **学习能力** | 无 | 从交互中学习优化 |

### 新增使用场景

```
1. 智能学习助手
   "帮我分析这学期的学习数据，找出薄弱点，制定下个月的学习计划"
   → 自动查询数据库 → 分析趋势 → 识别问题 → 生成计划

2. 自适应出题
   "给 Java 初学者出一套测试题，要包含最新 Spring Boot 内容"
   → 搜索最新知识点 → 分析学生水平 → 生成题目 → 审核质量

3. 学习顾问
   "我每次学 Spring 都坚持不下去，怎么回事？"
   → 检索历史记录 → 分析模式 → 诊断原因 → 给出建议
```

---

## 七、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 复杂度提升 | 开发周期长 | 分阶段实施，优先核心功能 |
| 性能开销 | 响应延迟 | 异步处理 + 缓存 |
| 工具安全 | 潜在风险 | 沙箱 + 权限控制 |
| 调试困难 | 排查问题难 | 完善日志 + 追踪 |
| LLM 幻觉 | 错误工具调用 | 结果校验 + 人工确认 |

---

## 八、总结

通过以上增强，系统将从：

```
当前状态                          目标状态
─────────────────────────────────────────────────
6 个预设智能体          →        动态 Agent 协作
固定思维链              →        自主任务规划
简单记忆存储            →        分层记忆系统
单一工具调用            →        工具生态系统
被动响应                →        主动服务
```

最终成为一个**真正的类 Manus 智能体系统**，能够：
- ✅ 自主理解复杂任务
- ✅ 动态调用工具解决问题
- ✅ 多 Agent 智能协作
- ✅ 长期学习和记忆
- ✅ 提供真正个性化的服务

---

**下一步**：开始实施阶段一，具体从扩展 BaseAgent 的工具调用能力开始。
