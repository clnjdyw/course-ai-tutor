package com.example.coursetutor.repository;

import com.example.coursetutor.entity.LearningSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LearningSessionRepository extends JpaRepository<LearningSession, Long> {
    List<LearningSession> findByUserId(Long userId);
    List<LearningSession> findByUserIdAndEndTimeIsNull(Long userId);

    @Query("SELECT COALESCE(SUM(ls.duration), 0) FROM LearningSession ls WHERE ls.userId = :userId AND ls.endTime IS NOT NULL")
    Long getTotalDurationByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(ls) FROM LearningSession ls WHERE ls.userId = :userId AND ls.startTime >= :since")
    long countByUserIdAndStartTimeAfter(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
