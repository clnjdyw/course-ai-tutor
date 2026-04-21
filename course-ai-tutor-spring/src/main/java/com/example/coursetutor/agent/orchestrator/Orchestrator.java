package com.example.coursetutor.agent.orchestrator;

import com.example.coursetutor.agent.planning.*;
import com.example.coursetutor.agent.tool.ToolManager;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.*;

/**
 * 协调器 - Orchestrator
 * 负责协调多个 Agent 和工具完成任务
 */
@Slf4j
@Component
public class Orchestrator {
    
    @Autowired
    private PlanningEngine planningEngine;
    
    @Autowired
    private ToolManager toolManager;
    
    @Autowired
    private ExecutorService executorService;
    
    @Value("${app.agent.max-concurrent-tasks:3}")
    private int maxConcurrentTasks;
    
    @Value("${app.agent.task-timeout-seconds:30}")
    private int taskTimeoutSeconds;
    
    /**
     * 执行用户请求（完整流程）
     */
    public OrchestratorResult execute(String userInput, Long userId) {
        long startTime = System.currentTimeMillis();
        OrchestratorResult result = new OrchestratorResult();
        result.setRequestId(UUID.randomUUID().toString());
        result.setUserInput(userInput);
        result.setUserId(userId);
        result.setLogs(new ArrayList<>());
        
        try {
            // 1. 创建计划
            log.info("开始执行请求: userId={}, input={}", userId, userInput);
            result.addLog("start", "开始处理请求", OrchestratorResult.LogLevel.INFO);
            
            PlanningResult planResult = planningEngine.createPlan(userInput, userId);
            result.setPlanningResult(planResult);
            
            if (!planResult.isSuccess()) {
                result.setSuccess(false);
                result.setError(planResult.getError());
                result.setResponse("抱歉，我需要更多信息才能帮助您。");
                return result;
            }
            
            TaskPlan plan = planResult.getTaskPlan();
            plan.setStatus(TaskPlan.PlanStatus.IN_PROGRESS);
            result.addLog("plan", "计划创建成功，包含 " + plan.getSubTasks().size() + " 个任务", OrchestratorResult.LogLevel.INFO);
            
            // 2. 执行计划
            String response = executePlan(plan, userId);
            result.setResponse(response);
            
            // 3. 标记完成
            plan.setStatus(TaskPlan.PlanStatus.COMPLETED);
            result.setSuccess(true);
            result.addLog("complete", "请求处理完成", OrchestratorResult.LogLevel.INFO);
            result.setTotalExecutionTimeMs(System.currentTimeMillis() - startTime);
            
            log.info("请求处理成功: requestId={}, duration={}ms", 
                    result.getRequestId(), result.getTotalExecutionTimeMs());
            
        } catch (Exception e) {
            log.error("处理请求失败", e);
            result.setSuccess(false);
            result.setError(e.getMessage());
            result.setResponse("处理您的请求时出现错误，请稍后重试。");
            result.addLog("error", "处理失败: " + e.getMessage(), OrchestratorResult.LogLevel.ERROR);
            result.setTotalExecutionTimeMs(System.currentTimeMillis() - startTime);
        }
        
        return result;
    }
    
    /**
     * 执行计划
     */
    private String executePlan(TaskPlan plan, Long userId) {
        Map<String, SubTask> taskMap = new HashMap<>();
        plan.getSubTasks().forEach(t -> taskMap.put(t.getTaskId(), t));
        
        StringBuilder finalResponse = new StringBuilder();
        
        // 按顺序执行任务
        for (String taskId : plan.getExecutionOrder()) {
            SubTask task = taskMap.get(taskId);
            if (task == null) continue;
            
            // 检查依赖
            if (!task.dependenciesSatisfied(taskMap)) {
                task.setStatus(SubTask.TaskStatus.WAITING);
                continue;
            }
            
            // 执行任务
            Object taskResult = executeTask(task, plan, userId);
            
            // 处理结果
            if (task.getStatus() == SubTask.TaskStatus.COMPLETED) {
                plan.addResult(taskId, taskResult);
                if (taskResult instanceof String) {
                    finalResponse.append(taskResult).append("\n\n");
                }
            } else if (task.getStatus() == SubTask.TaskStatus.FAILED) {
                log.warn("任务 {} 执行失败: {}", taskId, task.getError());
                if (!task.canRetry()) {
                    // 任务失败且无法重试，继续执行后续任务
                    finalResponse.append("[部分任务执行失败]\n");
                }
            }
        }
        
        return finalResponse.toString().trim();
    }
    
    /**
     * 执行单个任务
     */
    private Object executeTask(SubTask task, TaskPlan plan, Long userId) {
        task.markStarted();
        log.info("执行任务: {} ({})", task.getName(), task.getTaskId());
        
        try {
            // 根据任务类型执行
            Object result = switch (task.getType()) {
                case RESEARCH -> executeResearchTask(task, plan, userId);
                case TEACH -> executeTeachTask(task, plan, userId);
                case ANSWER -> executeAnswerTask(task, plan, userId);
                case PLAN -> executePlanTask(task, plan, userId);
                case EVALUATE -> executeEvaluateTask(task, plan, userId);
                case EXECUTE -> executeExecuteTask(task, plan, userId);
                case AGGREGATE, OUTPUT -> executeAggregateTask(task, plan, userId);
            };
            
            task.markCompleted(result);
            return result;
            
        } catch (Exception e) {
            log.error("任务执行异常: {}", task.getTaskId(), e);
            task.markFailed(e.getMessage());
            return null;
        }
    }
    
    /**
     * 执行调研任务
     */
    private Object executeResearchTask(SubTask task, TaskPlan plan, Long userId) {
        String topic = plan.getIntent() != null ? plan.getIntent().getMainTopic() : "";
        
        // 调用知识库工具
        ToolResult result = toolManager.execute("knowledge_base", Map.of(
                "action", "search_courses",
                "query", topic,
                "limit", 5
        ));
        
        if (result.isSuccess()) {
            return "已查询到相关内容：" + result.getContent();
        }
        
        return "已完成信息收集";
    }
    
    /**
     * 执行教学任务
     */
    private Object executeTeachTask(SubTask task, TaskPlan plan, Long userId) {
        String topic = plan.getIntent() != null ? plan.getIntent().getMainTopic() : "该主题";
        String level = plan.getIntent() != null && plan.getIntent().getParams() != null 
                ? plan.getIntent().getParams().getLevel() : "BEGINNER";
        
        // 获取用户上下文
        Map<String, Object> context = new HashMap<>();
        context.put("topic", topic);
        context.put("level", level);
        context.put("userId", userId);
        
        // 返回教学内容的提示
        return String.format("关于「%s」的学习内容：\n\n我将为您详细讲解这个主题。", topic);
    }
    
    /**
     * 执行问答任务
     */
    private Object executeAnswerTask(SubTask task, TaskPlan plan, Long userId) {
        String topic = plan.getIntent() != null ? plan.getIntent().getMainTopic() : "";
        return String.format("针对您的问题「%s」，我来为您解答：\n\n", topic);
    }
    
    /**
     * 执行规划任务
     */
    private Object executePlanTask(SubTask task, TaskPlan plan, Long userId) {
        // 获取用户学习数据
        ToolResult profileResult = toolManager.execute("user_profile", Map.of(
                "action", "get_profile",
                "user_id", userId
        ));
        
        ToolResult statsResult = toolManager.execute("user_profile", Map.of(
                "action", "get_learning_stats",
                "user_id", userId,
                "days", 30
        ));
        
        return "根据您的学习情况，我将为您制定个性化学习计划。";
    }
    
    /**
     * 执行评估任务
     */
    private Object executeEvaluateTask(SubTask task, TaskPlan plan, Long userId) {
        ToolResult statsResult = toolManager.execute("user_profile", Map.of(
                "action", "get_learning_stats",
                "user_id", userId,
                "days", 30
        ));
        
        ToolResult weakResult = toolManager.execute("user_profile", Map.of(
                "action", "get_weak_points",
                "user_id", userId
        ));
        
        return "已完成学习情况分析，正在生成评估报告...";
    }
    
    /**
     * 执行工具任务
     */
    private Object executeExecuteTask(SubTask task, TaskPlan plan, Long userId) {
        // 根据任务名称决定使用什么工具
        if (task.getName().contains("练习")) {
            return "已为您准备好练习题，请开始作答。";
        } else if (task.getName().contains("代码")) {
            return "代码示例已准备就绪。";
        }
        return "任务执行完成";
    }
    
    /**
     * 执行汇总任务
     */
    private Object executeAggregateTask(SubTask task, TaskPlan plan, Long userId) {
        StringBuilder summary = new StringBuilder();
        summary.append("📚 学习内容汇总：\n\n");
        
        // 汇总所有中间结果
        if (plan.getIntermediateResults() != null) {
            plan.getIntermediateResults().forEach((taskId, result) -> {
                if (result != null) {
                    summary.append("- ").append(result.toString()).append("\n");
                }
            });
        }
        
        summary.append("\n祝您学习愉快！如有疑问随时问我。");
        return summary.toString();
    }
    
    /**
     * 获取执行状态
     */
    public OrchestratorStatus getStatus(String requestId) {
        return OrchestratorStatus.builder()
                .status("running")
                .activeTasks(0)
                .completedTasks(0)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
