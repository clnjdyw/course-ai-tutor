package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 学习计划实体类
 */
@Entity
@Table(name = "study_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyPlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "course_id")
    private Long courseId;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String goal; // 学习目标
    
    @Column(columnDefinition = "TEXT")
    private String schedule; // JSON 格式：时间安排
    
    @Column(columnDefinition = "TEXT")
    private String resources; // JSON 格式：推荐资源
    
    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 0; // 进度 0-100
    
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PlanStatus status = PlanStatus.ACTIVE;
    
    @Column(name = "start_date")
    private LocalDateTime startDate;
    
    @Column(name = "end_date")
    private LocalDateTime endDate;
    
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
    
    public enum PlanStatus {
        ACTIVE, COMPLETED, PAUSED, CANCELLED
    }
}
