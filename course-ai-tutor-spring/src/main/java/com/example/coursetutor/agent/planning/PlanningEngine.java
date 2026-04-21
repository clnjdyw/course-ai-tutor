package com.example.coursetutor.agent.planning;

import com.example.coursetutor.agent.tool.ToolManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 规划引擎 - 负责任务分解和执行规划
 * 实现 ReAct (Reasoning + Acting) 模式
 */
@Slf4j
@Component
public class PlanningEngine {
    
    @Autowired
    private ChatClient chatClient;
    
    @Autowired
    private ToolManager toolManager;
    
    @Value("${app.agent.max-plan-tasks:20}")
    private int maxTasks;
    
    @Value("${app.agent.plan-timeout-seconds:60}")
    private int planTimeoutSeconds;
    
    // 意图关键词映射
    private static final Map<String, IntentUnderstanding.IntentType> INTENT_KEYWORDS = Map.ofEntries(
            Map.entry("教", IntentUnderstanding.IntentType.TEACH),
            Map.entry("讲解", IntentUnderstanding.IntentType.TEACH),
            Map.entry("学习", IntentUnderstanding.IntentType.TEACH),
            Map.entry("学", IntentUnderstanding.IntentType.TEACH),
            Map.entry("什么是", IntentUnderstanding.IntentType.TEACH),
            Map.entry("问题", IntentUnderstanding.IntentType.QUESTION),
            Map.entry("问", IntentUnderstanding.IntentType.QUESTION),
            Map.entry("不懂", IntentUnderstanding.IntentType.QUESTION),
            Map.entry("怎么", IntentUnderstanding.IntentType.QUESTION),
            Map.entry("为什么", IntentUnderstanding.IntentType.QUESTION),
            Map.entry("计划", IntentUnderstanding.IntentType.PLAN),
            Map.entry("规划", IntentUnderstanding.IntentType.PLAN),
            Map.entry("安排", IntentUnderstanding.IntentType.PLAN),
            Map.entry("学习路径", IntentUnderstanding.IntentType.PLAN),
            Map.entry("评估", IntentUnderstanding.IntentType.EVALUATE),
            Map.entry("分析", IntentUnderstanding.IntentType.ANALYZE),
            Map.entry("批改", IntentUnderstanding.IntentType.EVALUATE),
            Map.entry("测试", IntentUnderstanding.IntentType.EVALUATE),
            Map.entry("考试", IntentUnderstanding.IntentType.PREPARE),
            Map.entry("出题", IntentUnderstanding.IntentType.PREPARE),
            Map.entry("准备", IntentUnderstanding.IntentType.PREPARE),
            Map.entry("你好", IntentUnderstanding.IntentType.CHAT),
            Map.entry("在吗", IntentUnderstanding.IntentType.CHAT),
            Map.entry("帮我", IntentUnderstanding.IntentType.UNKNOWN)
    );
    
    /**
     * 创建任务计划
     */
    public PlanningResult createPlan(String userInput, Long userId) {
        long startTime = System.currentTimeMillis();
        PlanningResult result = new PlanningResult();
        result.setPlanId(UUID.randomUUID().toString());
        result.setLogs(new ArrayList<>());
        result.setWarnings(new ArrayList<>());
        
        try {
            // 1. 理解意图
            log.info("开始理解用户意图: {}", userInput);
            IntentUnderstanding intent = understandIntent(userInput, userId);
            result.setIntent(intent);
            result.addLog("intent", "意图识别完成: " + intent.getIntentType(), PlanningResult.ExecutionLog.LogLevel.INFO);
            
            // 2. 检查是否需要追问
            if (intent.isNeedsClarification()) {
                result.setSuccess(false);
                result.setError("需要更多信息");
                result.addLog("intent", "需要追问", PlanningResult.ExecutionLog.LogLevel.WARN);
                return result;
            }
            
            // 3. 分解任务
            log.info("开始任务分解");
            List<SubTask> subTasks = decomposeTask(intent);
            result.addLog("decompose", "任务分解完成，共 " + subTasks.size() + " 个子任务", PlanningResult.ExecutionLog.LogLevel.INFO);
            
            // 4. 构建依赖图
            Map<String, List<String>> dependencies = buildDependencyGraph(subTasks, intent);
            
            // 5. 拓扑排序
            List<String> executionOrder = topologicalSort(subTasks, dependencies);
            
            // 6. 分配工具
            Map<String, List<String>> taskTools = allocateTools(subTasks, intent);
            
            // 7. 创建计划
            TaskPlan taskPlan = TaskPlan.builder()
                    .planId(result.getPlanId())
                    .goal(userInput)
                    .subTasks(subTasks)
                    .dependencies(dependencies)
                    .taskTools(taskTools)
                    .executionOrder(executionOrder)
                    .status(TaskPlan.PlanStatus.CREATED)
                    .createdAt(System.currentTimeMillis())
                    .intermediateResults(new HashMap<>())
                    .build();
            
            result.setTaskPlan(taskPlan);
            result.setSuccess(true);
            result.addLog("complete", "计划创建完成", PlanningResult.ExecutionLog.LogLevel.INFO);
            result.setTotalExecutionTimeMs(System.currentTimeMillis() - startTime);
            
            log.info("计划创建成功: planId={}, tasks={}", result.getPlanId(), subTasks.size());
            
        } catch (Exception e) {
            log.error("创建计划失败", e);
            result.setSuccess(false);
            result.setError("创建计划失败: " + e.getMessage());
            result.addLog("error", "计划创建失败: " + e.getMessage(), PlanningResult.ExecutionLog.LogLevel.ERROR);
            result.setTotalExecutionTimeMs(System.currentTimeMillis() - startTime);
        }
        
        return result;
    }
    
    /**
     * 理解用户意图
     */
    private IntentUnderstanding understandIntent(String userInput, Long userId) {
        String lowerInput = userInput.toLowerCase();
        
        // 1. 关键词匹配确定意图类型
        IntentUnderstanding.IntentType intentType = IntentUnderstanding.IntentType.UNKNOWN;
        double confidence = 0.5;
        
        for (Map.Entry<String, IntentUnderstanding.IntentType> entry : INTENT_KEYWORDS.entrySet()) {
            if (lowerInput.contains(entry.getKey())) {
                intentType = entry.getValue();
                confidence = 0.8;
                break;
            }
        }
        
        // 2. 提取参数
        IntentUnderstanding.IntentParams params = IntentUnderstanding.IntentParams.builder()
                .userId(userId)
                .topic(extractTopic(userInput))
                .level(extractLevel(userInput))
                .context(userInput)
                .build();
        
        // 3. 提取实体
        List<IntentUnderstanding.Entity> entities = extractEntities(userInput);
        
        // 4. 检查是否需要追问
        boolean needsClarification = false;
        List<String> questions = new ArrayList<>();
        
        if (params.getTopic() == null || params.getTopic().isEmpty()) {
            if (intentType == IntentUnderstanding.IntentType.TEACH || 
                intentType == IntentUnderstanding.IntentType.QUESTION) {
                needsClarification = true;
                questions.add("您想学习哪个主题？");
            }
        }
        
        return IntentUnderstanding.builder()
                .originalInput(userInput)
                .intentType(intentType)
                .confidence(confidence)
                .entities(entities)
                .params(params)
                .needsClarification(needsClarification)
                .questions(questions)
                .build();
    }
    
    /**
     * 提取主题
     */
    private String extractTopic(String input) {
        // 简单模式匹配
        String[] patterns = {
            "学习(.+?)[，,]",
            "讲解(.+?)[，,]",
            "了解(.+?)[，,]",
            "关于(.+?)[，,.。]",
            "^(.{2,20}?)(如何|是什么|怎么)"
        };
        
        for (String pattern : patterns) {
            Pattern p = Pattern.compile(pattern);
            Matcher m = p.matcher(input);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        
        // 默认取前20个字符
        return input.length() > 20 ? input.substring(0, 20) : input;
    }
    
    /**
     * 提取难度级别
     */
    private String extractLevel(String input) {
        if (input.contains("基础") || input.contains("入门")) return "BEGINNER";
        if (input.contains("高级") || input.contains("深入")) return "ADVANCED";
        if (input.contains("中级") || input.contains("进阶")) return "INTERMEDIATE";
        return "BEGINNER";
    }
    
    /**
     * 提取实体
     */
    private List<IntentUnderstanding.Entity> extractEntities(String input) {
        List<IntentUnderstanding.Entity> entities = new ArrayList<>();
        
        // 提取技术术语（简化版）
        String[] techTerms = {"Spring", "Java", "Python", "AI", "Machine Learning", "Spring Boot", "MySQL", "Redis"};
        for (String term : techTerms) {
            if (input.toLowerCase().contains(term.toLowerCase())) {
                entities.add(IntentUnderstanding.Entity.builder()
                        .type("concept")
                        .value(term)
                        .confidence(0.9)
                        .mention(term)
                        .build());
            }
        }
        
        return entities;
    }
    
    /**
     * 分解任务
     */
    private List<SubTask> decomposeTask(IntentUnderstanding intent) {
        List<SubTask> tasks = new ArrayList<>();
        String topic = intent.getMainTopic();
        int taskIndex = 0;
        
        switch (intent.getIntentType()) {
            case TEACH -> {
                // 教学类任务
                tasks.add(SubTask.create("task_" + taskIndex++, "理解学习目标")
                        .description("了解用户的学习目标和当前水平")
                        .type(SubTask.TaskType.RESEARCH)
                        .requiredAgent("Manager"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "查询知识点")
                        .description("从知识库查询 " + topic + " 相关内容")
                        .type(SubTask.TaskType.RESEARCH)
                        .requiredAgent("Tutor"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "生成教学内容")
                        .description("根据用户水平生成个性化教学内容")
                        .type(SubTask.TaskType.TEACH)
                        .requiredAgent("Tutor"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "生成练习题")
                        .description("生成配套练习题")
                        .type(SubTask.TaskType.EXECUTE)
                        .requiredAgent("Tutor"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "汇总输出")
                        .description("整合教学内容输出")
                        .type(SubTask.TaskType.AGGREGATE));
            }
            
            case QUESTION -> {
                // 问答类任务
                tasks.add(SubTask.create("task_" + taskIndex++, "理解问题")
                        .description("分析用户问题的核心")
                        .type(SubTask.TaskType.RESEARCH)
                        .requiredAgent("Helper"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "查询知识库")
                        .description("查询相关知识点")
                        .type(SubTask.TaskType.RESEARCH));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "生成回答")
                        .description("生成详细解答")
                        .type(SubTask.TaskType.ANSWER)
                        .requiredAgent("Helper"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "输出结果")
                        .description("整理并输出回答")
                        .type(SubTask.TaskType.OUTPUT));
            }
            
            case PLAN -> {
                // 规划类任务
                tasks.add(SubTask.create("task_" + taskIndex++, "分析用户情况")
                        .description("了解用户当前水平和可用时间")
                        .type(SubTask.TaskType.RESEARCH)
                        .requiredAgent("Planner"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "查询知识结构")
                        .description("了解知识点体系")
                        .type(SubTask.TaskType.RESEARCH));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "制定学习计划")
                        .description("生成详细学习计划")
                        .type(SubTask.TaskType.PLAN)
                        .requiredAgent("Planner"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "推荐资源")
                        .description("推荐学习资源")
                        .type(SubTask.TaskType.EXECUTE));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "输出计划")
                        .description("整理输出完整计划")
                        .type(SubTask.TaskType.OUTPUT));
            }
            
            case ANALYZE, EVALUATE -> {
                // 分析/评估类任务
                tasks.add(SubTask.create("task_" + taskIndex++, "获取数据")
                        .description("获取学习数据")
                        .type(SubTask.TaskType.RESEARCH));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "执行分析")
                        .description("分析学习情况")
                        .type(SubTask.TaskType.EVALUATE)
                        .requiredAgent("Evaluator"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "生成建议")
                        .description("生成改进建议")
                        .type(SubTask.TaskType.ANSWER)
                        .requiredAgent("Evaluator"));
                
                tasks.add(SubTask.create("task_" + taskIndex++, "输出报告")
                        .description("输出分析报告")
                        .type(SubTask.TaskType.OUTPUT));
            }
            
            default -> {
                // 通用任务
                tasks.add(SubTask.create("task_" + taskIndex++, "处理请求")
                        .description("处理用户请求")
                        .type(SubTask.TaskType.EXECUTE)
                        .requiredAgent("Companion"));
            }
        }
        
        return tasks;
    }
    
    /**
     * 构建依赖图
     */
    private Map<String, List<String>> buildDependencyGraph(List<SubTask> tasks, IntentUnderstanding intent) {
        Map<String, List<String>> dependencies = new HashMap<>();
        
        // 简单策略：按顺序依赖
        for (int i = 1; i < tasks.size(); i++) {
            List<String> deps = new ArrayList<>();
            // 前一个任务
            deps.add(tasks.get(i - 1).getTaskId());
            dependencies.put(tasks.get(i).getTaskId(), deps);
        }
        
        return dependencies;
    }
    
    /**
     * 拓扑排序
     */
    private List<String> topologicalSort(List<SubTask> tasks, Map<String, List<String>> dependencies) {
        Map<String, SubTask> taskMap = tasks.stream()
                .collect(Collectors.toMap(SubTask::getTaskId, t -> t));
        
        List<String> result = new ArrayList<>();
        Set<String> visited = new HashSet<>();
        Set<String> visiting = new HashSet<>();
        
        for (SubTask task : tasks) {
            if (!visited.contains(task.getTaskId())) {
                topologicalSortDFS(task.getTaskId(), taskMap, dependencies, visited, visiting, result);
            }
        }
        
        return result;
    }
    
    private void topologicalSortDFS(String taskId, Map<String, SubTask> taskMap,
                                    Map<String, List<String>> dependencies,
                                    Set<String> visited, Set<String> visiting, List<String> result) {
        if (visited.contains(taskId)) return;
        if (visiting.contains(taskId)) {
            // 循环依赖，忽略
            log.warn("检测到循环依赖: {}", taskId);
            return;
        }
        
        visiting.add(taskId);
        
        List<String> deps = dependencies.get(taskId);
        if (deps != null) {
            for (String dep : deps) {
                if (taskMap.containsKey(dep)) {
                    topologicalSortDFS(dep, taskMap, dependencies, visited, visiting, result);
                }
            }
        }
        
        visiting.remove(taskId);
        visited.add(taskId);
        result.add(taskId);
    }
    
    /**
     * 分配工具
     */
    private Map<String, List<String>> allocateTools(List<SubTask> tasks, IntentUnderstanding intent) {
        Map<String, List<String>> taskTools = new HashMap<>();
        
        // 根据任务类型分配工具
        for (SubTask task : tasks) {
            List<String> tools = new ArrayList<>();
            
            switch (task.getType()) {
                case RESEARCH -> {
                    tools.add("knowledge_base");
                    tools.add("user_profile");
                    tools.add("web_search");
                }
                case TEACH, ANSWER -> {
                    tools.add("knowledge_base");
                    tools.add("calculator");
                }
                case PLAN -> {
                    tools.add("user_profile");
                    tools.add("datetime");
                }
                case EXECUTE -> {
                    tools.add("code_executor");
                    tools.add("text_processor");
                }
                case EVALUATE -> {
                    tools.add("user_profile");
                    tools.add("knowledge_base");
                    tools.add("calculator");
                }
                default -> {
                    tools.add("text_processor");
                    tools.add("datetime");
                }
            }
            
            taskTools.put(task.getTaskId(), tools);
        }
        
        return taskTools;
    }
}
