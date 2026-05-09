package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agent_registry")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentRegistryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "agent_name", nullable = false, unique = true, length = 100)
    private String agentName;

    @Column(name = "agent_type", nullable = false, length = 100)
    private String agentType;

    @Column(columnDefinition = "TEXT")
    private String capabilities;

    @Column(length = 20)
    @Builder.Default
    private String status = "active";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
