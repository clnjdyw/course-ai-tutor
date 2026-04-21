package com.example.coursetutor.dto;

import lombok.*;

/**
 * 评估响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluateResponse {
    
    private boolean success;
    
    private String feedback; // 评估反馈
    
    private String agentType;
    
    private String errorMessage;
    
    private Double score; // 评分（可选）
}
