package com.example.coursetutor.service.tools;

import com.example.coursetutor.entity.WrongQuestion;
import com.example.coursetutor.repository.WrongQuestionRepository;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Wrong question analysis tool for AI agents
 */
@Service
public class WrongQuestionTool {

    private final WrongQuestionRepository wrongQuestionRepository;

    public WrongQuestionTool(WrongQuestionRepository wrongQuestionRepository) {
        this.wrongQuestionRepository = wrongQuestionRepository;
    }

    @Tool(description = "Get user's wrong questions that haven't been mastered yet")
    public List<Map<String, Object>> getUnmasteredQuestions(Long userId) {
        List<WrongQuestion> questions = wrongQuestionRepository.findByUserIdAndMasteredFalse(userId);
        return questions.stream()
                .map(wq -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", wq.getId());
                    map.put("exerciseId", wq.getExerciseId());
                    map.put("userAnswer", wq.getUserAnswer() != null ? wq.getUserAnswer() : "");
                    map.put("correctAnswer", wq.getCorrectAnswer() != null ? wq.getCorrectAnswer() : "");
                    map.put("errorAnalysis", wq.getErrorAnalysis() != null ? wq.getErrorAnalysis() : "");
                    map.put("reviewCount", wq.getReviewCount());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Tool(description = "Get statistics about user's wrong questions")
    public Map<String, Object> getWrongQuestionStats(Long userId) {
        List<WrongQuestion> all = wrongQuestionRepository.findByUserId(userId);
        long total = all.size();
        long mastered = all.stream().filter(WrongQuestion::getMastered).count();

        return Map.of(
                "total", total,
                "mastered", mastered,
                "unmastered", total - mastered
        );
    }
}
