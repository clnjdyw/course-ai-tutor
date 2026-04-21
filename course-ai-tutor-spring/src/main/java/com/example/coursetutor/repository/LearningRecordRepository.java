package com.example.coursetutor.repository;

import com.example.coursetutor.entity.LearningRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LearningRecordRepository extends JpaRepository<LearningRecord, Long> {
    List<LearningRecord> findByUserId(Long userId);
    List<LearningRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<LearningRecord> findByUserIdAndActionType(Long userId, String actionType);
    long countByUserId(Long userId);
    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime startTime);

    @Query("SELECT AVG(lr.score) FROM LearningRecord lr WHERE lr.userId = :userId AND lr.score IS NOT NULL")
    Double getAvgScoreByUserId(@Param("userId") Long userId);

    @Query("SELECT SUM(lr.duration) FROM LearningRecord lr WHERE lr.userId = :userId AND lr.duration IS NOT NULL")
    Long getTotalDurationByUserId(@Param("userId") Long userId);
}
