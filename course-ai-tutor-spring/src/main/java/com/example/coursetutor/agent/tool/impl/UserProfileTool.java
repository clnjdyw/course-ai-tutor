package com.example.coursetutor.agent.tool.impl;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolResult;
import com.example.coursetutor.entity.User;
import com.example.coursetutor.entity.UserExercise;
import com.example.coursetutor.repository.UserRepository;
import com.example.coursetutor.repository.UserExerciseRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 用户画像工具 - 查询用户信息、学习记录、答题情况
 */
@Slf4j
@Component
public class UserProfileTool implements Tool {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserExerciseRepository userExerciseRepository;

    @Override
    public String getName() {
        return "user_profile";
    }

    @Override
    public String getDescription() {
        return "查询用户画像和学习数据，包括用户基本信息、学习记录、答题正确率、历史表现等。用于个性化服务和数据分析。";
    }

    @Override
    public String getParametersSchema() {
        return """
            {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "操作类型: get_profile, get_learning_stats, get_exercise_history, get_weak_points, get_progress",
                        "enum": ["get_profile", "get_learning_stats", "get_exercise_history", "get_weak_points", "get_progress"]
                    },
                    "user_id": {
                        "type": "number",
                        "description": "用户ID"
                    },
                    "days": {
                        "type": "number",
                        "description": "查询天数范围（默认30天）"
                    },
                    "limit": {
                        "type": "number",
                        "description": "返回记录数量限制"
                    }
                },
                "required": ["action", "user_id"]
            }
            """;
    }

    @Override
    public ToolResult execute(Map<String, Object> params) {
        Long userId = getLongParam(params, "user_id");
        String action = (String) params.get("action");

        if (userId == null) {
            return ToolResult.error("user_id 不能为空");
        }
        if (action == null) {
            return ToolResult.error("action 不能为空");
        }

        try {
            return switch (action.toLowerCase()) {
                case "get_profile" -> getProfile(userId);
                case "get_learning_stats" -> getLearningStats(userId, params);
                case "get_exercise_history" -> getExerciseHistory(userId, params);
                case "get_weak_points" -> getWeakPoints(userId, params);
                case "get_progress" -> getProgress(userId);
                default -> ToolResult.error("未知操作: " + action);
            };
        } catch (Exception e) {
            log.error("用户画像查询失败: userId={}, action={}", userId, action, e);
            return ToolResult.error("查询失败: " + e.getMessage());
        }
    }

    @Override
    public boolean validate(Map<String, Object> params) {
        return params != null && params.containsKey("user_id") && params.containsKey("action");
    }

    @Override
    public String getCategory() {
        return "user";
    }

    @Override
    public List<String> getTags() {
        return List.of("user", "用户", "学习", "记录", "统计", "画像", "答题");
    }

    @Override
    public String getExample() {
        return """
            示例 1: 获取用户画像
            action: "get_profile"
            user_id: 1
            结果: 返回用户基本信息

            示例 2: 获取学习统计
            action: "get_learning_stats"
            user_id: 1
            days: 30
            结果: 返回最近30天学习统计
            """;
    }

    private ToolResult getProfile(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ToolResult.error("用户不存在: " + userId);
        }

        User user = userOpt.get();
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("level", user.getLevel());
        profile.put("learningGoal", user.getLearningGoal());
        profile.put("subjectPreferences", user.getSubjectPreferences());
        profile.put("createdAt", user.getCreatedAt());

        return ToolResult.success(profile.toString());
    }

    private ToolResult getLearningStats(Long userId, Map<String, Object> params) {
        int days = getIntParam(params, "days", 30);

        List<UserExercise> exercises = userExerciseRepository.findAll().stream()
                .filter(e -> e.getUserId().equals(userId))
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalExercises", exercises.size());
        long correctCount = exercises.stream().filter(e -> Boolean.TRUE.equals(e.getIsCorrect())).count();
        stats.put("correctCount", correctCount);
        double accuracy = exercises.isEmpty() ? 0 : (correctCount * 100.0 / exercises.size());
        stats.put("accuracy", String.format("%.2f%%", accuracy));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("userId", userId);
        metadata.put("days", days);

        return ToolResult.success(stats.toString(), metadata);
    }

    private ToolResult getExerciseHistory(Long userId, Map<String, Object> params) {
        int limit = getIntParam(params, "limit", 20);

        List<UserExercise> exercises = userExerciseRepository.findByUserIdOrderByCompletedAtDesc(userId);

        List<Map<String, Object>> history = exercises.stream()
                .limit(limit)
                .map(e -> {
                    Map<String, Object> record = new HashMap<>();
                    record.put("id", e.getId());
                    record.put("exerciseId", e.getExerciseId());
                    record.put("correct", e.getIsCorrect());
                    record.put("score", e.getScore());
                    record.put("completedAt", e.getCompletedAt());
                    return record;
                })
                .collect(Collectors.toList());

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("total", exercises.size());
        metadata.put("returned", history.size());

        return ToolResult.success(history.toString(), metadata);
    }

    private ToolResult getWeakPoints(Long userId, Map<String, Object> params) {
        int limit = getIntParam(params, "limit", 10);

        List<UserExercise> exercises = userExerciseRepository.findByUserIdOrderByCompletedAtDesc(userId);

        // 找出错误最多的练习ID
        Map<Long, Long> errorCountById = exercises.stream()
                .filter(e -> Boolean.FALSE.equals(e.getIsCorrect()))
                .collect(Collectors.groupingBy(UserExercise::getExerciseId, Collectors.counting()));

        List<Map<String, Object>> result = errorCountById.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("exerciseId", entry.getKey());
                    point.put("errorCount", entry.getValue());
                    point.put("suggestion", getSuggestion(entry.getValue()));
                    return point;
                })
                .collect(Collectors.toList());

        return ToolResult.success(result.toString());
    }

    private String getSuggestion(Long errorCount) {
        if (errorCount > 10) {
            return "需要加强练习，建议专项训练";
        } else if (errorCount > 5) {
            return "需要复习相关知识点";
        } else {
            return "偶尔出错，注意总结";
        }
    }

    private ToolResult getProgress(Long userId) {
        List<UserExercise> exercises = userExerciseRepository.findByUserIdOrderByCompletedAtDesc(userId);

        Map<String, Object> progress = new HashMap<>();
        progress.put("totalExercises", exercises.size());

        if (exercises.size() >= 5) {
            List<UserExercise> recent = exercises.subList(0, Math.min(10, exercises.size()));
            long recentCorrect = recent.stream().filter(e -> Boolean.TRUE.equals(e.getIsCorrect())).count();
            double recentAccuracy = recentCorrect * 100.0 / recent.size();
            progress.put("recentAccuracy", String.format("%.2f%%", recentAccuracy));
        }

        return ToolResult.success(progress.toString());
    }

    private int getIntParam(Map<String, Object> params, String key, int defaultValue) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }

    private Long getLongParam(Map<String, Object> params, String key) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }
}
