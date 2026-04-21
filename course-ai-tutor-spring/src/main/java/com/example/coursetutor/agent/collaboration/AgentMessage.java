package com.example.coursetutor.agent.collaboration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Agent 间通信消息协议
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentMessage implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /** 消息ID */
    private String messageId;
    
    /** 源 Agent */
    private String sourceAgent;
    
    /** 目标 Agent (null 表示广播) */
    private String targetAgent;
    
    /** 消息类型 */
    private MessageType type;
    
    /** 消息内容 */
    private Object payload;
    
    /** 元数据 */
    private Map<String, Object> metadata;
    
    /** 时间戳 */
    private LocalDateTime timestamp;
    
    /** 会话ID */
    private String sessionId;
    
    /** 优先级 */
    private Priority priority;
    
    /** 关联的请求ID */
    private String requestId;
    
    public enum MessageType {
        // 任务相关
        TASK_REQUEST,      // 任务请求
        TASK_RESPONSE,     // 任务响应
        TASK_PROGRESS,     // 任务进度
        TASK_COMPLETE,     // 任务完成
        TASK_CANCEL,       // 任务取消
        
        // 查询相关
        QUERY,             // 查询请求
        QUERY_RESPONSE,    // 查询响应
        
        // 通知相关
        NOTIFY,            // 通知
        BROADCAST,         // 广播
        
        // 结果相关
        RESULT,            // 结果
        ERROR,             // 错误
        
        // 心跳
        PING,              // 心跳
        PONG               // 心跳响应
    }
    
    public enum Priority {
        HIGH(1),     // 高优先级
        NORMAL(2),    // 普通优先级
        LOW(3);       // 低优先级
        
        private final int value;
        Priority(int value) { this.value = value; }
        public int getValue() { return value; }
    }
    
    /**
     * 创建消息
     */
    public static AgentMessage create(String source, String target, MessageType type, Object payload) {
        return AgentMessage.builder()
                .messageId(UUID.randomUUID().toString())
                .sourceAgent(source)
                .targetAgent(target)
                .type(type)
                .payload(payload)
                .timestamp(LocalDateTime.now())
                .priority(Priority.NORMAL)
                .build();
    }
    
    /**
     * 创建广播消息
     */
    public static AgentMessage broadcast(String source, MessageType type, Object payload) {
        return AgentMessage.builder()
                .messageId(UUID.randomUUID().toString())
                .sourceAgent(source)
                .targetAgent(null)  // 广播
                .type(type)
                .payload(payload)
                .timestamp(LocalDateTime.now())
                .priority(Priority.NORMAL)
                .build();
    }
    
    /**
     * 创建任务请求
     */
    public static AgentMessage taskRequest(String source, String target, Object task) {
        return create(source, target, MessageType.TASK_REQUEST, task);
    }
    
    /**
     * 创建任务响应
     */
    public static AgentMessage taskResponse(String source, String target, Object result) {
        return create(source, target, MessageType.TASK_RESPONSE, result);
    }
    
    /**
     * 创建错误消息
     */
    public static AgentMessage error(String source, String target, String errorMessage) {
        return create(source, target, MessageType.ERROR, Map.of("error", errorMessage));
    }
    
    /**
     * 是否是广播
     */
    public boolean isBroadcast() {
        return targetAgent == null;
    }
    
    /**
     * 获取响应ID
     */
    public String getResponseId() {
        return messageId + "_response";
    }
    
    /**
     * 添加元数据
     */
    public AgentMessage addMetadata(String key, Object value) {
        if (metadata == null) {
            metadata = new java.util.HashMap<>();
        }
        metadata.put(key, value);
        return this;
    }
    
    /**
     * 获取元数据
     */
    @SuppressWarnings("unchecked")
    public <T> T getMetadata(String key) {
        return metadata != null ? (T) metadata.get(key) : null;
    }
}
