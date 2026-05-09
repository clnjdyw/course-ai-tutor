package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reminder_id")
    private Long reminderId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "reminder_time")
    private LocalDateTime reminderTime;

    @Column(length = 50)
    @Builder.Default
    private String type = "reminder";

    @Column(length = 50)
    @Builder.Default
    private String status = "pending_browser";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
