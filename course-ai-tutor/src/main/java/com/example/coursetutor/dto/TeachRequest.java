package com.example.coursetutor.dto;

import lombok.*;

/**
 * 教学请求 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachRequest {
    
    private Long userId;
    
    @NonNull
    private String topic; // 知识点
    
    private String level; // 学生水平
    
    private String courseId; // 课程 ID
    
    private String context; // 上下文信息
}
