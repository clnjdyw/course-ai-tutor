package com.example.coursetutor.agent.planning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 子任务 - 任务计划的组成单元
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubTask {
    
    /** 任务ID */
    private String taskId;
    
    /** 任务名称 */
    private String name;
    
    /** 任务描述 */
    private String description;
    
    /** 任务类型 */
    private TaskType type;
    
    /** 状态 */
    private TaskStatus status;
    
    /** 优先级 (1-5, 1最高) */
    private int priority;
    
    /** 需要的工具 */
    private List<String> requiredTools;
    
    /** 需要的 Agent */
    private String requiredAgent;
    
    /** 输入参数 */
    private Map<String, Object> input;
    
    /** 依赖的任务 */
    private List<String> dependencies;
    
    /** 执行结果 */
    private Object result;
    
    /** 错误信息 */
    private String error;
    
    /** 重试次数 */
    private int retryCount;
    
    /** 最大重试次数 */
    private int maxRetries;
    
    /** 预计执行时间（秒） */
    private int estimatedDurationSeconds;
    
    /** 实际执行时间（毫秒） */
    private long actualDurationMs;
    
    /** 创建时间 */
    private long createdAt;
    
    /** 开始执行时间 */
    private long startedAt;
    
    /** 完成时间 */
    private long completedAt;
    
    public enum TaskType {
        RESEARCH,    // 调研/搜索
        TEACH,       // 教学/讲解
        ANSWER,      // 回答问题
        EVALUATE,    // 评估/分析
        PLAN,        // 规划/制定计划
        EXECUTE,     // 执行工具
        AGGREGATE,   // 汇总/整合
        OUTPUT       // 输出结果
    }
    
    public enum TaskStatus {
        PENDING,      // 待执行
        IN_PROGRESS,  // 执行中
        COMPLETED,    // 完成
        FAILED,       // 失败
        SKIPPED,      // 跳过
        WAITING       // 等待依赖
    }
    
    /**
     * 检查是否可以执行
     */
    public boolean canExecute() {
        return status == TaskStatus.PENDING || status == TaskStatus.WAITING;
    }
    
    /**
     * 检查依赖是否满足
     */
    public boolean dependenciesSatisfied(Map<String, SubTask> allTasks) {
        if (dependencies == null || dependencies.isEmpty()) {
            return true;
        }
        
        for (String depId : dependencies) {
            SubTask dep = allTasks.get(depId);
            if (dep == null || dep.getStatus() != TaskStatus.COMPLETED) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * 标记开始执行
     */
    public void markStarted() {
        this.status = TaskStatus.IN_PROGRESS;
        this.startedAt = System.currentTimeMillis();
    }
    
    /**
     * 标记完成
     */
    public void markCompleted(Object result) {
        this.status = TaskStatus.COMPLETED;
        this.result = result;
        this.completedAt = System.currentTimeMillis();
        this.actualDurationMs = this.completedAt - this.startedAt;
    }
    
    /**
     * 标记失败
     */
    public void markFailed(String error) {
        this.status = TaskStatus.FAILED;
        this.error = error;
        this.completedAt = System.currentTimeMillis();
        this.actualDurationMs = this.completedAt - this.startedAt;
    }
    
    /**
     * 是否可以重试
     */
    public boolean canRetry() {
        return retryCount < maxRetries;
    }
    
    /**
     * 增加重试次数
     */
    public void incrementRetry() {
        this.retryCount++;
    }
    
    /**
     * 创建子任务构建器
     */
    public static SubTaskBuilder create(String taskId, String name) {
        return SubTask.builder()
                .taskId(taskId)
                .name(name)
                .status(TaskStatus.PENDING)
                .priority(3)
                .maxRetries(3)
                .retryCount(0)
                .createdAt(System.currentTimeMillis());
    }
}
