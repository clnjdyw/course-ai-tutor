package com.example.coursetutor.dto;

import com.example.coursetutor.agent.CompanionAgent;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {
    private boolean success;
    private String message;
    private CompanionAgent.MoodSnapshot mood;
    private String agentType;
}
