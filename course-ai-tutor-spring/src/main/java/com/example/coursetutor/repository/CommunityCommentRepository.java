package com.example.coursetutor.repository;

import com.example.coursetutor.entity.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {
    List<CommunityComment> findByPostId(Long postId);
    List<CommunityComment> findByPostIdAndParentIdIsNull(Long postId);
}
