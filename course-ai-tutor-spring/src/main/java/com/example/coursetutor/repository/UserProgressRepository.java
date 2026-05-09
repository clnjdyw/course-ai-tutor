package com.example.coursetutor.repository;

import com.example.coursetutor.entity.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    List<UserProgress> findByUserId(Long userId);
    Optional<UserProgress> findByUserIdAndKnowledgePointId(Long userId, Long knowledgePointId);
    long countByUserIdAndMasteryLevelGreaterThanEqual(Long userId, Double masteryLevel);

    @Query("SELECT up FROM UserProgress up JOIN KnowledgePoint kp ON up.knowledgePointId = kp.id WHERE up.userId = :userId AND kp.courseId = :courseId")
    List<UserProgress> findByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
