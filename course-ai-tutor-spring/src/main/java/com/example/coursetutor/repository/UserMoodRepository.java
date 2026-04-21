package com.example.coursetutor.repository;

import com.example.coursetutor.entity.UserMoodEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserMoodRepository extends JpaRepository<UserMoodEntity, Long> {

    /**
     * 获取用户最新的情绪记录
     */
    Optional<UserMoodEntity> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 获取用户今天的情绪记录
     */
    @Query("SELECT m FROM UserMoodEntity m WHERE m.userId = :userId AND m.createdAt >= :startOfDay ORDER BY m.createdAt DESC")
    List<UserMoodEntity> findByUserIdAndToday(@Param("userId") Long userId,
                                        @Param("startOfDay") LocalDateTime startOfDay);

    /**
     * 获取用户最近 N 天的情绪记录
     */
    @Query("SELECT m FROM UserMoodEntity m WHERE m.userId = :userId AND m.createdAt >= :startDate ORDER BY m.createdAt DESC")
    List<UserMoodEntity> findByUserIdAndRecentDays(@Param("userId") Long userId,
                                             @Param("startDate") LocalDateTime startDate);

    /**
     * 统计用户今天的情绪记录数
     */
    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime startTime);

    /**
     * 获取用户指定日期范围内的情绪记录
     */
    @Query("SELECT m FROM UserMoodEntity m WHERE m.userId = :userId AND m.createdAt BETWEEN :startDate AND :endDate ORDER BY m.createdAt ASC")
    List<UserMoodEntity> findByUserIdAndDateRange(@Param("userId") Long userId,
                                            @Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate);

    /**
     * 删除用户过期的情绪记录（保留最近30天）
     */
    void deleteByUserIdAndCreatedAtBefore(Long userId, LocalDateTime cutoffDate);
}
