package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agent_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "source_agent", length = 100)
    private String sourceAgent;

    @Column(name = "target_agent", length = 100)
    private String targetAgent;

    @Column(columnDefinition = "TEXT")
    private String data;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
