package com.example.coursetutor.service;

import com.example.coursetutor.entity.KnowledgePoint;
import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.repository.KnowledgePointRepository;
import com.example.coursetutor.repository.UserProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KnowledgeRecommendationServiceTest {

    @Mock
    private UserProgressRepository userProgressRepository;

    @Mock
    private KnowledgePointRepository knowledgePointRepository;

    private KnowledgeRecommendationService service;

    @BeforeEach
    void setUp() {
        service = new KnowledgeRecommendationService(userProgressRepository, knowledgePointRepository);
    }

    @Test
    @DisplayName("Recommend returns items sorted by priority (highest first)")
    void recommend_returnsHighestPriorityFirst() {
        Long userId = 1L;

        UserProgress p1 = UserProgress.builder().knowledgePointId(1L).masteryLevel(0.2).build();
        UserProgress p2 = UserProgress.builder().knowledgePointId(2L).masteryLevel(0.9).build();
        when(userProgressRepository.findByUserId(userId)).thenReturn(List.of(p1, p2));

        KnowledgePoint kp1 = KnowledgePoint.builder().id(1L).title("Math Basics").difficulty(1).build();
        KnowledgePoint kp2 = KnowledgePoint.builder().id(2L).title("Advanced Math").difficulty(4).build();
        when(knowledgePointRepository.findAll()).thenReturn(List.of(kp1, kp2));

        List<Map<String, Object>> result = service.recommend(userId, 5);

        assertThat(result).hasSize(1); // Only kp1 (kp2 is mastered at 0.9)
        assertThat((long) result.get(0).get("knowledgePointId")).isEqualTo(1L);
    }

    @Test
    @DisplayName("Recommend filters out mastered items (>= 0.8)")
    void recommend_filtersMasteredItems() {
        Long userId = 1L;

        UserProgress mastered = UserProgress.builder().knowledgePointId(1L).masteryLevel(0.85).build();
        when(userProgressRepository.findByUserId(userId)).thenReturn(List.of(mastered));

        KnowledgePoint kp1 = KnowledgePoint.builder().id(1L).title("Mastered Topic").difficulty(3).build();
        when(knowledgePointRepository.findAll()).thenReturn(List.of(kp1));

        List<Map<String, Object>> result = service.recommend(userId, 5);

        assertThat(result).isEmpty();
    }
}
