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
    
    @Autowired
    protected AgentProperties agentProperties;
    
    /**
     * 调用 AI 模型
     */
    protected String callWithPrompt(String prompt) {
        log.debug("调用 AI 模型，prompt 长度：{}", prompt.length());
        
        return chatClient.prompt()
            .user(prompt)
            .call()
            .content();
    }
    
    /**
     * 调用 AI 模型（带系统提示）
     */
    protected String callWithSystemPrompt(String systemPrompt, String userPrompt) {
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
}
