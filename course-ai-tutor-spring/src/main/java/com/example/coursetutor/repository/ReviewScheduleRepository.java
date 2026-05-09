package com.example.coursetutor.repository;

import com.example.coursetutor.entity.ReviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReviewScheduleRepository extends JpaRepository<ReviewSchedule, Long> {
    List<ReviewSchedule> findByUserId(Long userId);
    List<ReviewSchedule> findByUserIdAndStatus(Long userId, String status);
    List<ReviewSchedule> findByReviewTimeBeforeAndStatus(LocalDateTime now, String status);
    long countByUserIdAndStatus(Long userId, String status);
}
