package com.example.coursetutor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Activity hooks for XP, level, and achievement system
 */
@Service
@RequiredArgsConstructor
public class ActivityHookService {

    // XP rewards for different actions
    private static final int XP_COMPLETE_EXERCISE = 10;
    private static final int XP_MASTER_KNOWLEDGE = 50;
    private static final int XP_COMPLETE_SESSION = 20;
    private static final int XP_CREATE_NOTE = 5;

    // Level thresholds
    private static final int[] LEVEL_THRESHOLDS = {
            0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500,
            5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000
    };

    public Map<String, Object> onExerciseCompleted(Long userId, int count) {
        int xpEarned = count * XP_COMPLETE_EXERCISE;
        return processXp(userId, xpEarned, "exercise_completed");
    }

    public Map<String, Object> onKnowledgeMastered(Long userId, int count) {
        int xpEarned = count * XP_MASTER_KNOWLEDGE;
        return processXp(userId, xpEarned, "knowledge_mastered");
    }

    public Map<String, Object> onSessionCompleted(Long userId) {
        return processXp(userId, XP_COMPLETE_SESSION, "session_completed");
    }

    public Map<String, Object> onNoteCreated(Long userId) {
        return processXp(userId, XP_CREATE_NOTE, "note_created");
    }

    private Map<String, Object> processXp(Long userId, int xpEarned, String eventType) {
        // In production, this would update user's XP in the database
        int totalXp = xpEarned; // Simplified - would load from DB
        int level = calculateLevel(totalXp);
        List<String> newAchievements = checkAchievements(userId, eventType, totalXp);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("xpEarned", xpEarned);
        result.put("totalXp", totalXp);
        result.put("level", level);
        result.put("nextLevelXp", getNextLevelXp(level));
        result.put("newAchievements", newAchievements);
        result.put("eventType", eventType);
        return result;
    }

    private int calculateLevel(int totalXp) {
        for (int i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (totalXp >= LEVEL_THRESHOLDS[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    private int getNextLevelXp(int currentLevel) {
        if (currentLevel >= LEVEL_THRESHOLDS.length) return -1;
        return LEVEL_THRESHOLDS[currentLevel];
    }

    private List<String> checkAchievements(Long userId, String eventType, int totalXp) {
        List<String> achievements = new ArrayList<>();
        if (totalXp >= 1000) achievements.add("first_thousand");
        if (totalXp >= 5000) achievements.add("xp_master");
        if (totalXp >= 10000) achievements.add("knowledge_seeker");
        return achievements;
    }
}
