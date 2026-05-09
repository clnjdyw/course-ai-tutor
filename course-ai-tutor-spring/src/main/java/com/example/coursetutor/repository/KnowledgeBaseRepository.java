package com.example.coursetutor.repository;

import com.example.coursetutor.entity.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {
    List<KnowledgeBase> findByCreatedBy(Long createdBy);
    List<KnowledgeBase> findByAgentId(String agentId);
    List<KnowledgeBase> findByCourseId(String courseId);
}
