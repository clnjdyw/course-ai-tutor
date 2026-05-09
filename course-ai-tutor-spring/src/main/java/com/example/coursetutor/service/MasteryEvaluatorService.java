package com.example.coursetutor.service;

import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.entity.UserExercise;
import com.example.coursetutor.entity.LearningRecord;
import com.example.coursetutor.repository.UserProgressRepository;
import com.example.coursetutor.repository.UserExerciseRepository;
import com.example.coursetutor.repository.LearningRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Evaluates mastery level using weighted composite scoring
 */
@Service
@RequiredArgsConstructor
public class MasteryEvaluatorService {

    private final UserProgressRepository userProgressRepository;
    private final UserExerciseRepository userExerciseRepository;
    private final LearningRecordRepository learningRecordRepository;

    // Weights for mastery calculation
    private static final double EXERCISE_WEIGHT = 0.4;
    private static final double REVIEW_WEIGHT = 0.3;
    private static final double ENGAGEMENT_WEIGHT = 0.3;

    public double evaluateMastery(Long userId, Long knowledgePointId) {
        double exerciseScore = calculateExerciseScore(userId, knowledgePointId);
        double reviewScore = calculateReviewScore(userId, knowledgePointId);
        double engagementScore = calculateEngagementScore(userId, knowledgePointId);

        return exerciseScore * EXERCISE_WEIGHT
                + reviewScore * REVIEW_WEIGHT
                + engagementScore * ENGAGEMENT_WEIGHT;
    }

    public void updateMastery(Long userId, Long knowledgePointId, double newMastery) {
        UserProgress progress = userProgressRepository
                .findByUserIdAndKnowledgePointId(userId, knowledgePointId)
                .orElse(null);

        if (progress == null) {
            progress = new UserProgress();
            progress.setUserId(userId);
            progress.setKnowledgePointId(knowledgePointId);
            progress.setMasteryLevel(0.0);
            progress.setReviewCount(0);
        }

        // Smooth update: blend old and new mastery
        double current = progress.getMasteryLevel();
        progress.setMasteryLevel(current * 0.7 + newMastery * 0.3);
        progress.setReviewCount(progress.getReviewCount() + 1);
        progress.setLastReviewed(LocalDateTime.now());

        userProgressRepository.save(progress);
    }

    public Map<String, Object> getMasteryReport(Long userId, Long knowledgePointId) {
        double mastery = evaluateMastery(userId, knowledgePointId);
        List<UserExercise> exercises = userExerciseRepository.findByUserId(userId);
        long totalExercises = exercises.size();
        long correctExercises = exercises.stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsCorrect())).count();

        return Map.of(
                "knowledgePointId", knowledgePointId,
                "masteryLevel", Math.round(mastery * 100.0) / 100.0,
                "level", masteryLevelLabel(mastery),
                "totalExercises", totalExercises,
                "correctExercises", correctExercises,
                "accuracy", totalExercises > 0 ? Math.round((double) correctExercises / totalExercises * 10000) / 100.0 : 0
        );
    }

    private double calculateExerciseScore(Long userId, Long knowledgePointId) {
        List<UserExercise> exercises = userExerciseRepository.findByUserIdAndKnowledgePointId(userId, knowledgePointId);
        if (exercises.isEmpty()) return 0;

        long correct = exercises.stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsCorrect())).count();
        return (double) correct / exercises.size();
    }

    private double calculateReviewScore(Long userId, Long knowledgePointId) {
        long reviewCount = learningRecordRepository.countByUserIdAndKnowledgePointId(userId, knowledgePointId);
        if (reviewCount == 0) return 0;
        return Math.min(1.0, reviewCount / 10.0);
    }

    private double calculateEngagementScore(Long userId, Long knowledgePointId) {
        // Based on time spent, interaction frequency, etc.
        Long totalDuration = learningRecordRepository.getTotalDurationByUserIdAndKnowledgePointId(userId, knowledgePointId);
        if (totalDuration == null || totalDuration == 0) return 0;
        return Math.min(1.0, totalDuration / 3600.0); // 1 hour = max score
    }

    private String masteryLevelLabel(double mastery) {
        if (mastery >= 0.9) return "expert";
        if (mastery >= 0.8) return "mastered";
        if (mastery >= 0.6) return "proficient";
        if (mastery >= 0.4) return "learning";
        if (mastery >= 0.2) return "beginner";
        return "not_started";
    }
}
