package com.example.coursetutor.controller;

import com.example.coursetutor.entity.*;
import com.example.coursetutor.repository.*;
import com.example.coursetutor.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 学习数据控制器 - 处理学习计划、对话、记录、练习等
 */
@Slf4j
@RestController
@RequestMapping("/api/learning")
public class LearningController {

    @Autowired
    private StudyPlanRepository studyPlanRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private LearningRecordRepository learningRecordRepository;

    @Autowired
    private ExerciseRepository exerciseRepository;

    @Autowired
    private UserExerciseRepository userExerciseRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private Long extractUserId(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                return jwtUtil.getUserIdFromToken(token);
            }
        }
        return null;
    }

    // ==================== 学习计划 ====================

    @PostMapping("/plans")
    public ResponseEntity<Map<String, Object>> createPlan(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            StudyPlan plan = StudyPlan.builder()
                .userId(userId)
                .goal((String) request.get("goal"))
                .schedule((String) request.get("schedule"))
                .resources((String) request.get("resources"))
                .progress(request.get("progress") != null ? Double.parseDouble(request.get("progress").toString()) : 0.0)
                .status((String) request.getOrDefault("status", "active"))
                .build();

            studyPlanRepository.save(plan);
            response.put("success", true);
            response.put("data", plan);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("创建学习计划失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/plans")
    public ResponseEntity<Map<String, Object>> getPlans(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            List<StudyPlan> plans = studyPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
            response.put("success", true);
            response.put("data", plans);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // ==================== 对话历史 ====================

    @PostMapping("/conversations")
    public ResponseEntity<Map<String, Object>> createConversation(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            Conversation conversation = Conversation.builder()
                .userId(userId)
                .agentType((String) request.get("agentType"))
                .messages((String) request.get("messages"))
                .topic((String) request.get("topic"))
                .build();

            conversationRepository.save(conversation);
            response.put("success", true);
            response.put("data", conversation);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("保存对话失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<Map<String, Object>> getConversations(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String agentType) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            List<Conversation> conversations;
            if (agentType != null) {
                conversations = conversationRepository.findByUserIdAndAgentType(userId, agentType);
            } else {
                conversations = conversationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            }
            response.put("success", true);
            response.put("data", conversations);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // ==================== 学习记录 ====================

    @PostMapping("/records")
    public ResponseEntity<Map<String, Object>> createRecord(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            LearningRecord record = LearningRecord.builder()
                .userId(userId)
                .courseId(request.get("courseId") != null ? Long.parseLong(request.get("courseId").toString()) : null)
                .actionType((String) request.get("actionType"))
                .result((String) request.get("result"))
                .duration(request.get("duration") != null ? Integer.parseInt(request.get("duration").toString()) : null)
                .score(request.get("score") != null ? Double.parseDouble(request.get("score").toString()) : null)
                .build();

            learningRecordRepository.save(record);
            response.put("success", true);
            response.put("data", record);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("创建学习记录失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            long totalRecords = learningRecordRepository.countByUserId(userId);
            Double avgScore = learningRecordRepository.getAvgScoreByUserId(userId);
            Long totalDuration = learningRecordRepository.getTotalDurationByUserId(userId);
            long planCount = studyPlanRepository.countByUserId(userId);
            long exerciseCount = userExerciseRepository.countByUserId(userId);
            long correctCount = userExerciseRepository.countByUserIdAndIsCorrectTrue(userId);

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalRecords", totalRecords);
            statistics.put("avgScore", avgScore != null ? Math.round(avgScore * 100.0) / 100.0 : 0);
            statistics.put("totalDuration", totalDuration != null ? totalDuration : 0);
            statistics.put("planCount", planCount);
            statistics.put("exerciseCount", exerciseCount);
            statistics.put("correctCount", correctCount);
            statistics.put("accuracy", exerciseCount > 0 ? Math.round((double) correctCount / exerciseCount * 10000) / 100.0 : 0);

            List<LearningRecord> recentRecords = learningRecordRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().limit(20).collect(Collectors.toList());

            response.put("success", true);
            response.put("data", Map.of(
                "statistics", statistics,
                "records", recentRecords
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // ==================== 练习题 ====================

    @PostMapping("/exercises/submit")
    public ResponseEntity<Map<String, Object>> submitExercise(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            Long exerciseId = Long.parseLong(request.get("exerciseId").toString());
            String userAnswer = (String) request.get("userAnswer");

            Optional<Exercise> exerciseOpt = exerciseRepository.findById(exerciseId);
            if (exerciseOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "练习题不存在");
                return ResponseEntity.badRequest().body(response);
            }

            Exercise exercise = exerciseOpt.get();
            boolean isCorrect = exercise.getAnswer().trim().equalsIgnoreCase(userAnswer != null ? userAnswer.trim() : "");
            double score = isCorrect ? 100.0 : 0.0;

            UserExercise userExercise = UserExercise.builder()
                .userId(userId)
                .exerciseId(exerciseId)
                .userAnswer(userAnswer)
                .isCorrect(isCorrect)
                .score(score)
                .build();

            userExerciseRepository.save(userExercise);
            response.put("success", true);
            response.put("data", userExercise);
            response.put("correct", isCorrect);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("提交练习失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/exercises")
    public ResponseEntity<Map<String, Object>> getExercises(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            List<UserExercise> exercises = userExerciseRepository.findByUserIdOrderByCompletedAtDesc(userId);
            response.put("success", true);
            response.put("data", exercises);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
