package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 对话历史数据访问接口
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    List<Conversation> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Conversation> findByUserIdAndAgentTypeOrderByCreatedAtDesc(Long userId, String agentType);
    
    void deleteByUserId(Long userId);
}
