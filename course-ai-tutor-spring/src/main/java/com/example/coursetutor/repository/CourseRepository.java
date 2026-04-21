package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStatus(String status);
    List<Course> findByCategory(String category);
    List<Course> findByInstructorId(Long instructorId);
    long countByStatus(String status);
}
