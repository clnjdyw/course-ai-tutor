package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentRequest {
    private Long userId;
    private String type; // plan, teach, help, evaluate, chat
    private String content;
    private String context;
}
