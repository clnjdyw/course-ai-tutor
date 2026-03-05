package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanRequest {
    private Long userId;
    private String goal;
    private String currentLevel;
    private String availableTime;
    private String preference;
}
