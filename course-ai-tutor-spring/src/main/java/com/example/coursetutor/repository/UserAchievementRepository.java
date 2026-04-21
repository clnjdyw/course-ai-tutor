package com.example.coursetutor.repository;

import com.example.coursetutor.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    List<UserAchievement> findByUserId(Long userId);
    List<UserAchievement> findByUserIdOrderByUnlockedAtDesc(Long userId);
    Optional<UserAchievement> findByUserIdAndAchievementId(Long userId, Long achievementId);
    long countByUserId(Long userId);
    boolean existsByUserIdAndAchievementId(Long userId, Long achievementId);
}
