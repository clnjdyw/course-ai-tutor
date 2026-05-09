package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.repository.UserProgressRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final UserProgressRepository userProgressRepository;

    @GetMapping
    public ApiResponse<List<UserProgress>> getProgress() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(userProgressRepository.findByUserId(userId));
    }

    @PostMapping
    public ApiResponse<?> updateProgress(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        Long kpId = getLong(body, "knowledgePointId");
        Double mastery = getDouble(body, "masteryLevel");

        if (kpId == null || mastery == null) {
            return ApiResponse.error("knowledgePointId 和 masteryLevel 不能为空");
        }

        Optional<UserProgress> progressOpt = userProgressRepository.findByUserIdAndKnowledgePointId(userId, kpId);
        UserProgress progress = progressOpt.orElseGet(() -> UserProgress.builder()
                .userId(userId)
                .knowledgePointId(kpId)
                .masteryLevel(0.0)
                .reviewCount(0)
                .build());

        progress.setMasteryLevel(mastery);
        progress.setReviewCount(progress.getReviewCount() + 1);
        userProgressRepository.save(progress);
        return ApiResponse.ok("进度已更新");
    }

    @GetMapping("/stats")
    public ApiResponse<?> getStats() {
        Long userId = SecurityUtil.requireUserId();
        List<UserProgress> progressList = userProgressRepository.findByUserId(userId);

        long mastered = progressList.stream().filter(p -> p.getMasteryLevel() >= 0.8).count();
        long learning = progressList.stream().filter(p -> p.getMasteryLevel() >= 0.5 && p.getMasteryLevel() < 0.8).count();
        long weak = progressList.stream().filter(p -> p.getMasteryLevel() < 0.5 && p.getMasteryLevel() > 0).count();

        return ApiResponse.ok(Map.of(
                "totalKnowledgePoints", progressList.size(),
                "masteredCount", mastered,
                "learningCount", learning,
                "weakCount", weak
        ));
    }

    @GetMapping("/recommendations")
    public ApiResponse<?> getRecommendations() {
        Long userId = SecurityUtil.requireUserId();
        List<UserProgress> progressList = userProgressRepository.findByUserId(userId);

        // Recommend points with low mastery
        var weakPoints = progressList.stream()
                .filter(p -> p.getMasteryLevel() < 0.6)
                .sorted((a, b) -> Double.compare(a.getMasteryLevel(), b.getMasteryLevel()))
                .limit(10)
                .map(p -> Map.of(
                        "knowledgePointId", p.getKnowledgePointId(),
                        "masteryLevel", p.getMasteryLevel(),
                        "suggestion", "建议加强复习"
                ))
                .toList();

        return ApiResponse.ok(weakPoints);
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).longValue() : null;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).doubleValue() : null;
    }
}
