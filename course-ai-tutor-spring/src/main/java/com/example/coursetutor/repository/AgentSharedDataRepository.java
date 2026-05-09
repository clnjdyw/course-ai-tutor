package com.example.coursetutor.repository;

import com.example.coursetutor.entity.AgentSharedData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AgentSharedDataRepository extends JpaRepository<AgentSharedData, Long> {
    Optional<AgentSharedData> findByKey(String key);
    void deleteByKey(String key);
}
