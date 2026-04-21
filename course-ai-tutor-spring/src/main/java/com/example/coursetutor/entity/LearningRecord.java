package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "learning_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Column
    private Integer duration;

    @Column
    private Double score;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
