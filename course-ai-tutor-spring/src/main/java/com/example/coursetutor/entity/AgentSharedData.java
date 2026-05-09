package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agent_shared_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentSharedData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "`key`", nullable = false, unique = true, length = 255)
    private String key;

    @Column(columnDefinition = "LONGTEXT")
    private String value;

    @Column(name = "agent_type", length = 100)
    private String agentType;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
