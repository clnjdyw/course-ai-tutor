package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachResponse {
    private boolean success;
    private String content;
    private String topic;
    private String agentType;
}
