package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {
    List<Exercise> findByCourseId(Long courseId);
    List<Exercise> findByDifficulty(Integer difficulty);
    List<Exercise> findByType(String type);
}
