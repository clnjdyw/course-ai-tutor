package com.example.coursetutor.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ActivityHookServiceTest {

    private ActivityHookService service;

    @BeforeEach
    void setUp() {
        service = new ActivityHookService();
    }

    @Test
    @DisplayName("onExerciseCompleted returns correct XP and level")
    void onExerciseCompleted_returnsCorrectXp() {
        Long userId = 1L;
        Map<String, Object> result = service.onExerciseCompleted(userId, 1);

        assertThat(result.get("xpEarned")).isEqualTo(10);
        assertThat(result.get("eventType")).isEqualTo("exercise_completed");
        assertThat(result).containsKey("totalXp");
        assertThat(result).containsKey("level");
    }

    @Test
    @DisplayName("onKnowledgeMastered gives higher XP reward")
    void onKnowledgeMastered_givesHigherXp() {
        Long userId = 1L;
        Map<String, Object> result = service.onKnowledgeMastered(userId, 1);

        assertThat(result.get("xpEarned")).isEqualTo(50);
    }

    @Test
    @DisplayName("level increases as XP accumulates")
    void level_increasesWithXp() {
        Long userId = 1L;

        Map<String, Object> result1 = service.onExerciseCompleted(userId, 10);
        assertThat(result1.get("level")).isEqualTo(2); // 10*10=100 XP, threshold for level 2 is 100

        Map<String, Object> result2 = service.onKnowledgeMastered(userId, 2); // +100 XP = 110 total
        assertThat(result2.get("level")).isEqualTo(2); // 110 >= 100, still level 2
    }

    @Test
    @DisplayName("achievements unlock at XP thresholds")
    void achievements_unlockAtThresholds() {
        Long userId = 1L;

        // Grant 1000+ XP in a single call (service is stateless per call)
        Map<String, Object> result = service.onKnowledgeMastered(userId, 20); // 20 * 50 = 1000 XP

        @SuppressWarnings("unchecked")
        java.util.List<String> achievements = (java.util.List<String>) result.get("newAchievements");
        assertThat(achievements).contains("first_thousand");
    }
}
