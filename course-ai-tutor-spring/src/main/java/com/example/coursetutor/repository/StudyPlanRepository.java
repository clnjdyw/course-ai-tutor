package com.example.coursetutor.repository;

import com.example.coursetutor.entity.StudyPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {
    List<StudyPlan> findByUserId(Long userId);
    List<StudyPlan> findByUserIdAndStatus(Long userId, String status);
    List<StudyPlan> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<StudyPlan> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, String status);

    @Query("SELECT p FROM StudyPlan p WHERE p.userId = :userId " +
           "AND (:keyword IS NULL OR p.goal LIKE CONCAT('%', :keyword, '%') OR p.planContent LIKE CONCAT('%', :keyword, '%')) " +
           "AND (:startDate IS NULL OR p.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR p.createdAt <= :endDate) " +
           "ORDER BY p.createdAt DESC")
    Page<StudyPlan> searchByUserId(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}
