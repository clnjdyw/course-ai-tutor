package com.example.coursetutor.agent.orchestrator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 协调器状态
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrchestratorStatus {
    
    /** 状态 */
    private String status;
    
    /** 活跃任务数 */
    private int activeTasks;
    
    /** 已完成任务数 */
    private int completedTasks;
    
    /** 失败任务数 */
    private int failedTasks;
    
    /** 总任务数 */
    private int totalTasks;
    
    /** 时间戳 */
    private long timestamp;
    
    /** 内存使用情况 */
    private Map<String, Object> memoryUsage;
    
    /** 性能指标 */
    private Map<String, Object> metrics;
}
