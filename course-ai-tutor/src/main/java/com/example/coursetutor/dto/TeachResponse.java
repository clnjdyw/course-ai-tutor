package com.example.coursetutor.dto;

import lombok.*;

/**
 * 教学响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachResponse {
    
    private boolean success;
    
    private String content; // 教学内容
    
    private String topic;
    
    private String agentType;
    
    private String errorMessage;
}
