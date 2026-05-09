package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercise_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "difficulty_distribution", columnDefinition = "TEXT")
    private String difficultyDistribution;

    @Column(name = "question_type_ratio", columnDefinition = "TEXT")
    private String questionTypeRatio;

    @Column(name = "knowledge_point_ids", columnDefinition = "TEXT")
    private String knowledgePointIds;

    @Column(name = "question_count")
    @Builder.Default
    private Integer questionCount = 10;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
