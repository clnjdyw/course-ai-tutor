package com.example.coursetutor.repository;

import com.example.coursetutor.entity.NoteComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteCommentRepository extends JpaRepository<NoteComment, Long> {
    List<NoteComment> findByNoteId(Long noteId);
    void deleteByNoteId(Long noteId);
}
