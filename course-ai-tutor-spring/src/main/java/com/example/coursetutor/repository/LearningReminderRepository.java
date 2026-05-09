package com.example.coursetutor.repository;

import com.example.coursetutor.entity.LearningReminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LearningReminderRepository extends JpaRepository<LearningReminder, Long> {
    List<LearningReminder> findByUserId(Long userId);
    List<LearningReminder> findByUserIdAndStatus(Long userId, String status);
    List<LearningReminder> findByReminderTimeBeforeAndStatus(LocalDateTime now, String status);
}
