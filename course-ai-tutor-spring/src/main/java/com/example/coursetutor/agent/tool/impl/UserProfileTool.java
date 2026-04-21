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
                        "description": "操作类型: get_profile(获取用户画像), get_learning_stats(获取学习统计), get_exercise_history(获取答题历史), get_weak_points(获取薄弱点), get_progress(获取学习进度)",
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
            
            示例 3: 获取薄弱点
            action: "get_weak_points"
            user_id: 1
            结果: 返回用户薄弱知识点
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
        profile.put("goal", user.getGoal());
        profile.put("preferences", user.getPreferences());
        profile.put("createdAt", user.getCreatedAt());
        
        return ToolResult.success(profile.toString());
    }
    
    private ToolResult getLearningStats(Long userId, Map<String, Object> params) {
        int days = getIntParam(params, "days", 30);
        
        List<UserExercise> exercises = userExerciseRepository.findAll().stream()
                .filter(e -> e.getUserId().equals(userId))
                .filter(e -> e.getCreatedAt() != null)
                .collect(Collectors.toList());
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalExercises", exercises.size());
        stats.put("correctCount", exercises.stream().filter(UserExercise::isCorrect).count());
        stats.put("totalTime", exercises.stream().mapToLong(e -> e.getTimeSpent() != null ? e.getTimeSpent() : 0).sum());
        
        // 计算正确率
        long correctCount = exercises.stream().filter(UserExercise::isCorrect).count();
        double accuracy = exercises.isEmpty() ? 0 : (correctCount * 100.0 / exercises.size());
        stats.put("accuracy", String.format("%.2f%%", accuracy));
        
        // 统计按类型
        Map<String, Long> byType = exercises.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getType() != null ? e.getType() : "UNKNOWN",
                        Collectors.counting()
                ));
        stats.put("byType", byType);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("userId", userId);
        metadata.put("days", days);
        metadata.put("queryTime", new Date());
        
        return ToolResult.success(stats.toString(), metadata);
    }
    
    private ToolResult getExerciseHistory(Long userId, Map<String, Object> params) {
        int limit = getIntParam(params, "limit", 20);
        
        List<UserExercise> exercises = userExerciseRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        List<Map<String, Object>> history = exercises.stream()
                .limit(limit)
                .map(e -> {
                    Map<String, Object> record = new HashMap<>();
                    record.put("id", e.getId());
                    record.put("exerciseId", e.getExerciseId());
                    record.put("type", e.getType());
                    record.put("correct", e.isCorrect());
                    record.put("timeSpent", e.getTimeSpent());
                    record.put("createdAt", e.getCreatedAt());
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
        
        List<UserExercise> exercises = userExerciseRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // 分析错题，找出薄弱点
        Map<String, Long> errorCountByType = exercises.stream()
                .filter(e -> !e.isCorrect())
                .collect(Collectors.groupingBy(
                        e -> e.getType() != null ? e.getType() : "UNKNOWN",
                        Collectors.counting()
                ));
        
        // 找出错误最多的类型
        List<Map.Entry<String, Long>> weakPoints = errorCountByType.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toList());
        
        List<Map<String, Object>> result = weakPoints.stream()
                .map(entry -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("topic", entry.getKey());
                    point.put("errorCount", entry.getValue());
                    point.put("suggestion", getSuggestion(entry.getKey(), entry.getValue()));
                    return point;
                })
                .collect(Collectors.toList());
        
        return ToolResult.success(result.toString());
    }
    
    private ToolResult getProgress(Long userId) {
        List<UserExercise> exercises = userExerciseRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // 简化：按周统计进度
        Map<String, Object> progress = new HashMap<>();
        progress.put("totalExercises", exercises.size());
        progress.put("completedTopics", exercises.stream()
                .map(e -> e.getType())
                .filter(Objects::nonNull)
                .distinct()
                .count());
        
        // 计算总体正确率趋势
        if (exercises.size() >= 10) {
            List<UserExercise> recent = exercises.subList(0, Math.min(10, exercises.size()));
            long recentCorrect = recent.stream().filter(UserExercise::isCorrect).count();
            double recentAccuracy = recentCorrect * 100.0 / recent.size();
            progress.put("recentAccuracy", String.format("%.2f%%", recentAccuracy));
        }
        
        return ToolResult.success(progress.toString());
    }
    
    private String getSuggestion(String topic, Long errorCount) {
        if (errorCount > 10) {
            return String.format("需要在 %s 上加强练习，建议专项训练", topic);
        } else if (errorCount > 5) {
            return String.format("%s 需要复习相关知识点", topic);
        } else {
            return String.format("%s 偶尔出错，注意总结", topic);
        }
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
