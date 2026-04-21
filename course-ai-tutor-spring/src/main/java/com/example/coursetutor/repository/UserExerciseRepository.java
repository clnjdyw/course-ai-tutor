package com.example.coursetutor.repository;

import com.example.coursetutor.entity.UserExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserExerciseRepository extends JpaRepository<UserExercise, Long> {
    List<UserExercise> findByUserId(Long userId);
    List<UserExercise> findByUserIdOrderByCompletedAtDesc(Long userId);
    long countByUserId(Long userId);
    long countByUserIdAndIsCorrectTrue(Long userId);

    @Query("SELECT AVG(ue.score) FROM UserExercise ue WHERE ue.userId = :userId AND ue.score IS NOT NULL")
    Double getAvgScoreByUserId(@Param("userId") Long userId);
}
