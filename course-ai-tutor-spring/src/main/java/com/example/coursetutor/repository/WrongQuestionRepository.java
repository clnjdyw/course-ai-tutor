package com.example.coursetutor.repository;

import com.example.coursetutor.entity.WrongQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WrongQuestionRepository extends JpaRepository<WrongQuestion, Long> {
    List<WrongQuestion> findByUserId(Long userId);
    List<WrongQuestion> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<WrongQuestion> findByUserIdAndMasteredFalse(Long userId);
    long countByUserId(Long userId);

    @Query("SELECT wq.exerciseId, COUNT(wq) FROM WrongQuestion wq WHERE wq.userId = :userId GROUP BY wq.exerciseId ORDER BY COUNT(wq) DESC")
    List<Object[]> getErrorFrequencyByExerciseId(@Param("userId") Long userId);
}
