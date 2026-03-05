package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 课程实体类
 */
@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 50)
    private String category;
    
    @Column(length = 20)
    private String level; // BEGINNER, INTERMEDIATE, ADVANCED
    
    @Column(columnDefinition = "TEXT")
    private String knowledgeGraph; // JSON 格式：知识点关系
    
    @Column(columnDefinition = "TEXT")
    private String syllabus; // JSON 格式：课程大纲
    
    @Column(name = "instructor_id")
    private Long instructorId;
    
    @Column(name = "content_path", length = 500)
    private String contentPath;
    
    @Column(name = "duration_hours")
    private Integer durationHours;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean published = false;
    
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
    
    public enum Level {
        BEGINNER, INTERMEDIATE, ADVANCED
    }
}
