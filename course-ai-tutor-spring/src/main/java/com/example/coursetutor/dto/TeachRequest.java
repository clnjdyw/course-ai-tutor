package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeachRequest {
    private Long userId;
    private String topic;
    private String level;
}
