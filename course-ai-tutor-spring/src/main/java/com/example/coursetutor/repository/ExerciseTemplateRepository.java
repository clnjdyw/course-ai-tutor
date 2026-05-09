package com.example.coursetutor.repository;

import com.example.coursetutor.entity.ExerciseTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseTemplateRepository extends JpaRepository<ExerciseTemplate, Long> {
    List<ExerciseTemplate> findByUserId(Long userId);
}
