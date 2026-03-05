package com.example.coursetutor.agent;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * 智能体基类
 */
@Slf4j
public abstract class BaseAgent {
    
    @Autowired
    protected ChatClient chatClient;
    
    /**
     * 调用 AI 模型
     */
    protected String callWithPrompt(String systemPrompt, String userPrompt) {
        log.debug("调用 AI 模型，system: {}, user: {}", systemPrompt.length(), userPrompt.length());
        
        return chatClient.prompt()
            .system(systemPrompt)
            .user(userPrompt)
            .call()
            .content();
    }
    
    /**
     * 获取智能体名称
     */
    public abstract String getAgentName();
    
    /**
     * 获取智能体描述
     */
    public abstract String getAgentDescription();
    
    /**
     * 获取智能体类型
     */
    public abstract AgentType getAgentType();
    
    public enum AgentType {
        PLANNER("规划智能体"),
        TUTOR("教学智能体"),
        HELPER("答疑智能体"),
        EVALUATOR("评估智能体"),
        COMPANION("陪伴智能体"),
        MANAGER("管理智能体");
        
        private final String description;
        
        AgentType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
