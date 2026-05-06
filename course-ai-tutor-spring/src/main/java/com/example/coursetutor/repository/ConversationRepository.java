package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserId(Long userId);
    List<Conversation> findByUserIdAndAgentType(Long userId, String agentType);
    List<Conversation> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Conversation> findByUserIdAndAgentTypeOrderByCreatedAtDesc(Long userId, String agentType, Pageable pageable);
    Page<Conversation> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserId(Long userId);
    long countByUserIdAndAgentType(Long userId, String agentType);

    @Query("SELECT c FROM Conversation c WHERE c.userId = :userId AND c.agentType = :agentType " +
           "AND (:keyword IS NULL OR c.topic LIKE CONCAT('%', :keyword, '%') OR c.messages LIKE CONCAT('%', :keyword, '%')) " +
           "AND (:startDate IS NULL OR c.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR c.createdAt <= :endDate) " +
           "ORDER BY c.createdAt DESC")
    Page<Conversation> searchByUserIdAndAgentType(
            @Param("userId") Long userId,
            @Param("agentType") String agentType,
            @Param("keyword") String keyword,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}
