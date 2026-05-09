package com.example.coursetutor.repository;

import com.example.coursetutor.entity.KnowledgePoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgePointRepository extends JpaRepository<KnowledgePoint, Long> {
    List<KnowledgePoint> findByCourseId(Long courseId);
    List<KnowledgePoint> findByCourseIdAndParentIdIsNull(Long courseId);
    List<KnowledgePoint> findByParentId(Long parentId);
    List<KnowledgePoint> findByAgentType(String agentType);
}
