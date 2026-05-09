package com.example.coursetutor.repository;

import com.example.coursetutor.entity.AdminLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {
    Page<AdminLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByAdminId(Long adminId);
}
