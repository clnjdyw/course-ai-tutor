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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 协调智能体 - 增强版 Orchestrator Agent
 * 整合规划引擎、记忆系统和协作协议
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrchestratorAgent extends BaseAgent {

    private final Orchestrator orchestrator;
    private final MemorySystem memorySystem;
    private final AgentMessageBus messageBus;
    private final AgentRegistry agentRegistry;
    private final ToolManager toolManager;

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
            memorySystem.startSession(sessionId, userId);

            var userContext = memorySystem.getUserContext(sessionId, userId);

            OrchestratorResult result = orchestrator.execute(userInput, userId);

            memorySystem.store(sessionId, userId, "conversation",
                    Map.of("content", userInput, "response", result.getResponse()));

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

        var userContext = memorySystem.getUserContext(sessionId, userId);

        StringBuilder enhancedPrompt = new StringBuilder();
        enhancedPrompt.append("用户上下文：\n");
        enhancedPrompt.append(userContext).append("\n\n");
        enhancedPrompt.append("用户请求：").append(userInput);

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
            return future.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            log.error("发送给 Agent {} 失败", agentName, e);
            return AgentMessage.error(getAgentName(), agentName, e.getMessage());
        }
    }

    /**
     * 获取系统状态
     */
    public Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("agents", agentRegistry.getStatistics());
        status.put("memory", memorySystem.getStatistics());
        status.put("tools", toolManager.getStatistics());
        return status;
    }

    /**
     * 分析用户意图
     */
    public IntentUnderstanding analyzeIntent(String userInput, Long userId) {
        PlanningEngine engine = new PlanningEngine();
        return engine.understandIntent(userInput, userId);
    }
}
