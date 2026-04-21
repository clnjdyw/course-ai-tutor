package com.example.coursetutor.agent;

import com.example.coursetutor.dto.EvaluateRequest;
import com.example.coursetutor.dto.EvaluateResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 评估智能体 - 学习效果评估，反馈建议
 */
@Slf4j
@Service
public class EvaluatorAgent extends BaseAgent {
    
    @Value("${app.agent.evaluator.system-prompt:}")
    private String systemPrompt;
    
    @Override
    public String getAgentName() {
        return "Evaluator";
    }
    
    @Override
    public String getAgentDescription() {
        return "评估智能体，负责学习效果评估和反馈";
    }
    
    @Override
    public AgentType getAgentType() {
        return AgentType.EVALUATOR;
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
            包括：
            1. 评分（0-100 分）
            2. 优点分析
            3. 需要改进的地方
            4. 具体改进建议
            5. 鼓励性话语
            
            请使用 Markdown 格式返回。
            """.formatted(
                request.getUserId(),
                request.getExerciseId(),
                request.getQuestion(),
                request.getStudentAnswer(),
                request.getCorrectAnswer()
            );
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
        // 从响应中提取分数（简单实现）
        Integer score = extractScore(response);
        
        return EvaluateResponse.builder()
            .success(true)
            .feedback(response)
            .score(score)
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
            
            请使用 Markdown 格式返回。
            """.formatted(learningData);
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
        return EvaluateResponse.builder()
            .success(true)
            .feedback(response)
            .agentType("evaluator")
            .build();
    }
    
    /**
     * 从响应中提取分数
     */
    private Integer extractScore(String response) {
        // 简单实现：查找"评分：**XX 分"或"分数：XX"
        try {
            String[] patterns = {"评分：\\*\\*(\\d+)", "分数：(\\d+)", "得分：(\\d+)"};
            for (String pattern : patterns) {
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(pattern).matcher(response);
                if (matcher.find()) {
                    return Integer.parseInt(matcher.group(1));
                }
            }
        } catch (Exception e) {
            log.warn("提取分数失败", e);
        }
        return 85; // 默认分数
    }
}
