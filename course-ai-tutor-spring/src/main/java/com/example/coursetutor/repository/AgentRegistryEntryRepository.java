package com.example.coursetutor.repository;

import com.example.coursetutor.entity.AgentRegistryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgentRegistryEntryRepository extends JpaRepository<AgentRegistryEntry, Long> {
    Optional<AgentRegistryEntry> findByAgentName(String agentName);
    boolean existsByAgentName(String agentName);
}
