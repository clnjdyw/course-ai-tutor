package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserId(Long userId);
    List<Conversation> findByUserIdAndAgentType(Long userId, String agentType);
    List<Conversation> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
}
