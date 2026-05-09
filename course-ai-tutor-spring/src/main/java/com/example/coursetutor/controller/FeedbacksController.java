package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.LearningFeedback;
import com.example.coursetutor.repository.LearningFeedbackRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbacksController {

    private final LearningFeedbackRepository learningFeedbackRepository;

    @PostMapping
    public ApiResponse<?> create(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();

        LearningFeedback feedback = new LearningFeedback();
        feedback.setUserId(userId);
        if (request.containsKey("planId")) {
            feedback.setPlanId(Long.parseLong(request.get("planId").toString()));
        }
        if (request.containsKey("rating")) {
            feedback.setRating(Integer.parseInt(request.get("rating").toString()));
        }
        if (request.containsKey("content")) {
            feedback.setFeedback((String) request.get("content"));
        }
        feedback.setCreatedAt(LocalDateTime.now());

        learningFeedbackRepository.save(feedback);
        return ApiResponse.ok(feedback);
    }

    @GetMapping
    public ApiResponse<?> list() {
        Long userId = SecurityUtil.requireUserId();
        List<LearningFeedback> feedbacks = learningFeedbackRepository.findByUserId(userId);
        return ApiResponse.ok(feedbacks);
    }

    @GetMapping("/stats")
    public ApiResponse<?> stats() {
        Long userId = SecurityUtil.requireUserId();
        long total = learningFeedbackRepository.countByUserId(userId);
        Double avgRating = learningFeedbackRepository.getAverageRatingByUserId(userId);
        return ApiResponse.ok(Map.of(
                "totalFeedbacks", total,
                "averageRating", avgRating != null ? avgRating : 0
        ));
    }

    @PostMapping("/adjust-plan")
    public ApiResponse<?> adjustPlan(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Plan adjustment initiated based on feedback"));
    }
}
