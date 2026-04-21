package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_exercises")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "exercise_id", nullable = false)
    private Long exerciseId;

    @Column(name = "user_answer", columnDefinition = "TEXT")
    private String userAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column
    private Double score;

    @Column(name = "completed_at")
    @Builder.Default
    private LocalDateTime completedAt = LocalDateTime.now();
}
