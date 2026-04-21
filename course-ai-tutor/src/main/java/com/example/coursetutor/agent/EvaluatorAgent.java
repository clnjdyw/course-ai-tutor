package com.example.coursetutor.agent;

import com.example.coursetutor.dto.EvaluateRequest;
import com.example.coursetutor.dto.EvaluateResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 评估智能体 - 学习效果评估，反馈建议
 */
@Slf4j
@Service
public class EvaluatorAgent extends BaseAgent {
    
    private static final String SYSTEM_PROMPT = """
        你是一位专业的学习评估师，负责评估学生的学习效果并提供反馈。
        
        你的职责：
        1. 批改作业和练习
        2. 分析学生的薄弱点
        3. 生成详细的学习报告
        4. 提供改进建议
        5. 调整学习计划
        
        评估标准：
        - 准确性：答案是否正确
        - 完整性：是否覆盖所有要点
        - 理解深度：对概念的理解程度
        - 进步情况：与之前的对比
        """;
    
    @Override
    public String getAgentName() {
        return "Evaluator";
    }
    
    @Override
    public String getAgentDescription() {
        return "评估智能体，负责学习效果评估和反馈";
    }
    
    /**
     * 评估作业
     */
    public EvaluateResponse evaluateExercise(EvaluateRequest request) {
        log.info("评估作业：userId={}, exerciseId={}", request.getUserId(), request.getExerciseId());
        
        String userPrompt = """
            学生作业评估：
            - 用户 ID: %s
            - 练习 ID: %s
            - 题目：%s
            - 学生答案：%s
            - 参考答案：%s
            
            请批改作业并给出详细反馈。
            """.formatted(
                request.getUserId(),
                request.getExerciseId(),
                request.getQuestion(),
                request.getStudentAnswer(),
                request.getCorrectAnswer()
            );
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return EvaluateResponse.builder()
            .success(true)
            .feedback(response)
            .agentType("evaluator")
            .build();
    }
    
    /**
     * 生成学习报告
     */
    public EvaluateResponse generateReport(Long userId, String learningData) {
        log.info("生成学习报告：userId={}", userId);
        
        String userPrompt = """
            学习数据：%s
            
            请根据以上学习数据生成详细的学习报告，包括：
            1. 学习进度总结
            2. 掌握情况评估
            3. 薄弱点分析
            4. 改进建议
            5. 后续学习计划
            """.formatted(learningData);
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return EvaluateResponse.builder()
            .success(true)
            .feedback(response)
            .agentType("evaluator")
            .build();
    }
}
