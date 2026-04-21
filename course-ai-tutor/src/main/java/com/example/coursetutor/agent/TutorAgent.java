package com.example.coursetutor.agent;

import com.example.coursetutor.dto.TeachRequest;
import com.example.coursetutor.dto.TeachResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 教学智能体 - 一对一授课，知识点讲解
 */
@Slf4j
@Service
public class TutorAgent extends BaseAgent {
    
    private static final String SYSTEM_PROMPT = """
        你是一位经验丰富的课程讲师，擅长用简单易懂的方式讲解复杂概念。
        
        你的职责：
        1. 根据学生水平调整讲解深度
        2. 由浅入深，循序渐进地讲解知识点
        3. 提供清晰的代码示例
        4. 给出练习题巩固学习
        5. 解答学生的疑问
        
        教学风格：
        - 耐心细致
        - 善于举例
        - 注重实践
        - 鼓励互动
        """;
    
    @Override
    public String getAgentName() {
        return "Tutor";
    }
    
    @Override
    public String getAgentDescription() {
        return "教学智能体，负责知识点讲解和授课";
    }
    
    /**
     * 讲解知识点
     */
    public TeachResponse teach(TeachRequest request) {
        log.info("讲解知识点：userId={}, topic={}", request.getUserId(), request.getTopic());
        
        String userPrompt = """
            学生信息：
            - 用户 ID: %s
            - 当前水平：%s
            
            请讲解以下知识点：%s
            
            要求：
            1. 由浅入深，循序渐进
            2. 提供代码示例（如果适用）
            3. 给出 2-3 个练习题
            4. 总结关键要点
            """.formatted(
                request.getUserId(),
                request.getLevel(),
                request.getTopic()
            );
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return TeachResponse.builder()
            .success(true)
            .content(response)
            .topic(request.getTopic())
            .agentType("tutor")
            .build();
    }
    
    /**
     * 解答疑问
     */
    public TeachResponse answerQuestion(Long userId, String question, String context) {
        log.info("解答疑问：userId={}, question={}", userId, question);
        
        String userPrompt = """
            学生问题：%s
            
            上下文信息：%s
            
            请详细解答学生的问题，并确保解释清晰易懂。
            """.formatted(question, context);
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return TeachResponse.builder()
            .success(true)
            .content(response)
            .topic("问题解答")
            .agentType("tutor")
            .build();
    }
}
