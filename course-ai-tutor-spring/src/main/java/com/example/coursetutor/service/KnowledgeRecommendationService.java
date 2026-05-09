package com.example.coursetutor.service;

import com.example.coursetutor.entity.KnowledgePoint;
import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.repository.KnowledgePointRepository;
import com.example.coursetutor.repository.UserProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Adaptive recommendation based on user progress and knowledge graph
 */
@Service
@RequiredArgsConstructor
public class KnowledgeRecommendationService {

    private final UserProgressRepository userProgressRepository;
    private final KnowledgePointRepository knowledgePointRepository;

    public List<Map<String, Object>> recommend(Long userId, int limit) {
        List<UserProgress> progressList = userProgressRepository.findByUserId(userId);
        Map<Long, Double> masteryMap = progressList.stream()
                .collect(Collectors.toMap(UserProgress::getKnowledgePointId, UserProgress::getMasteryLevel));

        List<KnowledgePoint> allPoints = knowledgePointRepository.findAll();

        // Score each knowledge point based on:
        // 1. Low mastery = higher priority
        // 2. Prerequisites satisfied = ready to learn
        // 3. Higher difficulty progression
        List<Map<String, Object>> scored = allPoints.stream()
                .filter(kp -> masteryMap.getOrDefault(kp.getId(), 0.0) < 0.8) // Not yet mastered
                .map(kp -> {
                    double mastery = masteryMap.getOrDefault(kp.getId(), 0.0);
                    boolean prereqsMet = arePrerequisitesMet(kp, masteryMap);
                    double priority = calculatePriority(kp, mastery, prereqsMet);

                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("knowledgePointId", kp.getId());
                    item.put("title", kp.getTitle());
                    item.put("difficulty", kp.getDifficulty());
                    item.put("masteryLevel", mastery);
                    item.put("prerequisitesMet", prereqsMet);
                    item.put("priority", priority);
                    item.put("reason", determineReason(kp, mastery, prereqsMet));
                    return item;
                })
                .sorted(Comparator.comparingDouble((Map<String, Object> m) -> (double) m.get("priority")).reversed())
                .limit(limit)
                .toList();

        return scored;
    }

    private boolean arePrerequisitesMet(KnowledgePoint kp, Map<Long, Double> masteryMap) {
        if (kp.getPrerequisites() == null || kp.getPrerequisites().isEmpty()) {
            return true;
        }
        for (String prereqStr : kp.getPrerequisites().split(",")) {
            try {
                long prereqId = Long.parseLong(prereqStr.trim());
                double mastery = masteryMap.getOrDefault(prereqId, 0.0);
                if (mastery < 0.5) return false; // Prerequisite not sufficiently learned
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return true;
    }

    private double calculatePriority(KnowledgePoint kp, double mastery, boolean prereqsMet) {
        double priority = 0;
        // Low mastery increases priority
        priority += (1 - mastery) * 50;
        // Prerequisites met gives bonus
        if (prereqsMet) priority += 30;
        // Moderate difficulty items are prioritized (not too easy, not too hard)
        priority += (3 - Math.abs(kp.getDifficulty() - 3)) * 5;
        return priority;
    }

    private String determineReason(KnowledgePoint kp, double mastery, boolean prereqsMet) {
        if (mastery == 0) return "New topic to explore";
        if (mastery < 0.3) return "Continue building foundation";
        if (mastery < 0.5) return "Making progress, keep practicing";
        if (prereqsMet) return "Ready for advanced content";
        return "Review prerequisites first";
    }
}
