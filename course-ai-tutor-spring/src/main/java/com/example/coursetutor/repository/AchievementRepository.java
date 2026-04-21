package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    Optional<Achievement> findByCode(String code);
    List<Achievement> findByCategory(String category);
    List<Achievement> findAllByOrderByCategoryAscPointsDesc();
}
