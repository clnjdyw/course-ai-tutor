package com.example.coursetutor.repository;

import com.example.coursetutor.entity.AgentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentEventRepository extends JpaRepository<AgentEvent, Long> {
    @Query("SELECT ae FROM AgentEvent ae WHERE ae.targetAgent = :agent OR ae.targetAgent IS NULL ORDER BY ae.createdAt DESC")
    List<AgentEvent> findForAgent(@Param("agent") String agent, org.springframework.data.domain.Pageable pageable);
}
