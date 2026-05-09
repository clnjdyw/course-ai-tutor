package com.example.coursetutor.repository;

import com.example.coursetutor.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {
    Page<CommunityPost> findAll(Pageable pageable);
    Page<CommunityPost> findByType(String type, Pageable pageable);
    Page<CommunityPost> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(String title, String content, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE CommunityPost cp SET cp.views = cp.views + 1 WHERE cp.id = :id")
    int incrementViews(@org.springframework.data.repository.query.Param("id") Long id);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE CommunityPost cp SET cp.likes = cp.likes + 1 WHERE cp.id = :id")
    int incrementLikes(@org.springframework.data.repository.query.Param("id") Long id);
}
