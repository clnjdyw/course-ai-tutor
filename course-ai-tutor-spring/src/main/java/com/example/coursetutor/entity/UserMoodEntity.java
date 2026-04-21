package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 用户情绪状态记录实体
 */
@Entity
@Table(name = "user_moods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserMoodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "mood_type", length = 20, nullable = false)
    private String moodType;

    @Column(name = "yesterday_accuracy")
    @Builder.Default
    private Double yesterdayAccuracy = 70.0;

    @Column(name = "today_count")
    @Builder.Default
    private Integer todayCount = 0;

    @Column(name = "streak_days")
    @Builder.Default
    private Integer streakDays = 1;

    @Column(name = "user_message", columnDefinition = "TEXT")
    private String userMessage;

    @Column(name = "bot_response", columnDefinition = "TEXT")
    private String botResponse;

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

    /**
     * 获取情绪描述
     */
    public String getDescription() {
        return switch (moodType) {
            case "HAPPY" -> "😊 开心";
            case "SAD" -> "😔 需要鼓励";
            case "EXCITED" -> "🤩 兴奋";
            case "TIRED" -> "😴 需要休息";
            default -> "🙂 平静";
        };
    }
}
