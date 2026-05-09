package com.example.coursetutor.repository;

import com.example.coursetutor.entity.PendingNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PendingNotificationRepository extends JpaRepository<PendingNotification, Long> {
    List<PendingNotification> findByUserIdAndStatus(Long userId, String status);
    List<PendingNotification> findByUserId(Long userId);
}
