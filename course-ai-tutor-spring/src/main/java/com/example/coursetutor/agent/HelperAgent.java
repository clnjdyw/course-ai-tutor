package com.example.coursetutor.agent;

import com.example.coursetutor.dto.AnswerRequest;
import com.example.coursetutor.dto.AnswerResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 答疑智能体 - 实时解答问题，错误分析
 */
@Slf4j
@Service
public class HelperAgent extends BaseAgent {
    
    @Value("${app.agent.helper.system-prompt:}")
    private String systemPrompt;
    
    @Override
    public String getAgentName() {
        return "Helper";
    }
    
    @Override
    public String getAgentDescription() {
        return "答疑智能体，负责实时解答问题";
    }
    
    @Override
    public AgentType getAgentType() {
        return AgentType.HELPER;
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
            要求：
            1. 简洁明了，重点突出
            2. 如果是技术问题，提供代码示例
            3. 引导学生思考，而不是直接给答案
            4. 必要时追问以澄清问题
            """.formatted(request.getQuestion(), request.getContext());
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
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
            包括：
            1. 错误原因分析
            2. 修复方案
            3. 修改后的代码示例
            4. 预防类似错误的建议
            """.formatted(code, errorMessage);
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
        return AnswerResponse.builder()
            .success(true)
            .answer(response)
            .question("代码调试")
            .agentType("helper")
            .build();
    }
}
