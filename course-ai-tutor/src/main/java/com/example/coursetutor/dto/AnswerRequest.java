package com.example.coursetutor.dto;

import lombok.*;

/**
 * 答疑请求 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerRequest {
    
    private Long userId;
    
    @NonNull
    private String question; // 问题
    
    private String context; // 上下文
}
