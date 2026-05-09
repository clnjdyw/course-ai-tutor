package com.example.coursetutor.repository;

import com.example.coursetutor.entity.BattleRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BattleRecordRepository extends JpaRepository<BattleRecord, Long> {
    Page<BattleRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<BattleRecord> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(Long userId, LocalDateTime after);
    long countByUserIdAndResult(Long userId, String result);

    @Query("SELECT b FROM BattleRecord b WHERE b.userId = :userId " +
           "AND (:keyword IS NULL OR b.opponentName LIKE CONCAT('%', :keyword, '%') OR b.result LIKE CONCAT('%', :keyword, '%')) " +
           "AND (:startDate IS NULL OR b.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR b.createdAt <= :endDate) " +
           "ORDER BY b.createdAt DESC")
    Page<BattleRecord> searchByUserId(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}
