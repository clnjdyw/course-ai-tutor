package com.example.coursetutor.service;

import com.example.coursetutor.entity.UserExercise;
import com.example.coursetutor.entity.UserProgress;
import com.example.coursetutor.repository.LearningRecordRepository;
import com.example.coursetutor.repository.UserExerciseRepository;
import com.example.coursetutor.repository.UserProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MasteryEvaluatorServiceTest {

    @Mock
    private UserProgressRepository userProgressRepository;

    @Mock
    private UserExerciseRepository userExerciseRepository;

    @Mock
    private LearningRecordRepository learningRecordRepository;

    private MasteryEvaluatorService service;

    @BeforeEach
    void setUp() {
        service = new MasteryEvaluatorService(userProgressRepository, userExerciseRepository, learningRecordRepository);
    }

    @Test
    @DisplayName("evaluateMastery returns composite score")
    void evaluateMastery_returnsCompositeScore() {
        Long userId = 1L;
        Long kpId = 10L;

        when(userExerciseRepository.findByUserIdAndKnowledgePointId(userId, kpId)).thenReturn(List.of(
                UserExercise.builder().id(1L).userId(userId).knowledgePointId(kpId).userAnswer("A").isCorrect(true).score(100.0).build(),
                UserExercise.builder().id(2L).userId(userId).knowledgePointId(kpId + 1).userAnswer("B").isCorrect(false).score(0.0).build(),
                UserExercise.builder().id(3L).userId(userId).knowledgePointId(kpId).userAnswer("C").isCorrect(true).score(100.0).build()
        ));
        when(learningRecordRepository.countByUserIdAndKnowledgePointId(userId, kpId)).thenReturn(5L);
        when(learningRecordRepository.getTotalDurationByUserIdAndKnowledgePointId(userId, kpId)).thenReturn(1800L);

        double mastery = service.evaluateMastery(userId, kpId);

        // exercise: 2/3 correct = 0.667, review: 5/10 = 0.5, engagement: 1800/3600 = 0.5
        // mastery = 0.667*0.4 + 0.5*0.3 + 0.5*0.3 = 0.267 + 0.15 + 0.15 = 0.567
        assertThat(mastery).isBetween(0.5, 0.6);
    }

    @Test
    @DisplayName("updateMastery creates new progress if not exists")
    void updateMastery_createsNewProgress() {
        Long userId = 1L;
        Long kpId = 10L;

        when(userProgressRepository.findByUserIdAndKnowledgePointId(userId, kpId)).thenReturn(Optional.empty());

        service.updateMastery(userId, kpId, 0.7);

        verify(userProgressRepository).save(any(UserProgress.class));
    }

    @Test
    @DisplayName("updateMastery updates existing progress with smooth blend")
    void updateMastery_updatesExistingProgress() {
        Long userId = 1L;
        Long kpId = 10L;
        UserProgress existing = UserProgress.builder().id(1L).userId(userId).knowledgePointId(kpId).masteryLevel(0.5).reviewCount(3).build();

        when(userProgressRepository.findByUserIdAndKnowledgePointId(userId, kpId)).thenReturn(Optional.of(existing));

        service.updateMastery(userId, kpId, 0.9);

        // Expected: 0.5 * 0.7 + 0.9 * 0.3 = 0.35 + 0.27 = 0.62
        assertThat(existing.getMasteryLevel()).isCloseTo(0.62, within(0.01));
        assertThat(existing.getReviewCount()).isEqualTo(4);
    }

    @Test
    @DisplayName("getMasteryReport returns correct labels")
    void getMasteryReport_returnsCorrectLabels() {
        Long userId = 1L;
        Long kpId = 10L;

        when(userExerciseRepository.findByUserIdAndKnowledgePointId(userId, kpId)).thenReturn(List.of(
                UserExercise.builder().id(1L).userId(userId).knowledgePointId(kpId).userAnswer("A").isCorrect(true).score(100.0).build(),
                UserExercise.builder().id(2L).userId(userId).knowledgePointId(kpId + 1).userAnswer("B").isCorrect(false).score(0.0).build()
        ));

        Map<String, Object> report = service.getMasteryReport(userId, kpId);

        assertThat(report).containsKey("masteryLevel");
        assertThat(report).containsKey("level");
    }

    private static org.assertj.core.data.Offset<Double> within(double delta) {
        return org.assertj.core.data.Offset.offset(delta);
    }
}
