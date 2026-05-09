package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "battle_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BattleRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "opponent_name", length = 100)
    private String opponentName;

    @Column(name = "room_id", length = 100)
    private String roomId;

    @Column(name = "my_score")
    private Integer myScore;

    @Column(name = "opponent_score")
    private Integer opponentScore;

    // win / lose / tie
    @Column(length = 10)
    private String result;

    @Column(name = "rating_change")
    private Integer ratingChange;

    @Column(name = "exp_gained")
    private Integer expGained;

    // 对战题目和答题详情（JSON）
    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
