package com.example.coursetutor.agent;

import com.example.coursetutor.agent.collaboration.AgentMessage;
import com.example.coursetutor.agent.collaboration.AgentMessageBus;
import com.example.coursetutor.agent.collaboration.AgentRegistry;
import com.example.coursetutor.agent.memory.MemorySystem;
import com.example.coursetutor.agent.orchestrator.Orchestrator;
import com.example.coursetutor.agent.orchestrator.OrchestratorResult;
import com.example.coursetutor.agent.planning.IntentUnderstanding;
import com.example.coursetutor.agent.planning.PlanningEngine;
import com.example.coursetutor.agent.tool.ToolManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 协调智能体 - 增强版 Orchestrator Agent
 * 整合规划引擎、记忆系统和协作协议
 */
@Slf4j
@Component
public class OrchestratorAgent extends BaseAgent {
    
    @Autowired
    private Orchestrator orchestrator;
    
    @Autowired
    private MemorySystem memorySystem;
    
    @Autowired
    private AgentMessageBus messageBus;
    
    @Autowired
    private AgentRegistry agentRegistry;
    
    @Autowired
    private ToolManager toolManager;
    
    /** 系统提示词 */
    private static final String SYSTEM_PROMPT = """
            你是一个智能学习助手的中枢协调器。
            你的职责：
            1. 理解用户的真实需求
            2. 规划任务执行步骤
            3. 协调多个子智能体完成任务
            4. 整合结果并给出最终回答
            
            核心原则：
            - 始终以用户的最佳利益为出发点
            - 提供个性化、有针对性的帮助
            - 主动识别用户可能的困难并提供支持
            - 保持友好、耐心、鼓励的态度
            """;
    
    @Override
    public String getAgentName() {
        return "Orchestrator";
    }
    
    @Override
    public String getAgentDescription() {
        return "协调智能体，负责理解用户需求、规划任务、协调子智能体";
    }
    
    @Override
    public AgentType getAgentType() {
        return AgentType.ORCHESTRATOR;
    }
    
    /**
     * 处理用户请求（核心方法）
     */
    public String handleRequest(String userInput, Long userId, String sessionId) {
        log.info("Orchestrator 处理请求: userId={}, input={}", userId, userInput);
        
        try {
            // 1. 开始会话
            memorySystem.startSession(sessionId, userId);
            
            // 2. 获取用户上下文
            var userContext = memorySystem.getUserContext(sessionId, userId);
            
            // 3. 使用协调器执行任务
            OrchestratorResult result = orchestrator.execute(userInput, userId);
            
            // 4. 存储对话历史
            memorySystem.store(sessionId, userId, "conversation", 
                    java.util.Map.of("content", userInput, "response", result.getResponse()));
            
            // 5. 返回结果
            return result.getResponse();
            
        } catch (Exception e) {
            log.error("处理请求失败", e);
            return "抱歉，处理您的请求时出现了一些问题。请稍后重试。";
        }
    }
    
    /**
     * 处理用户请求（带工具调用）
     */
    public String handleRequestWithTools(String userInput, Long userId, String sessionId) {
        log.info("Orchestrator 处理请求（工具版）: userId={}", userId);
        
        // 获取用户上下文
        var userContext = memorySystem.getUserContext(sessionId, userId);
        
        // 构建增强提示词
        StringBuilder enhancedPrompt = new StringBuilder();
        enhancedPrompt.append("用户上下文：\n");
        enhancedPrompt.append(userContext).append("\n\n");
        enhancedPrompt.append("用户请求：").append(userInput);
        
        // 调用带工具的 LLM
        return callWithTools(SYSTEM_PROMPT, enhancedPrompt.toString(), userContext);
    }
    
    /**
     * 广播任务给多个 Agent
     */
    public void broadcastTask(String taskType, Object payload) {
        AgentMessage message = AgentMessage.broadcast(
                getAgentName(),
                AgentMessage.MessageType.TASK_REQUEST,
                payload
        );
        messageBus.publish(message);
        log.info("广播任务: type={}", taskType);
    }
    
    /**
     * 发送任务给特定 Agent
     */
    public AgentMessage sendTaskToAgent(String agentName, Object task, long timeoutMs) {
        AgentMessage message = AgentMessage.taskRequest(
                getAgentName(),
                agentName,
                task
        );
        
        try {
            var future = messageBus.sendAndWait(message, timeoutMs);
            return future.get(timeoutMs, java.util.concurrent.TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.error("发送给 Agent {} 失败", agentName, e);
            return AgentMessage.error(getAgentName(), agentName, e.getMessage());
        }
    }
    
    /**
     * 获取系统状态
     */
    public Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new java.util.HashMap<>();
        status.put("agents", agentRegistry.getStatistics());
        status.put("memory", memorySystem.getStatistics());
        status.put("tools", toolManager.getStatistics());
        return status;
    }
    
    /**
     * 分析用户意图
     */
    public IntentUnderstanding analyzeIntent(String userInput, Long userId) {
        // 使用规划引擎的意图理解
        PlanningEngine engine = new PlanningEngine();
        // 注意：这里需要注入依赖，实际使用中