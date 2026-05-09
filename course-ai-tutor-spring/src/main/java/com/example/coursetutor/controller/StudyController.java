package com.example.coursetutor.controller;

import com.example.coursetutor.entity.LearningSession;
import com.example.coursetutor.repository.LearningSessionRepository;
import com.example.coursetutor.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 学习会话控制器 - 对应 Node.js 的 /api/study 路由组
 * StudyCoordinator 相关端点
 */
@Slf4j
@RestController
@RequestMapping("/api/study")
public class StudyController {

    @Autowired
    private LearningSessionRepository sessionRepository;

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

    // ==================== 学习会话管理 ====================

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startSession(
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

            String activityType = (String) request.getOrDefault("activityType", "study");
            String metadata = request.get("metadata") != null ? request.get("metadata").toString() : null;

            LearningSession session = LearningSession.builder()
                .userId(userId)
                .activityType(activityType)
                .startTime(LocalDateTime.now())
                .metadata(metadata)
                .duration(0)
                .build();

            sessionRepository.save(session);
            response.put("success", true);
            response.put("data", Map.of("sessionId", session.getId(), "startTime", session.getStartTime()));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("启动学习会话失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/end")
    public ResponseEntity<Map<String, Object>> endSession(
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

            Long sessionId = request.get("sessionId") != null ? Long.parseLong(request.get("sessionId").toString()) : null;
            Optional<LearningSession> sessionOpt;

            if (sessionId != null) {
                sessionOpt = sessionRepository.findById(sessionId);
            } else {
                // 找到最近一个未结束的会话
                List<LearningSession> active = sessionRepository.findByUserIdAndEndTimeIsNull(userId);
                sessionOpt = active.isEmpty() ? Optional.empty() : Optional.of(active.get(0));
            }

            if (sessionOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "没有活跃的学习会话");
                return ResponseEntity.badRequest().body(response);
            }

            LearningSession session = sessionOpt.get();
            LocalDateTime endTime = LocalDateTime.now();
            int duration = (int) Duration.between(session.getStartTime(), endTime).toMinutes();
            session.setEndTime(endTime);
            session.setDuration(duration);
            sessionRepository.save(session);

            response.put("success", true);
            response.put("data", Map.of("sessionId", session.getId(), "duration", duration, "endTime", endTime));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("结束学习会话失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/session")
    public ResponseEntity<Map<String, Object>> getCurrentSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            List<LearningSession> active = sessionRepository.findByUserIdAndEndTimeIsNull(userId);
            if (active.isEmpty()) {
                response.put("success", true);
                response.put("data", null);
            } else {
                LearningSession session = active.get(0);
                int currentDuration = (int) Duration.between(session.getStartTime(), LocalDateTime.now()).toMinutes();
                response.put("success", true);
                response.put("data", Map.of(
                    "sessionId", session.getId(),
                    "activityType", session.getActivityType(),
                    "startTime", session.getStartTime(),
                    "currentDuration", currentDuration
                ));
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    // ==================== 学习模式切换 ====================

    @PostMapping("/mode")
    public ResponseEntity<Map<String, Object>> switchMode(
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

            String mode = (String) request.get("mode");
            response.put("success", true);
            response.put("data", Map.of("mode", mode, "message", "模式切换成功"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("切换学习模式失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    // ==================== 学习输入 & 反馈 ====================

    @PostMapping("/input")
    public ResponseEntity<Map<String, Object>> submitInput(
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

            String inputType = (String) request.get("inputType");
            String content = (String) request.get("content");

            response.put("success", true);
            response.put("data", Map.of("message", "输入已接收"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("处理学习输入失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/exercise-feedback")
    public ResponseEntity<Map<String, Object>> submitExerciseFeedback(
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

            response.put("success", true);
            response.put("data", Map.of("message", "反馈已接收"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("提交练习反馈失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/eval-correct")
    public ResponseEntity<Map<String, Object>> evalCorrect(
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

            String question = (String) request.get("question");
            String answer = (String) request.get("answer");
            String userAnswer = (String) request.get("userAnswer");
            boolean isCorrect = answer != null && userAnswer != null &&
                answer.trim().equalsIgnoreCase(userAnswer.trim());

            response.put("success", true);
            response.put("data", Map.of(
                "isCorrect", isCorrect,
                "correctAnswer", answer != null ? answer : "",
                "explanation", "AI 解析待实现"
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("答案批改失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }
}
