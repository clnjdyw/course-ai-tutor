package com.example.coursetutor.dto;

import lombok.*;

/**
 * 答疑响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerResponse {
    
    private boolean success;
    
    private String answer; // 回答
    
    private String question;
    
    private String agentType;
    
    private String errorMessage;
}
