package com.example.coursetutor.agent.tool;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 工具执行结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToolResult {
    
    private boolean success;
    private String content;
    private String error;
    private Map<String, Object> metadata;
    private long executionTimeMs;
    private LocalDateTime timestamp;
    
    public static ToolResult success(String content) {
        return ToolResult.builder()
                .success(true)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ToolResult success(String content, Map<String, Object> metadata) {
        return ToolResult.builder()
                .success(true)
                .content(content)
                .metadata(metadata)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ToolResult error(String errorMessage) {
        return ToolResult.builder()
                .success(false)
                .error(errorMessage)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static ToolResult error(Exception e) {
        return ToolResult.builder()
                .success(false)
                .error(e.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public ToolResult withExecutionTime(long ms) {
        this.executionTimeMs = ms;
        return this;
    }
}
