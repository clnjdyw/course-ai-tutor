package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.LearningRecord;
import com.example.coursetutor.entity.UserExercise;
import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.entity.WrongQuestion;
import com.example.coursetutor.repository.*;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserProgressRepository userProgressRepository;
    private final UserExerciseRepository userExerciseRepository;
    private final LearningSessionRepository learningSessionRepository;
    private final LearningRecordRepository learningRecordRepository;
    private final WrongQuestionRepository wrongQuestionRepository;

    @GetMapping("/overview")
    public ApiResponse<?> overview() {
        Long userId = SecurityUtil.requireUserId();
        List<UserProgress> progress = userProgressRepository.findByUserId(userId);

        long mastered = progress.stream().filter(p -> p.getMasteryLevel() >= 0.8).count();
        long learning = progress.stream().filter(p -> p.getMasteryLevel() >= 0.5).count() - mastered;
        long notStarted = Math.max(0, progress.size() - mastered - learning);

        double avgMastery = progress.stream()
                .mapToDouble(UserProgress::getMasteryLevel)
                .average().orElse(0);

        Long totalDuration = learningSessionRepository.getTotalDurationByUserId(userId);
        long totalRecords = learningRecordRepository.countByUserId(userId);

        return ApiResponse.ok(Map.of(
                "totalKnowledgePoints", progress.size(),
                "masteredCount", mastered,
                "learningCount", learning,
                "notStartedCount", notStarted,
                "weakCount", wrongQuestionRepository.countByUserId(userId),
                "avgMastery", avgMastery,
                "totalDuration", totalDuration,
                "totalRecords", totalRecords,
                "avgScore", userExerciseRepository.getAvgScoreByUserId(userId)
        ));
    }

    @GetMapping("/trend")
    public ApiResponse<?> trend(@RequestParam(defaultValue = "30") int days) {
        Long userId = SecurityUtil.requireUserId();
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        long totalSessions = learningSessionRepository.countByUserIdAndStartTimeAfter(userId, since);

        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            trend.add(Map.of(
                    "date", date.toString(),
                    "duration", 0,
                    "sessions", (int) (totalSessions / days)
            ));
        }
        return ApiResponse.ok(trend);
    }

    @GetMapping("/mastery-distribution")
    public ApiResponse<?> masteryDistribution() {
        Long userId = SecurityUtil.requireUserId();
        List<UserProgress> progress = userProgressRepository.findByUserId(userId);

        long notStarted = progress.stream().filter(p -> p.getMasteryLevel() == 0).count();
        long beginner = progress.stream().filter(p -> p.getMasteryLevel() > 0 && p.getMasteryLevel() < 0.3).count();
        long learning = progress.stream().filter(p -> p.getMasteryLevel() >= 0.3 && p.getMasteryLevel() < 0.6).count();
        long proficient = progress.stream().filter(p -> p.getMasteryLevel() >= 0.6 && p.getMasteryLevel() < 0.8).count();
        long mastered = progress.stream().filter(p -> p.getMasteryLevel() >= 0.8).count();

        return ApiResponse.ok(Map.of(
                "notStarted", notStarted,
                "beginner", beginner,
                "learning", learning,
                "proficient", proficient,
                "mastered", mastered
        ));
    }

    @GetMapping("/exercise-stats")
    public ApiResponse<?> exerciseStats() {
        Long userId = SecurityUtil.requireUserId();
        List<UserExercise> exercises = userExerciseRepository.findByUserId(userId);

        long total = exercises.size();
        long correct = exercises.stream().filter(e -> Boolean.TRUE.equals(e.getIsCorrect())).count();
        double accuracy = total > 0 ? correct * 100.0 / total : 0;

        return ApiResponse.ok(Map.of(
                "totalExercises", total,
                "correctCount", correct,
                "accuracy", accuracy,
                "byKnowledgePoint", Map.of()
        ));
    }

    @GetMapping("/weak-points-trend")
    public ApiResponse<?> weakPointsTrend() {
        return ApiResponse.ok(List.of());
    }

    @GetMapping("/growth-curve")
    public ApiResponse<?> growthCurve() {
        Long userId = SecurityUtil.requireUserId();
        List<UserProgress> progress = userProgressRepository.findByUserId(userId);

        return ApiResponse.ok(Map.of(
                "growthCurve", List.of(),
                "masteryTrend", progress.stream().map(p -> Map.of(
                        "knowledgePointId", p.getKnowledgePointId(),
                        "masteryLevel", p.getMasteryLevel(),
                        "lastReviewed", p.getLastReviewed()
                )).toList()
        ));
    }
}
