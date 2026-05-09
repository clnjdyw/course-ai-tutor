package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.*;
import com.example.coursetutor.repository.*;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityPostRepository postRepository;
    private final CommunityCommentRepository commentRepository;
    private final StudyGroupRepository groupRepository;
    private final StudyGroupMemberRepository memberRepository;

    @GetMapping("/posts")
    public ApiResponse<?> getPosts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        PageRequest pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        Page<CommunityPost> posts;
        if (type != null) {
            posts = postRepository.findByType(type, pageable);
        } else if (search != null) {
            posts = postRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(search, search, pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }
        return ApiResponse.ok(Map.of(
                "posts", posts.getContent(),
                "pagination", Map.of("page", page, "limit", limit, "total", posts.getTotalElements(), "totalPages", posts.getTotalPages())
        ));
    }

    @PostMapping("/posts")
    public ApiResponse<?> createPost(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        CommunityPost post = CommunityPost.builder()
                .userId(userId)
                .title((String) body.get("title"))
                .content((String) body.get("content"))
                .type((String) body.getOrDefault("type", "discussion"))
                .tags((String) body.get("tags"))
                .build();

        CommunityPost saved = postRepository.save(post);
        return ApiResponse.ok(Map.of("id", saved.getId()), "帖子发布成功");
    }

    @GetMapping("/posts/{id}")
    public ApiResponse<?> getPost(@PathVariable Long id) {
        postRepository.incrementViews(id);
        return postRepository.findById(id)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("帖子不存在"));
    }

    @PostMapping("/posts/{id}/comments")
    public ApiResponse<?> addComment(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        CommunityComment comment = CommunityComment.builder()
                .postId(id)
                .userId(userId)
                .content((String) body.get("content"))
                .parentId(getLong(body, "parentId"))
                .build();

        CommunityComment saved = commentRepository.save(comment);
        return ApiResponse.ok(Map.of("id", saved.getId()), "评论发表成功");
    }

    @GetMapping("/posts/{id}/comments")
    public ApiResponse<List<CommunityComment>> getComments(@PathVariable Long id) {
        return ApiResponse.ok(commentRepository.findByPostIdAndParentIdIsNull(id));
    }

    @PostMapping("/posts/{id}/like")
    public ApiResponse<?> likePost(@PathVariable Long id) {
        postRepository.incrementLikes(id);
        return ApiResponse.ok("点赞成功");
    }

    @GetMapping("/groups")
    public ApiResponse<List<StudyGroup>> getGroups() {
        return ApiResponse.ok(groupRepository.findByStatus("active"));
    }

    @PostMapping("/groups")
    public ApiResponse<?> createGroup(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        StudyGroup group = StudyGroup.builder()
                .name((String) body.get("name"))
                .description((String) body.get("description"))
                .ownerId(userId)
                .maxMembers(getInt(body, "maxMembers", 50))
                .build();

        StudyGroup saved = groupRepository.save(group);
        // Auto-join owner
        memberRepository.save(StudyGroupMember.builder()
                .groupId(saved.getId())
                .userId(userId)
                .role("owner")
                .build());

        return ApiResponse.ok(Map.of("id", saved.getId()), "小组创建成功");
    }

    @PostMapping("/groups/{id}/join")
    public ApiResponse<?> joinGroup(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();

        if (memberRepository.findByGroupIdAndUserId(id, userId).isPresent()) {
            return ApiResponse.error("已加入该小组");
        }

        StudyGroupMember member = StudyGroupMember.builder()
                .groupId(id)
                .userId(userId)
                .role("member")
                .build();
        memberRepository.save(member);
        return ApiResponse.ok("加入成功");
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).longValue() : null;
    }

    private Integer getInt(Map<String, Object> map, String key, int defaultValue) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).intValue() : defaultValue;
    }
}
