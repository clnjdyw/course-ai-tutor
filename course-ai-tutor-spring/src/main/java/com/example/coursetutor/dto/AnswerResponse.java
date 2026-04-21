package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerResponse {
    private boolean success;
    private String answer;
    private String question;
    private String agentType;
}
