package com.example.coursetutor.agent.planning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 任务计划 - 规划引擎的输出
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskPlan {
    
    /** 计划ID */
    private String planId;
    
    /** 用户目标 */
    private String goal;
    
    /** 分解后的子任务 */
    private List<SubTask> subTasks;
    
    /** 任务依赖图（任务ID -> 依赖的任务ID） */
    private Map<String, List<String>> dependencies;
    
    /** 任务 -> 工具映射 */
    private Map<String, List<String>> taskTools;
    
    /** 执行顺序 */
    private List<String> executionOrder;
    
    /** 预计总时间（秒） */
    private int estimatedDurationSeconds;
    
    /** 创建时间戳 */
    private long createdAt;
    
    /** 状态 */
    private PlanStatus status;
    
    /** 中间结果 */
    private Map<String, Object> intermediateResults;
    
    public enum PlanStatus {
        CREATED,      // 创建
        IN_PROGRESS,  // 执行中
        COMPLETED,    // 完成
        FAILED,       // 失败
        CANCELLED     // 取消
    }
    
    /**
     * 添加中间结果
     */
    public void addResult(String taskId, Object result) {
        if (intermediateResults == null) {
            intermediateResults = new java.util.HashMap<>();
        }
        intermediateResults.put(taskId, result);
    }
    
    /**
     * 获取中间结果
     */
    public Object getResult(String taskId) {
        return intermediateResults != null ? intermediateResults.get(taskId) : null;
    }
    
    /**
     * 检查是否完成
     */
    public boolean isCompleted() {
        return status == PlanStatus.COMPLETED;
    }
    
    /**
     * 获取下一个待执行任务
     */
    public SubTask getNextTask() {
        if (subTasks == null || executionOrder == null) {
            return null;
        }
        
        for (String taskId : executionOrder) {
            for (SubTask task : subTasks) {
                if (task.getTaskId().equals(taskId) && task.getStatus() == SubTask.TaskStatus.PENDING) {
                    return task;
                }
            }
        }
        return null;
    }
}
