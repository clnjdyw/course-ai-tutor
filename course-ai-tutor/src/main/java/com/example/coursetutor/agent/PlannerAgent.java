package com.example.coursetutor.agent;

import com.example.coursetutor.dto.PlanRequest;
import com.example.coursetutor.dto.PlanResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 规划智能体 - 分析学习目标，制定学习计划
 */
@Slf4j
@Service
public class PlannerAgent extends BaseAgent {
    
    private static final String SYSTEM_PROMPT = """
        你是一位专业的学习规划师，擅长根据学生的目标和水平制定个性化的学习计划。
        
        你的职责：
        1. 分析学生的学习目标和当前水平
        2. 拆解学习目标为可执行的小目标
        3. 制定合理的时间安排
        4. 推荐适合的学习资源
        5. 设定检查点和评估标准
        
        请以 JSON 格式返回学习计划，包含以下字段：
        - goal: 学习目标
        - phases: 学习阶段数组（每个阶段包含 name, duration, tasks, resources）
        - timeline: 总体时间线
        - checkpoints: 检查点数组
        - resources: 推荐资源列表
        """;
    
    @Override
    public String getAgentName() {
        return "Planner";
    }
    
    @Override
    public String getAgentDescription() {
        return "学习规划智能体，负责制定个性化学习计划";
    }
    
    /**
     * 创建学习计划
     */
    public PlanResponse createPlan(PlanRequest request) {
        log.info("创建学习计划：userId={}, goal={}", request.getUserId(), request.getGoal());
        
        String userPrompt = """
            学生信息：
            - 用户 ID: %s
            - 学习目标：%s
            - 当前水平：%s
            - 可用时间：%s
            - 学习偏好：%s
            
            请为该学生制定详细的学习计划。
            """.formatted(
                request.getUserId(),
                request.getGoal(),
                request.getCurrentLevel(),
                request.getAvailableTime(),
                request.getPreference()
            );
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return PlanResponse.builder()
            .success(true)
            .planContent(response)
            .agentType("planner")
            .build();
    }
    
    /**
     * 调整学习计划
     */
    public PlanResponse adjustPlan(Long planId, String feedback) {
        log.info("调整学习计划：planId={}, feedback={}", planId, feedback);
        
        String userPrompt = """
            需要根据以下反馈调整学习计划：
            计划 ID: %s
            用户反馈：%s
            
            请分析反馈并给出调整建议。
            """.formatted(planId, feedback);
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return PlanResponse.builder()
            .success(true)
            .planContent(response)
            .agentType("planner")
            .build();
    }
}
