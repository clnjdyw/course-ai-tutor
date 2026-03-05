package com.example.coursetutor.agent;

import com.example.coursetutor.dto.PlanRequest;
import com.example.coursetutor.dto.PlanResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 规划智能体 - 分析学习目标，制定学习计划
 */
@Slf4j
@Service
public class PlannerAgent extends BaseAgent {
    
    @Value("${app.agent.planner.system-prompt:}")
    private String systemPrompt;
    
    @Override
    public String getAgentName() {
        return "Planner";
    }
    
    @Override
    public String getAgentDescription() {
        return "学习规划智能体，负责制定个性化学习计划";
    }
    
    @Override
    public AgentType getAgentType() {
        return AgentType.PLANNER;
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
            
            请为该学生制定详细的学习计划，包含：
            1. 学习目标拆解
            2. 阶段划分（每个阶段的目标、任务、时长）
            3. 推荐资源
            4. 检查点和评估标准
            5. 预期成果
            
            请使用 Markdown 格式返回，结构清晰，便于阅读。
            """.formatted(
                request.getUserId(),
                request.getGoal(),
                request.getCurrentLevel(),
                request.getAvailableTime(),
                request.getPreference()
            );
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
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
            
            请分析反馈并给出调整建议，包括：
            1. 原计划的问题分析
            2. 具体调整方案
            3. 调整后的预期效果
            """.formatted(planId, feedback);
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
        return PlanResponse.builder()
            .success(true)
            .planContent(response)
            .agentType("planner")
            .build();
    }
}
