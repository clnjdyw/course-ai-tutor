package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 课程数据访问接口
 */
@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    
    List<Course> findByCategory(String category);
    
    List<Course> findByLevel(Course.Level level);
    
    List<Course> findByPublishedTrue();
    
    List<Course> findByInstructorId(Long instructorId);
}
