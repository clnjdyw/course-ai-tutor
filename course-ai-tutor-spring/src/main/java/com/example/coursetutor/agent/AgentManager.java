package com.example.coursetutor.agent;

import com.example.coursetutor.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * 智能体管理器 - 协调和管理所有智能体
 */
@Slf4j
@Service
public class AgentManager extends BaseAgent {
    
    @Autowired
    private PlannerAgent plannerAgent;
    
    @Autowired
    private TutorAgent tutorAgent;
    
    @Autowired
    private HelperAgent helperAgent;
    
    @Autowired
    private EvaluatorAgent evaluatorAgent;
    
    @Autowired
    private CompanionAgent companionAgent;
    
    @Value("${app.agent.manager.system-prompt:}")
    private String systemPrompt;
    
    @Override
    public String getAgentName() {
        return "Manager";
    }
    
    @Override
    public String getAgentDescription() {
        return "智能体管理器，负责协调和管理所有智能体";
    }
    
    @Override
    public AgentType getAgentType() {
        return AgentType.MANAGER;
    }
    
    /**
     * 处理请求并分发给合适的智能体
     */
    public AgentResponse handleRequest(AgentRequest request) {
        log.info("处理请求：userId={}, type={}, content={}", 
            request.getUserId(), request.getType(), request.getContent());
        
        try {
            // 根据请求类型分发
            return switch (request.getType().toLowerCase()) {
                case "plan", "planner", "规划" -> handlePlannerRequest(request);
                case "teach", "tutor", "教学" -> handleTutorRequest(request);
                case "help", "helper", "答疑" -> handleHelperRequest(request);
                case "evaluate", "evaluator", "评估" -> handleEvaluatorRequest(request);
                case "chat", "companion", "交流" -> handleCompanionRequest(request);
                default -> handleGeneralRequest(request);
            };
        } catch (Exception e) {
            log.error("处理请求失败", e);
            return AgentResponse.builder()
                .success(false)
                .message("处理请求时发生错误：" + e.getMessage())
                .agentType("manager")
                .build();
        }
    }
    
    /**
     * 处理规划请求
     */
    private AgentResponse handlePlannerRequest(AgentRequest request) {
        log.info("分发给规划智能体");
        
        // 将 AgentRequest 转换为 PlanRequest
        // content 字段包含 JSON 或结构化文本，这里简单处理
        PlanRequest planRequest = PlanRequest.builder()
            .userId(request.getUserId())
            .goal(request.getContent())  // 假设 content 是学习目标
            .currentLevel(request.getContext() != null ? request.getContext() : "BEGINNER")
            .availableTime("每天1-2小时")  // 默认值
            .preference("实践为主")  // 默认值
            .build();
        
        // 调用实际的规划智能体
        var response = plannerAgent.createPlan(planRequest);
        
        return AgentResponse.builder()
            .success(response.isSuccess())
            .message(response.getPlanContent())
            .agentType("planner")
            .build();
    }
    
    /**
     * 处理教学请求
     */
    private AgentResponse handleTutorRequest(AgentRequest request) {
        log.info("分发给教学智能体");
        
        // 将 AgentRequest 转换为 TeachRequest
        TeachRequest teachRequest = TeachRequest.builder()
            .userId(request.getUserId())
            .topic(request.getContent())  // 假设 content 是知识点主题
            .level(request.getContext() != null ? request.getContext() : "BEGINNER")
            .build();
        
        // 调用实际的教学智能体
        var response = tutorAgent.teach(teachRequest);
        
        return AgentResponse.builder()
            .success(response.isSuccess())
            .message(response.getContent())
            .agentType("tutor")
            .build();
    }
    
    /**
     * 处理答疑请求
     */
    private AgentResponse handleHelperRequest(AgentRequest request) {
        log.info("分发给答疑智能体");
        
        // 将 AgentRequest 转换为 AnswerRequest
        AnswerRequest answerRequest = AnswerRequest.builder()
            .userId(request.getUserId())
            .question(request.getContent())  // 假设 content 是问题
            .context(request.getContext())
            .build();
        
        // 调用实际的答疑智能体
        var response = helperAgent.answer(answerRequest);
        
        return AgentResponse.builder()
            .success(response.isSuccess())
            .message(response.getAnswer())
            .agentType("helper")
            .build();
    }
    
    /**
     * 处理评估请求
     */
    private AgentResponse handleEvaluatorRequest(AgentRequest request) {
        log.info("分发给评估智能体");
        
        // 将 AgentRequest 转换为 EvaluateRequest
        // content 可能包含学生答案，context 可能包含正确答案
        EvaluateRequest evaluateRequest = EvaluateRequest.builder()
            .userId(request.getUserId())
            .question("请评估以下内容")  // 默认问题
            .studentAnswer(request.getContent())  // 假设 content 是学生答案
            .correctAnswer(request.getContext())  // 假设 context 是正确答案
            .build();
        
        // 调用实际的评估智能体
        var response = evaluatorAgent.evaluateExercise(evaluateRequest);
        
        return AgentResponse.builder()
            .success(response.isSuccess())
            .message(response.getFeedback())
            .agentType("evaluator")
            .data(response.getScore() != null ? response.getScore().toString() : null)
            .build();
    }
    
    /**
     * 处理聊天请求
     */
    private AgentResponse handleCompanionRequest(AgentRequest request) {
        log.info("分发给陪伴智能体");
        
        // 将 AgentRequest 转换为 ChatRequest
        ChatRequest chatRequest = ChatRequest.builder()
            .userId(request.getUserId())
            .message(request.getContent())  // 假设 content 是聊天消息
            .build();
        
        // 调用实际的陪伴智能体
        var response = companionAgent.chat(chatRequest);
        
        return AgentResponse.builder()
            .success(response.isSuccess())
            .message(response.getMessage())
            .agentType("companion")
            .build();
    }
    
    /**
     * 处理通用请求（智能识别意图）
     */
    private AgentResponse handleGeneralRequest(AgentRequest request) {
        log.info("智能识别请求意图");
        
        String content = request.getContent().toLowerCase();
        
        // 关键词匹配
        if (content.contains("计划") || content.contains("规划") || content.contains("学习路径")) {
            return handlePlannerRequest(request);
        } else if (content.contains("教") || content.contains("讲解") || content.contains("知识点")) {
            return handleTutorRequest(request);
        } else if (content.contains("问题") || content.contains("疑问") || content.contains("不懂")) {
            return handleHelperRequest(request);
        } else if (content.contains("批改") || content.contains("评估") || content.contains("作业")) {
            return handleEvaluatorRequest(request);
        } else {
            // 默认为聊天
            return handleCompanionRequest(request);
        }
    }
    
    /**
     * 获取所有可用智能体
     */
    public List<BaseAgent> getAllAgents() {
        return Arrays.asList(
            plannerAgent,
            tutorAgent,
            helperAgent,
            evaluatorAgent,
            companionAgent
        );
    }
    
    /**
     * 获取智能体状态
     */
    public String getAgentStatus() {
        StringBuilder status = new StringBuilder("🤖 智能体状态\n\n");
        
        for (BaseAgent agent : getAllAgents()) {
            status.append("✅ %s - %s\n".formatted(
                agent.getAgentName(),
                agent.getAgentDescription()
            ));
        }
        
        return status.toString();
    }
}
