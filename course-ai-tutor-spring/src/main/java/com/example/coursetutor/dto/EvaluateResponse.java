package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluateResponse {
    private boolean success;
    private String feedback;
    private Integer score;
    private String agentType;
}
