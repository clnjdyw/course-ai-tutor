package com.example.coursetutor.agent.orchestrator;

import com.example.coursetutor.agent.planning.PlanningResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 协调器执行结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrchestratorResult {
    
    /** 请求ID */
    private String requestId;
    
    /** 用户输入 */
    private String userInput;
    
    /** 用户ID */
    private Long userId;
    
    /** 是否成功 */
    private boolean success;
    
    /** 最终响应 */
    private String response;
    
    /** 错误信息 */
    private String error;
    
    /** 规划结果 */
    private PlanningResult planningResult;
    
    /** 执行日志 */
    private List<LogEntry> logs;
    
    /** 总执行时间（毫秒） */
    private long totalExecutionTimeMs;
    
    /** 警告 */
    private List<String> warnings;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogEntry {
        private long timestamp;
        private String phase;
        private String message;
        private LogLevel level;
        
        public enum LogLevel {
            INFO, WARN, ERROR, DEBUG
        }
    }
    
    /**
     * 添加日志
     */
    public void addLog(String phase, String message, LogLevel level) {
        if (logs == null) {
            logs = new ArrayList<>();
        }
        logs.add(LogEntry.builder()
                .timestamp(System.currentTimeMillis())
                .phase(phase)
                .message(message)
                .level(level)
                .build());
    }
    
    /**
     * 获取任务数量
     */
    public int getTaskCount() {
        if (planningResult == null || planningResult.getTaskPlan() == null) {
            return 0;
        }
        return planningResult.getTaskPlan().getSubTasks().size();
    }
    
    /**
     * 获取已完成任务数
     */
    public int getCompletedTaskCount() {
        if (planningResult == null || planningResult.getTaskPlan() == null) {
            return 0;
        }
        return (int) planningResult.getTaskPlan().getSubTasks().stream