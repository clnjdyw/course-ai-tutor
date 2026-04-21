package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluateRequest {
    private Long userId;
    private Long exerciseId;
    private String question;
    private String studentAnswer;
    private String correctAnswer;
}
