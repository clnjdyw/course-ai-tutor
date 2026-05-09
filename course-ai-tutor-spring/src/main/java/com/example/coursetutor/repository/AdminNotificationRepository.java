package com.example.coursetutor.repository;

import com.example.coursetutor.entity.AdminNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {
    List<AdminNotification> findByOrderByCreatedAtDesc();
    List<AdminNotification> findByType(String type);
}
