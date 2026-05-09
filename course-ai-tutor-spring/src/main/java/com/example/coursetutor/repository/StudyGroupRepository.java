package com.example.coursetutor.repository;

import com.example.coursetutor.entity.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {
    List<StudyGroup> findByOwnerId(Long ownerId);
    List<StudyGroup> findByStatus(String status);
}
