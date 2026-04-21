package com.example.coursetutor.agent.planning;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 用户意图理解结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntentUnderstanding {
    
    /** 原始用户输入 */
    private String originalInput;
    
    /** 识别的意图类型 */
    private IntentType intentType;
    
    /** 置信度 (0-1) */
    private double confidence;
    
    /** 提取的关键实体 */
    private List<Entity> entities;
    
    /** 意图参数 */
    private IntentParams params;
    
    /** 补充说明 */
    private String clarification;
    
    /** 是否需要追问 */
    private boolean needsClarification;
    
    /** 问题列表（需要追问时） */
    private List<String> questions;
    
    public enum IntentType {
        TEACH,           // 教学请求
        QUESTION,        // 问答请求
        PLAN,            // 规划请求
        EVALUATE,        // 评估请求
        CHAT,            // 聊天交流
        ANALYZE,         // 分析请求
        PREPARE,         // 准备/创建请求
        EXPLAIN,         // 解释请求
        HELP,            // 求助请求
        UNKNOWN          // 未知
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Entity {
        private String type;      // entity, concept, person, etc.
        private String value;
        private double confidence;
        private String mention;   // 原文中的提及
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntentParams {
        private Long userId;
        private String topic;           // 主题
        private String level;           // 难度级别
        private String subject;          // 学科
        private String timeRange;       // 时间范围
        private String goal;             // 目标
        private String currentLevel;    // 当前水平
        private String availableTime;    // 可用时间
        private String preferences;     // 偏好
        private String context;         // 上下文
    }
    
    /**
     * 检查意图是否明确
     */
    public boolean isClear() {
        return confidence >= 0.7 && !needsClarification;
    }
    
    /**
     * 获取主要主题
     */
    public String getMainTopic() {
        if (params != null && params.getTopic() != null) {
            return params.getTopic();
        }
        if (entities != null && !entities.isEmpty()) {
            return entities.get(0).getValue();
        }
        return originalInput;
    }
}
