package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 对话历史实体类
 */
@Entity
@Table(name = "conversations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "agent_type", length = 50, nullable = false)
    private String agentType; // planner, tutor, helper, evaluator
    
    @Column(columnDefinition = "TEXT")
    private String messages; // JSON 格式：对话历史
    
    @Column(columnDefinition = "TEXT")
    private String context; // JSON 格式：上下文信息
    
    @Column(name = "topic", length = 200)
    private String topic;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
