package com.example.coursetutor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "knowledge_base_id")
    private Long knowledgeBaseId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(length = 50)
    private String fileType; // pdf, docx, txt

    @Column(length = 500)
    private String filePath; // 原始文件存储路径

    @Column
    private Integer wordCount;

    @Column
    private Integer chunkCount; // 分块数量

    // 处理状态：pending, processing, processed, failed
    @Column(length = 20)
    @Builder.Default
    private String status = "pending";

    // 关联的智能体 ID
    @Column(length = 50)
    private String agentId;

    // 关联的课程 ID
    @Column(length = 50)
    private String courseId;

    // 上传者（教师）ID
    @Column(name = "uploaded_by")
    private Long uploadedBy;

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
