package com.example.coursetutor.repository;

import com.example.coursetutor.entity.LearningFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningFeedbackRepository extends JpaRepository<LearningFeedback, Long> {
    List<LearningFeedback> findByUserId(Long userId);

    @Query("SELECT AVG(lf.rating) FROM LearningFeedback lf WHERE lf.userId = :userId AND lf.rating IS NOT NULL")
    Double getAverageRatingByUserId(@Param("userId") Long userId);

    long countByUserId(Long userId);
}
