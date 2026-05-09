package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.LearningPath;
import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.repository.LearningPathRepository;
import com.example.coursetutor.repository.UserProgressRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/learning-paths")
@RequiredArgsConstructor
public class LearningPathsController {

    private final LearningPathRepository learningPathRepository;

    @PostMapping
    public ApiResponse<?> createLearningPath(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        LearningPath path = LearningPath.builder()
                .userId(userId)
                .name((String) body.get("name"))
                .pathData((String) body.get("pathData"))
                .build();

        LearningPath saved = learningPathRepository.save(path);
        return ApiResponse.ok(Map.of("id", saved.getId()), "学习路径创建成功");
    }

    @GetMapping
    public ApiResponse<List<LearningPath>> getLearningPaths() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(learningPathRepository.findByUserId(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getLearningPath(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return learningPathRepository.findById(id)
                .filter(p -> p.getUserId().equals(userId))
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("学习路径不存在"));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateLearningPath(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        return learningPathRepository.findById(id)
                .filter(p -> p.getUserId().equals(userId))
                .map(p -> {
                    if (body.containsKey("name")) p.setName((String) body.get("name"));
                    if (body.containsKey("pathData")) p.setPathData((String) body.get("pathData"));
                    if (body.containsKey("progress")) p.setProgress((Double) body.get("progress"));
                    if (body.containsKey("status")) p.setStatus((String) body.get("status"));
                    learningPathRepository.save(p);
                    return ApiResponse.ok("学习路径更新成功");
                })
                .orElse(ApiResponse.error("学习路径不存在"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteLearningPath(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return learningPathRepository.findById(id)
                .filter(p -> p.getUserId().equals(userId))
                .map(p -> {
                    learningPathRepository.delete(p);
                    return ApiResponse.ok("学习路径已删除");
                })
                .orElse(ApiResponse.error("学习路径不存在"));
    }

    @PostMapping("/recommend")
    public ApiResponse<?> recommend(@RequestBody Map<String, Object> body) {
        return ApiResponse.ok(Map.of(
                "steps", List.of(),
                "totalSteps", 0,
                "completedSteps", 0
        ));
    }
}
