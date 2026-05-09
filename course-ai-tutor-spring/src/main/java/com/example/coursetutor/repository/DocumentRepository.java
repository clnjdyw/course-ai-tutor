package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByKnowledgeBaseId(Long knowledgeBaseId);
    List<Document> findByUploadedBy(Long uploadedBy);
    List<Document> findByAgentId(String agentId);
    List<Document> findByCourseId(String courseId);
    List<Document> findByStatus(String status);
}
