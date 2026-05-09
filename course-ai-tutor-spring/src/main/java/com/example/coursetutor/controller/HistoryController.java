package com.example.coursetutor.controller;

import com.example.coursetutor.entity.BattleRecord;
import com.example.coursetutor.entity.Conversation;
import com.example.coursetutor.entity.StudyPlan;
import com.example.coursetutor.repository.BattleRecordRepository;
import com.example.coursetutor.repository.ConversationRepository;
import com.example.coursetutor.repository.StudyPlanRepository;
import com.example.coursetutor.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

/**
 * 历史记录控制器 - 统一提供5个功能的历史查询和保存接口
 */
@Slf4j
@RestController
@RequestMapping("/api/learning/history")
@RequiredArgsConstructor
public class HistoryController {

    private final StudyPlanRepository studyPlanRepository;
    private final ConversationRepository conversationRepository;
    private final BattleRecordRepository battleRecordRepository;
    private final JwtUtil jwtUtil;

    private Long extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                return jwtUtil.getUserIdFromToken(token);
            }
        }
        return null;
    }

    // ==================== 学习规划历史 ====================

    @GetMapping("/planner")
    public ResponseEntity<Map<String, Object>> getPlannerHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return unauthorized(response);

            Pageable pageable = PageRequest.of(page, size);
            Map<String, Object> params = parseSearchParams(keyword, startDate, endDate);
            Page<StudyPlan> plans = studyPlanRepository.searchByUserId(userId,
                    (String) params.get("keyword"),
                    (LocalDateTime) params.get("startDate"),
                    (LocalDateTime) params.get("endDate"),
                    pageable);

            response.put("success", true);
            response.put("data", plans.getContent());
            response.put("total", plans.getTotalElements());
            response.put("pages", plans.getTotalPages());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取规划历史失败", e);
            return error(response, e.getMessage());
        }
    }

    @PostMapping("/planner")
    public ResponseEntity<Map<String, Object>> savePlannerHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return unauthorized(response);

            StudyPlan plan = StudyPlan.builder()
                    .userId(userId)
                    .goal((String) request.get("goal"))
                    .planContent((String) request.get("planContent"))
                    .inputParams((String) request.get("inputParams"))
                    .status("active")
                    .progress(0.0)
                    .build();

            studyPlanRepository.save(plan);
            response.put("success", true);
            response.put("data", plan);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("保存规划历史失败", e);
            return error(response, e.getMessage());
        }
    }

    // ==================== 答疑历史 ====================

    @GetMapping("/helper")
    public ResponseEntity<Map<String, Object>> getHelperHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return getConversationHistory(authHeader, "helper", page, size, keyword, startDate, endDate);
    }

    // ==================== 教学历史 ====================

    @GetMapping("/tutor")
    public ResponseEntity<Map<String, Object>> getTutorHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return getConversationHistory(authHeader, "tutor", page, size, keyword, startDate, endDate);
    }

    // ==================== 评估历史 ====================

    @GetMapping("/evaluator")
    public ResponseEntity<Map<String, Object>> getEvaluatorHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return getConversationHistory(authHeader, "evaluator", page, size, keyword, startDate, endDate);
    }

    // ==================== 对话保存（通用） ====================

    @PostMapping("/conversation")
    public ResponseEntity<Map<String, Object>> saveConversation(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return unauthorized(response);

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
            log.error("保存对话历史失败", e);
            return error(response, e.getMessage());
        }
    }

    // ==================== 对战历史 ====================

    @GetMapping("/battle")
    public ResponseEntity<Map<String, Object>> getBattleHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return unauthorized(response);

            Pageable pageable = PageRequest.of(page, size);
            Map<String, Object> params = parseSearchParams(keyword, startDate, endDate);
            Page<BattleRecord> records = battleRecordRepository.searchByUserId(userId,
                    (String) params.get("keyword"),
                    (LocalDateTime) params.get("startDate"),
                    (LocalDateTime) params.get("endDate"),
                    pageable);

            long wins = battleRecordRepository.countByUserIdAndResult(userId, "win");
            long losses = battleRecordRepository.countByUserIdAndResult(userId, "lose");
            long ties = battleRecordRepository.countByUserIdAndResult(userId, "tie");

            response.put("success", true);
            response.put("data", records.getContent());
            response.put("total", records.getTotalElements());
            response.put("pages", records.getTotalPages());
            response.put("stats", Map.of("wins", wins, "losses", losses, "ties", ties));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取对战历史失败", e);
            return error(response, e.getMessage());
        }
    }

    @PostMapping("/battle")
    public ResponseEntity<Map<String, Object>> saveBattleRecord(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return unauthorized(response);

            BattleRecord record = BattleRecord.builder()
                    .userId(userId)
                    .opponentName((String) request.get("opponentName"))
                    .roomId((String) request.get("roomId"))
                    .myScore(request.get("myScore") != null ? Integer.parseInt(request.get("myScore").toString()) : 0)
                    .opponentScore(request.get("opponentScore") != null ? Integer.parseInt(request.get("opponentScore").toString()) : 0)
                    .result((String) request.get("result"))
                    .ratingChange(request.get("ratingChange") != null ? Integer.parseInt(request.get("ratingChange").toString()) : 0)
                    .expGained(request.get("expGained") != null ? Integer.parseInt(request.get("expGained").toString()) : 0)
                    .detail((String) request.get("detail"))
                    .durationSeconds(request.get("durationSeconds") != null ? Integer.parseInt(request.get("durationSeconds").toString()) : 0)
                    .build();

            battleRecordRepository.save(record);
            response.put("success", true);
            response.put("data", record);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("保存对战记录失败", e);
            return error(response, e.getMessage());
        }
    }

    // ==================== 私有辅助方法 ====================

    private ResponseEntity<Map<String, Object>> getConversationHistory(
            String authHeader, String agentType, int page, int size,
            String keyword, String startDate, String endDate) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) return unauthorized(response);

            Pageable pageable = PageRequest.of(page, size);
            Map<String, Object> params = parseSearchParams(keyword, startDate, endDate);
            Page<Conversation> conversations = conversationRepository.searchByUserIdAndAgentType(userId, agentType,
                    (String) params.get("keyword"),
                    (LocalDateTime) params.get("startDate"),
                    (LocalDateTime) params.get("endDate"),
                    pageable);

            response.put("success", true);
            response.put("data", conversations.getContent());
            response.put("total", conversations.getTotalElements());
            response.put("pages", conversations.getTotalPages());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取{}历史失败", agentType, e);
            return error(response, e.getMessage());
        }
    }

    private ResponseEntity<Map<String, Object>> unauthorized(Map<String, Object> response) {
        response.put("success", false);
        response.put("message", "未认证");
        return ResponseEntity.status(401).body(response);
    }

    private ResponseEntity<Map<String, Object>> error(Map<String, Object> response, String message) {
        response.put("success", false);
        response.put("message", message);
        return ResponseEntity.status(500).body(response);
    }

    private LocalDateTime parseStartDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr).atStartOfDay();
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("开始日期格式错误，应为 yyyy-MM-dd");
        }
    }

    private LocalDateTime parseEndDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr).atTime(23, 59, 59);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("结束日期格式错误，应为 yyyy-MM-dd");
        }
    }

    private Map<String, Object> parseSearchParams(String keyword, String startDate, String endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("keyword", (keyword != null && !keyword.isBlank()) ? keyword : null);
        params.put("startDate", parseStartDate(startDate));
        params.put("endDate", parseEndDate(endDate));
        return params;
    }
}
