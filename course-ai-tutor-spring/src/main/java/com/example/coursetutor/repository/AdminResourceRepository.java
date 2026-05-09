package com.example.coursetutor.repository;

import com.example.coursetutor.entity.AdminResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminResourceRepository extends JpaRepository<AdminResource, Long> {
    List<AdminResource> findByType(String type);
    List<AdminResource> findByStatus(String status);
}
