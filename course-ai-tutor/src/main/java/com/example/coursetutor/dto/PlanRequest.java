package com.example.coursetutor.dto;

import lombok.*;

/**
 * 学习计划请求 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanRequest {
    
    private Long userId;
    
    @NonNull
    private String goal; // 学习目标
    
    private String currentLevel; // 当前水平
    
    private String availableTime; // 可用时间
    
    private String preference; // 学习偏好
    
    private Long courseId; // 关联课程 ID
}
