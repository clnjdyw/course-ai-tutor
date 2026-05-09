package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.WrongQuestion;
import com.example.coursetutor.repository.WrongQuestionRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wrong-questions")
@RequiredArgsConstructor
public class WrongQuestionsController {

    private final WrongQuestionRepository wrongQuestionRepository;

    @GetMapping
    public ApiResponse<List<WrongQuestion>> getWrongQuestions(
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(required = false) Boolean unmastered) {
        Long userId = SecurityUtil.requireUserId();
        List<WrongQuestion> questions;
        if (Boolean.TRUE.equals(unmastered)) {
            questions = wrongQuestionRepository.findByUserIdAndMasteredFalse(userId);
        } else {
            questions = wrongQuestionRepository.findByUserId(userId);
        }
        if (questions.size() > limit) {
            questions = questions.subList(0, limit);
        }
        return ApiResponse.ok(questions);
    }

    @GetMapping("/statistics")
    public ApiResponse<?> getStatistics() {
        Long userId = SecurityUtil.requireUserId();
        long total = wrongQuestionRepository.countByUserId(userId);
        long mastered = wrongQuestionRepository.findByUserId(userId).stream()
                .filter(WrongQuestion::getMastered).count();
        return ApiResponse.ok(Map.of(
                "total", total,
                "mastered", mastered,
                "unmastered", total - mastered
        ));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getWrongQuestion(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return wrongQuestionRepository.findById(id)
                .filter(wq -> wq.getUserId().equals(userId))
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("错题不存在"));
    }

    @PostMapping
    public ApiResponse<?> addWrongQuestion(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        WrongQuestion wq = WrongQuestion.builder()
                .userId(userId)
                .exerciseId(getLong(body, "exerciseId"))
                .userAnswer((String) body.get("userAnswer"))
                .correctAnswer((String) body.get("correctAnswer"))
                .errorAnalysis((String) body.get("errorAnalysis"))
                .build();

        WrongQuestion saved = wrongQuestionRepository.save(wq);
        return ApiResponse.ok(Map.of("id", saved.getId()), "错题已记录");
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateWrongQuestion(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        return wrongQuestionRepository.findById(id)
                .filter(wq -> wq.getUserId().equals(userId))
                .map(wq -> {
                    if (body.containsKey("errorAnalysis")) wq.setErrorAnalysis((String) body.get("errorAnalysis"));
                    if (body.containsKey("reviewCount")) wq.setReviewCount((Integer) body.get("reviewCount"));
                    if (body.containsKey("mastered")) wq.setMastered((Boolean) body.get("mastered"));
                    wrongQuestionRepository.save(wq);
                    return ApiResponse.ok("错题已更新");
                })
                .orElse(ApiResponse.error("错题不存在"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteWrongQuestion(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return wrongQuestionRepository.findById(id)
                .filter(wq -> wq.getUserId().equals(userId))
                .map(wq -> {
                    wrongQuestionRepository.delete(wq);
                    return ApiResponse.ok("错题已删除");
                })
                .orElse(ApiResponse.error("错题不存在或无权限"));
    }

    @PostMapping("/{id}/analyze")
    public ApiResponse<?> analyzeWrongQuestion(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return wrongQuestionRepository.findById(id)
                .filter(wq -> wq.getUserId().equals(userId))
                .map(wq -> ApiResponse.ok(Map.of(
                        "analysis", "建议复习相关知识点，注意常见错误类型",
                        "wrongQuestion", wq
                )))
                .orElse(ApiResponse.error("错题不存在"));
    }

    @PostMapping("/batch-analyze")
    public ApiResponse<?> batchAnalyze(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        @SuppressWarnings("unchecked")
        List<Number> ids = (List<Number>) body.get("wrongQuestionIds");
        if (ids == null) {
            return ApiResponse.error("wrongQuestionIds 不能为空");
        }

        List<Map<String, Object>> results = ids.stream()
                .map(id -> Map.<String, Object>of("id", id.longValue(), "success", true))
                .toList();
        return ApiResponse.ok(Map.of("results", results));
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).longValue() : null;
    }
}
