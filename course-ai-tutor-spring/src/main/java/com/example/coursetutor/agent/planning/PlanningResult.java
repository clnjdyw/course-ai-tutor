package com.example.coursetutor.agent.planning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 规划引擎 - 负责任务分解和规划
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanningResult {
    
    /** 规划是否成功 */
    private boolean success;
    
    /** 规划ID */
    private String planId;
    
    /** 任务计划 */
    private TaskPlan taskPlan;
    
    /** 意图理解结果 */
    private IntentUnderstanding intent;
    
    /** 执行过程日志 */
    private List<ExecutionLog> logs;
    
    /** 错误信息 */
    private String error;
    
    /** 警告信息 */
    private List<String> warnings;
    
    /** 总执行时间（毫秒） */
    private long totalExecutionTimeMs;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecutionLog {
        private long timestamp;
        private String step;
        private String message;
        private LogLevel level;
        
        public enum LogLevel {
            INFO, WARN, ERROR, DEBUG
        }
    }
    
    /**
     * 创建成功结果
     */
    public static PlanningResult success(String planId, TaskPlan plan, IntentUnderstanding intent) {
        return PlanningResult.builder()
                .success(true)
                .planId(planId)
                .taskPlan(plan)
                .intent(intent)
                .logs(new java.util.ArrayList<>())
                .warnings(new java.util.ArrayList<>())
                .totalExecutionTimeMs(System.currentTimeMillis())
                .build();
    }
    
    /**
     * 创建失败结果
     */
    public static PlanningResult failure(String error) {
        return PlanningResult.builder()
                .success(false)
                .error(error)
                .logs(new java.util.ArrayList<>())
                .warnings(new java.util.ArrayList<>())
                .totalExecutionTimeMs(System.currentTimeMillis())
                .build();
    }
    
    /**
     * 添加日志
     */
    public void addLog(String step, String message, ExecutionLog.LogLevel level) {
        if (logs == null) {
            logs = new java.util.ArrayList<>();
        }
        logs.add(ExecutionLog.builder()
                .timestamp(System.currentTimeMillis())
                .step(step)
                .message(message)
                .level(level)
                .build());
    }
    
    /**
     * 添加警告
     */
    public void addWarning(String warning) {
        if (warnings == null) {
            warnings = new java.util.ArrayList<>();
        }
        warnings.add(warning);
    }
}
