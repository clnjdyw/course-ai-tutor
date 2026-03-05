package com.example.coursetutor.agent;

import com.example.coursetutor.dto.TeachRequest;
import com.example.coursetutor.dto.TeachResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 教学智能体 - 一对一授课，知识点讲解
 */
@Slf4j
@Service
public class TutorAgent extends BaseAgent {
    
    @Value("${app.agent.tutor.system-prompt:}")
    private String systemPrompt;
    
    @Override
    public String getAgentName() {
        return "Tutor";
    }
    
    @Override
    public String getAgentDescription() {
        return "教学智能体，负责知识点讲解和授课";
    }
    
    @Override
    public AgentType getAgentType() {
        return AgentType.TUTOR;
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
            5. 使用 Markdown 格式，结构清晰
            
            请确保讲解内容适合学生的水平，避免过于复杂或过于简单。
            """.formatted(
                request.getUserId(),
                request.getLevel(),
                request.getTopic()
            );
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
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
            如果问题不完整，请提出澄清问题。
            """.formatted(question, context);
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
        return TeachResponse.builder()
            .success(true)
            .content(response)
            .topic("问题解答")
            .agentType("tutor")
            .build();
    }
}
