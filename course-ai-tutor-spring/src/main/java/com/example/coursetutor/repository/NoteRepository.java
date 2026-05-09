package com.example.coursetutor.repository;

import com.example.coursetutor.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserId(Long userId);
    List<Note> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<Note> findByIsPublicTrue();
    List<Note> findByIsPublicTrueAndTitleContainingIgnoreCase(String search);
    long countByIsPublicTrue();
    long countByUserId(Long userId);

    @Modifying
    @Query("UPDATE Note n SET n.views = n.views + 1 WHERE n.id = :id")
    int incrementViews(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Note n SET n.likes = n.likes + 1 WHERE n.id = :id")
    int incrementLikes(@Param("id") Long id);
}
