package com.example.coursetutor.service.tools;

import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.repository.UserProgressRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Learning progress tool for AI agents - check and update user progress
 */
@Service
public class LearningProgressTool {

    private final UserProgressRepository userProgressRepository;

    public LearningProgressTool(UserProgressRepository userProgressRepository) {
        this.userProgressRepository = userProgressRepository;
    }

    @Tool(description = "Get user's current mastery level for a specific knowledge point")
    public Map<String, Object> getMasteryLevel(Long userId, Long knowledgePointId) {
        return userProgressRepository.findByUserIdAndKnowledgePointId(userId, knowledgePointId)
                .map(progress -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("knowledgePointId", knowledgePointId);
                    map.put("masteryLevel", progress.getMasteryLevel());
                    map.put("reviewCount", progress.getReviewCount());
                    map.put("lastReviewed", progress.getLastReviewed() != null ? progress.getLastReviewed().toString() : "never");
                    return map;
                })
                .orElseGet(() -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("knowledgePointId", knowledgePointId);
                    map.put("masteryLevel", 0.0);
                    map.put("reviewCount", 0);
                    map.put("status", "not_started");
                    return map;
                });
    }

    @Tool(description = "Get user's weakest knowledge points (lowest mastery levels)")
    public List<Map<String, Object>> getWeakPoints(Long userId, int limit) {
        List<UserProgress> all = userProgressRepository.findByUserId(userId);
        return all.stream()
                .filter(p -> p.getMasteryLevel() < 0.6)
                .sorted(Comparator.comparingDouble(UserProgress::getMasteryLevel))
                .limit(limit)
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("knowledgePointId", p.getKnowledgePointId());
                    map.put("masteryLevel", p.getMasteryLevel());
                    map.put("reviewCount", p.getReviewCount());
                    return map;
                })
                .collect(Collectors.toList());
    }
}
