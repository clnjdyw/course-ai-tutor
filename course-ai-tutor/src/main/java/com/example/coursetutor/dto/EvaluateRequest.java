package com.example.coursetutor.dto;

import lombok.*;

/**
 * 评估请求 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluateRequest {
    
    private Long userId;
    
    @NonNull
    private Long exerciseId; // 练习 ID
    
    private String question; // 题目
    
    private String studentAnswer; // 学生答案
    
    private String correctAnswer; // 参考答案
}
