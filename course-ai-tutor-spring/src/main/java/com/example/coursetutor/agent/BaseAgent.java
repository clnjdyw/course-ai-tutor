package com.example.coursetutor.agent;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolManager;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.ChatMemory;
import org.springframework.ai.chat.client.advisor.ChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleChatAdvisor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 智能体基类 - 支持工具调用的增强版本
 */
@Slf4j
public abstract class BaseAgent {
    
    @Autowired
    protected ChatClient chatClient;
    
    @Autowired
    private ToolManager toolManager;
    
    @Value("${app.agent.max-tool-calls:10}")
    private int maxToolCalls;
    
    protected ChatMemory chatMemory;
    
    /**
     * 调用 AI 模型（基础版）
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
     * 调用 AI 模型（带工具调用版）
     * 这是核心增强：支持 LLM 动态调用工具
     */
    protected String callWithTools(String systemPrompt, String userPrompt) {
        return callWithTools(systemPrompt, userPrompt, null);
    }
    
    /**
     * 调用 AI 模型（带工具调用和上下文）
     */
    protected String callWithTools(String systemPrompt, String userPrompt, Map<String, Object> context) {
        log.info("调用 AI 模型（工具版），system: {}, user: {}", systemPrompt.length(), userPrompt.length());
        
        try {
            // 构建提示词
            StringBuilder fullPrompt = new StringBuilder();
            if (context != null && !context.isEmpty()) {
                fullPrompt.append("上下文信息:\n");
                context.forEach((k, v) -> fullPrompt.append("- ").append(k).append(": ").append(v).append("\n"));
                fullPrompt.append("\n");
            }
            fullPrompt.append("用户请求: ").append(userPrompt);
            
            // 获取可用工具
            List<Tool> availableTools = toolManager.getAllTools();
            List<Map<String, Object>> functionSchemas = toolManager.getFunctionSchemas();
            
            if (availableTools.isEmpty()) {
                log.warn("没有可用的工具，回退到基础调用");
                return callWithPrompt(systemPrompt, fullPrompt.toString());
            }
            
            // 构建工具描述
            String toolDescriptions = buildToolDescriptions(availableTools);
            String enhancedSystemPrompt = systemPrompt + "\n\n可用工具:\n" + toolDescriptions;
            
            // 执行带工具的调用
            return executeWithToolLoop(enhancedSystemPrompt, fullPrompt.toString(), functionSchemas);
            
        } catch (Exception e) {
            log.error("工具调用失败，回退到基础调用", e);
            return callWithPrompt(systemPrompt, userPrompt);
        }
    }
    
    /**
     * 执行工具调用循环（ReAct 模式简化版）
     */
    private String executeWithToolLoop(String systemPrompt, String userPrompt, 
                                        List<Map<String, Object>> functionSchemas) {
        
        StringBuilder conversationHistory = new StringBuilder();
        conversationHistory.append("用户: ").append(userPrompt).append("\n\n");
        
        String assistantResponse = null;
        int iteration = 0;
        
        while (iteration < maxToolCalls) {
            iteration++;
            log.debug("工具调用循环，迭代: {}", iteration);
            
            try {
                // 调用 LLM
                String response = chatClient.prompt()
                        .system(systemPrompt + "\n\n对话历史:\n" + conversationHistory)
                        .user("请根据对话历史和上下文，回答用户问题或调用工具。")
                        .functions(functionSchemas.toArray(new Map[0]))
                        .call()
                        .content();
                
                if (response == null || response.trim().isEmpty()) {
                    // 没有更多工具调用，返回当前结果
                    return conversationHistory.toString().contains("助手:") 
                            ? extractLastAssistantMessage(conversationHistory.toString())
                            : "处理完成";
                }
                
                conversationHistory.append("助手: ").append(response).append("\n\n");
                
                // 检查是否包含函数调用结果
                if (response.contains("tool_result:") || response.contains("工具执行结果:")) {
                    // 解析工具结果并继续
                    String toolResult = extractToolResult(response);
                    if (toolResult != null) {
                        conversationHistory.append("工具输出: ").append(toolResult).append("\n\n");
                    }
                }
                
                // 如果看起来是最终回答，结束循环
                if (isLikelyFinalAnswer(response) && !containsToolCalls(response)) {
                    return response;
                }
                
            } catch (Exception e) {
                log.error("迭代 {} 出错", iteration, e);
                break;
            }
        }
        
        // 返回累积的结果
        return extractLastAssistantMessage(conversationHistory.toString());
    }
    
    /**
     * 直接调用单个工具
     */
    protected ToolResult callTool(String toolName, Map<String, Object> params) {
        log.info("直接调用工具: {}", toolName);
        return toolManager.execute(toolName, params);
    }
    
    /**
     * 获取用户上下文信息
     */
    protected Map<String, Object> getUserContext(Long userId) {
        Map<String, Object> context = new HashMap<>();
        
        try {
            // 调用用户画像工具获取上下文
            ToolResult result = callTool("user_profile", Map.of(
                    "action", "get_profile",
                    "user_id", userId
            ));
            
            if (result.isSuccess()) {
                context.put("userProfile", result.getContent());
            }
            
            // 获取学习统计
            ToolResult statsResult = callTool("user_profile", Map.of(
                    "action", "get_learning_stats",
                    "user_id", userId,
                    "days", 30
            ));
            
            if (statsResult.isSuccess()) {
                context.put("learningStats", statsResult.getContent());
            }
            
            context.put("timestamp", java.time.LocalDateTime.now());
            
        } catch (Exception e) {
            log.warn("获取用户上下文失败", e);
        }
        
        return context;
    }
    
    /**
     * 搜索知识库
     */
    protected ToolResult searchKnowledge(String query, int limit) {
        return callTool("knowledge_base", Map.of(
                "action", "search_courses",
                "query", query,
                "limit", limit
        ));
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
    
    /**
     * 构建工具描述文本
     */
    private String buildToolDescriptions(List<Tool> tools) {
        return tools.stream()
                .map(tool -> String.format("- %s: %s (参数: %s)",
                        tool.getName(),
                        tool.getDescription(),
                        tool.getParametersSchema()))
                .collect(Collectors.joining("\n"));
    }
    
    /**
     * 提取工具执行结果
     */
    private String extractToolResult(String response) {
        // 简单提取，实际可使用正则
        int start = response.indexOf("tool_result:");
        if (start < 0) start = response.indexOf("工具执行结果:");
        if (start < 0) return null;
        
        int end = response.indexOf("\n", start);
        if (end < 0) end = response.length();
        
        return response.substring(start, end).trim();
    }
    
    /**
     * 检查是否包含工具调用
     */
    private boolean containsToolCalls(String response) {
        return response.contains("function_call") || 
               response.contains("tool_call") ||
               response.contains("调用工具") ||
               response.contains("execute");
    }
    
    /**
     * 判断是否可能是最终回答
     */
    private boolean isLikelyFinalAnswer(String response) {
        // 简单判断：回答长度适中，不包含明显的工具调用意图
        return response.length() > 20 && !response.contains("需要调用工具");
    }
    
    /**
     * 提取最后一条助手消息
     */
    private String extractLastAssistantMessage(String history) {
        int lastIndex = history.lastIndexOf("助手:");
        if (lastIndex < 0) return history;
        
        String message = history.substring(lastIndex + 3).trim();
        int nextNewline = message.indexOf("\n\n");
        if (nextNewline > 0) {
            message = message.substring(0, nextNewline).trim();
        }
        return message;
    }
    
    public enum AgentType {
        PLANNER("规划智能体"),
        TUTOR("教学智能体"),
        HELPER("答疑智能体"),
        EVALUATOR("评估智能体"),
        COMPANION("陪伴智能体"),
        MANAGER("管理智能体"),
        ORCHESTRATOR("协调智能体");
        
        private final String description;
        
        AgentType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
