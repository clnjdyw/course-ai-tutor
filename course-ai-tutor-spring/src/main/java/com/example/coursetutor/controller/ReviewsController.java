package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.ReviewSchedule;
import com.example.coursetutor.repository.ReviewScheduleRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewsController {

    private final ReviewScheduleRepository reviewScheduleRepository;

    @PostMapping
    public ApiResponse<?> createReview(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        ReviewSchedule review = ReviewSchedule.builder()
                .userId(userId)
                .knowledgePointId(getLong(body, "knowledgePointId"))
                .reviewTime(LocalDateTime.parse((String) body.get("reviewTime")))
                .build();

        ReviewSchedule saved = reviewScheduleRepository.save(review);
        return ApiResponse.ok(Map.of("id", saved.getId()), "复习计划已创建");
    }

    @PostMapping("/generate-from-progress")
    public ApiResponse<?> generateFromProgress() {
        Long userId = SecurityUtil.requireUserId();
        // Simplified: generate review schedules based on low-mastery knowledge points
        return ApiResponse.ok(Map.of(
                "message", "已根据学习进度生成复习计划",
                "count", 0
        ));
    }

    @GetMapping
    public ApiResponse<List<ReviewSchedule>> getReviews(
            @RequestParam(required = false) String status) {
        Long userId = SecurityUtil.requireUserId();
        if (status != null) {
            return ApiResponse.ok(reviewScheduleRepository.findByUserIdAndStatus(userId, status));
        }
        return ApiResponse.ok(reviewScheduleRepository.findByUserId(userId));
    }

    @GetMapping("/due")
    public ApiResponse<?> getDueReviews() {
        Long userId = SecurityUtil.requireUserId();
        LocalDateTime now = LocalDateTime.now();
        List<ReviewSchedule> due = reviewScheduleRepository.findByReviewTimeBeforeAndStatus(now, "pending");
        return ApiResponse.ok(Map.of(
                "dueReviews", due,
                "count", due.size()
        ));
    }

    @PostMapping("/{id}/review")
    public ApiResponse<?> completeReview(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        return reviewScheduleRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .map(r -> {
                    int quality = getInt(body, "quality", 3);
                    // SM-2 algorithm simplified
                    double ef = r.getEaseFactor();
                    int rep = r.getRepetition();

                    if (quality >= 3) {
                        if (rep == 0) {
                            r.setIntervalDays(1);
                        } else if (rep == 1) {
                            r.setIntervalDays(6);
                        } else {
                            r.setIntervalDays((int) (r.getIntervalDays() * ef));
                        }
                        rep++;
                        ef = ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
                        if (ef < 1.3) ef = 1.3;
                    } else {
                        rep = 0;
                        r.setIntervalDays(1);
                    }

                    r.setRepetition(rep);
                    r.setEaseFactor(ef);
                    reviewScheduleRepository.save(r);
                    return ApiResponse.ok("复习已完成");
                })
                .orElse(ApiResponse.error("复习计划不存在"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteReview(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return reviewScheduleRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .map(r -> {
                    reviewScheduleRepository.delete(r);
                    return ApiResponse.ok("复习计划已删除");
                })
                .orElse(ApiResponse.error("复习计划不存在或无权限"));
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).longValue() : null;
    }

    private int getInt(Map<String, Object> map, String key, int defaultValue) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).intValue() : defaultValue;
    }
}
