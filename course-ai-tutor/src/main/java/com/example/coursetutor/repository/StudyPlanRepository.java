package com.example.coursetutor.repository;

import com.example.coursetutor.entity.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 学习计划数据访问接口
 */
@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {
    
    List<StudyPlan> findByUserId(Long userId);
    
    List<StudyPlan> findByUserIdAndStatus(Long userId, StudyPlan.PlanStatus status);
    
    List<StudyPlan> findByCourseId(Long courseId);
}
