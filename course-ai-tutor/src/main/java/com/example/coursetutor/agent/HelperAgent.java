package com.example.coursetutor.agent;

import com.example.coursetutor.dto.AnswerRequest;
import com.example.coursetutor.dto.AnswerResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 答疑智能体 - 实时解答问题，错误分析
 */
@Slf4j
@Service
public class HelperAgent extends BaseAgent {
    
    private static final String SYSTEM_PROMPT = """
        你是一位耐心的答疑助手，负责实时解答学生的问题。
        
        你的职责：
        1. 快速理解学生问题
        2. 提供准确的解答
        3. 如果是代码问题，帮助调试并指出错误
        4. 引导学生思考，而不是直接给答案
        5. 必要时追问以澄清问题
        
        回答风格：
        - 简洁明了
        - 重点突出
        - 友好耐心
        - 鼓励探索
        """;
    
    @Override
    public String getAgentName() {
        return "Helper";
    }
    
    @Override
    public String getAgentDescription() {
        return "答疑智能体，负责实时解答问题";
    }
    
    /**
     * 解答问题
     */
    public AnswerResponse answer(AnswerRequest request) {
        log.info("解答问题：userId={}, question={}", request.getUserId(), request.getQuestion());
        
        String userPrompt = """
            学生问题：%s
            
            相关上下文：%s
            
            请解答学生的问题。
            """.formatted(request.getQuestion(), request.getContext());
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return AnswerResponse.builder()
            .success(true)
            .answer(response)
            .question(request.getQuestion())
            .agentType("helper")
            .build();
    }
    
    /**
     * 代码调试
     */
    public AnswerResponse debugCode(Long userId, String code, String errorMessage) {
        log.info("代码调试：userId={}, error={}", userId, errorMessage);
        
        String userPrompt = """
            学生遇到了代码问题：
            
            代码：
            ```
            %s
            ```
            
            错误信息：%s
            
            请帮助分析错误原因并提供修复建议。
            """.formatted(code, errorMessage);
        
        String response = callWithSystemPrompt(SYSTEM_PROMPT, userPrompt);
        
        return AnswerResponse.builder()
            .success(true)
            .answer(response)
            .question("代码调试")
            .agentType("helper")
            .build();
    }
}
