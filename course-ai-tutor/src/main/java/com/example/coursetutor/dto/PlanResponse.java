package com.example.coursetutor.dto;

import lombok.*;

/**
 * 学习计划响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanResponse {
    
    private boolean success;
    
    private String planContent; // JSON 格式的学习计划
    
    private String agentType;
    
    private String errorMessage;
    
    private Long planId; // 如果保存到数据库，返回计划 ID
}
