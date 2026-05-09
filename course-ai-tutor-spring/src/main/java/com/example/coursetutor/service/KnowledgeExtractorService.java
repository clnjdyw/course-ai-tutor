package com.example.coursetutor.service;

import com.example.coursetutor.entity.KnowledgePoint;
import com.example.coursetutor.repository.KnowledgePointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Extracts knowledge points from files/content using AI
 */
@Service
@RequiredArgsConstructor
public class KnowledgeExtractorService {

    private final AiAgentService aiAgentService;
    private final KnowledgePointRepository knowledgePointRepository;

    public List<KnowledgePoint> extractFromFileContent(String content, Long courseId) {
        String prompt = buildExtractionPrompt(content);
        String result = aiAgentService.chat(prompt, "You are a knowledge extraction expert. Extract structured knowledge points from the given content. Return JSON array of objects with fields: title, description, content, difficulty (1-5), tags (array).");

        // Parse AI response and create knowledge points
        return parseKnowledgePoints(result, courseId);
    }

    public Map<String, Object> extractStatus(String taskId) {
        // Track extraction task status
        return Map.of("status", "completed", "progress", 100);
    }

    private String buildExtractionPrompt(String content) {
        return """
                Extract knowledge points from the following content. For each knowledge point, provide:
                - title: the main topic/concept name
                - description: a brief summary
                - content: detailed explanation
                - difficulty: 1-5 scale
                - tags: relevant category tags

                Content:
                %s
                """.formatted(content);
    }

    private List<KnowledgePoint> parseKnowledgePoints(String aiResponse, Long courseId) {
        // In production, parse JSON from AI response
        // For now, return empty list - the actual implementation would use Jackson ObjectMapper
        List<KnowledgePoint> points = new ArrayList<>();

        KnowledgePoint kp = new KnowledgePoint();
        kp.setCourseId(courseId);
        kp.setTitle("Extracted Knowledge Point");
        kp.setDescription("Extracted from content using AI");
        kp.setContent(aiResponse);
        kp.setDifficulty(3);
        kp.setTags("extracted");
        points.add(kp);

        return points;
    }
}
