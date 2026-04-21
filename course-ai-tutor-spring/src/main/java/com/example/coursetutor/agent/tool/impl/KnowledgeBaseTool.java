package com.example.coursetutor.agent.tool.impl;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolResult;
import com.example.coursetutor.entity.Course;
import com.example.coursetutor.entity.Exercise;
import com.example.coursetutor.entity.StudyPlan;
import com.example.coursetutor.repository.CourseRepository;
import com.example.coursetutor.repository.ExerciseRepository;
import com.example.coursetutor.repository.StudyPlanRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 知识库工具 - 查询课程、知识点、练习题等信息
 */
@Slf4j
@Component
public class KnowledgeBaseTool implements Tool {
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private ExerciseRepository exerciseRepository;
    
    @Autowired
    private StudyPlanRepository studyPlanRepository;
    
    @Override
    public String getName() {
        return "knowledge_base";
    }
    
    @Override
    public String getDescription() {
        return "查询知识库内容，包括课程信息、知识点、练习题、学习计划等。用于回答关于课程内容、查找相关资料等场景。";
    }
    
    @Override
    public String getParametersSchema() {
        return """
            {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "操作类型: search_courses(搜索课程), get_course(获取课程详情), search_exercises(搜索练习题), get_knowledge_points(获取知识点), search_plans(搜索学习计划)",
                        "enum": ["search_courses", "get_course", "search_exercises", "get_knowledge_points", "search_plans"]
                    },
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "course_id": {
                        "type": "number",
                        "description": "课程ID（用于获取课程详情）"
                    },
                    "limit": {
                        "type": "number",
                        "description": "返回结果数量限制，默认10"
                    }
                },
                "required": ["action"]
            }
            """;
    }
    
    @Override
    public ToolResult execute(Map<String, Object> params) {
        String action = (String) params.get("action");
        
        if (action == null) {
            return ToolResult.error("action 参数不能为空");
        }
        
        try {
            return switch (action.toLowerCase()) {
                case "search_courses" -> searchCourses(params);
                case "get_course" -> getCourse(params);
                case "search_exercises" -> searchExercises(params);
                case "get_knowledge_points" -> getKnowledgePoints(params);
                case "search_plans" -> searchPlans(params);
                default -> ToolResult.error("未知操作: " + action);
            };
        } catch (Exception e) {
            log.error("知识库操作失败: {}", action, e);
            return ToolResult.error("查询失败: " + e.getMessage());
        }
    }
    
    @Override
    public boolean validate(Map<String, Object> params) {
        return params != null && params.containsKey("action");
    }
    
    @Override
    public String getCategory() {
        return "knowledge";
    }
    
    @Override
    public List<String> getTags() {
        return List.of("course", "知识", "课程", "题目", "学习计划", "知识点");
    }
    
    @Override
    public String getExample() {
        return """
            示例 1: 搜索课程
            action: "search_courses"
            query: "Spring Boot"
            结果: 返回匹配的课程列表
            
            示例 2: 获取课程详情
            action: "get_course"
            course_id: 1
            结果: 返回课程详细信息
            
            示例 3: 搜索练习题
            action: "search_exercises"
            query: "IOC"
            limit: 5
            结果: 返回相关练习题
            """;
    }
    
    private ToolResult searchCourses(Map<String, Object> params) {
        String query = (String) params.get("query");
        int limit = getIntParam(params, "limit", 10);
        
        List<Course> courses;
        if (query == null || query.trim().isEmpty()) {
            courses = courseRepository.findAll();
        } else {
            courses = courseRepository.findAll().stream()
                    .filter(c -> c.getName().contains(query) || 
                                (c.getDescription() != null && c.getDescription().contains(query)))
                    .collect(Collectors.toList());
        }
        
        List<Map<String, Object>> resultList = courses.stream()
                .limit(limit)
                .map(this::courseToMap)
                .collect(Collectors.toList());
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("total", courses.size());
        metadata.put("returned", resultList.size());
        metadata.put("query", query);
        
        return ToolResult.success(formatAsJson(resultList), metadata);
    }
    
    private ToolResult getCourse(Map<String, Object> params) {
        Long courseId = getLongParam(params, "course_id");
        if (courseId == null) {
            return ToolResult.error("course_id 不能为空");
        }
        
        Optional<Course> course = courseRepository.findById(courseId);
        if (course.isEmpty()) {
            return ToolResult.error("课程不存在: " + courseId);
        }
        
        Map<String, Object> result = courseToMap(course.get());
        return ToolResult.success(formatAsJson(result));
    }
    
    private ToolResult searchExercises(Map<String, Object> params) {
        String query = (String) params.get("query");
        int limit = getIntParam(params, "limit", 10);
        
        List<Exercise> exercises;
        if (query == null || query.trim().isEmpty()) {
            exercises = exerciseRepository.findAll();
        } else {
            exercises = exerciseRepository.findAll().stream()
                    .filter(e -> e.getQuestion().contains(query) ||
                                (e.getContent() != null && e.getContent().contains(query)))
                    .collect(Collectors.toList());
        }
        
        List<Map<String, Object>> resultList = exercises.stream()
                .limit(limit)
                .map(this::exerciseToMap)
                .collect(Collectors.toList());
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("total", exercises.size());
        metadata.put("returned", resultList.size());
        
        return ToolResult.success(formatAsJson(resultList), metadata);
    }
    
    private ToolResult getKnowledgePoints(Map<String, Object> params) {
        // 简化实现，实际可以从专门的知识点表中查询
        Long courseId = getLongParam(params, "course_id");
        
        List<Map<String, Object>> knowledgePoints = new ArrayList<>();
        
        if (courseId != null) {
            knowledgePoints.add(Map.of(
                "courseId", courseId,
                "points", List.of("基础概念", "核心原理", "实践应用", "高级特性"),
                "count", 4
            ));
        }
        
        return ToolResult.success(formatAsJson(knowledgePoints));
    }
    
    private ToolResult searchPlans(Map<String, Object> params) {
        String query = (String) params.get("query");
        int limit = getIntParam(params, "limit", 10);
        
        List<StudyPlan> plans;
        if (query == null || query.trim().isEmpty()) {
            plans = studyPlanRepository.findAll();
        } else {
            plans = studyPlanRepository.findAll().stream()
                    .filter(p -> p.getTitle().contains(query) ||
                                (p.getContent() != null && p.getContent().contains(query)))
                    .collect(Collectors.toList());
        }
        
        List<Map<String, Object>> resultList = plans.stream()
                .limit(limit)
                .map(this::planToMap)
                .collect(Collectors.toList());
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("total", plans.size());
        metadata.put("returned", resultList.size());
        
        return ToolResult.success(formatAsJson(resultList), metadata);
    }
    
    private Map<String, Object> courseToMap(Course course) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", course.getId());
        map.put("name", course.getName());
        map.put("description", course.getDescription());
        map.put("difficulty", course.getDifficulty());
        map.put("createdAt", course.getCreatedAt());
        return map;
    }
    
    private Map<String, Object> exerciseToMap(Exercise exercise) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", exercise.getId());
        map.put("question", exercise.getQuestion());
        map.put("type", exercise.getType());
        map.put("difficulty", exercise.getDifficulty());
        return map;
    }
    
    private Map<String, Object> planToMap(StudyPlan plan) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", plan.getId());
        map.put("title", plan.getTitle());
        map.put("content", plan.getContent());
        map.put("status", plan.getStatus());
        return map;
    }
    
    private String formatAsJson(Object obj) {
        // 简化实现，实际应使用 Jackson
        return obj.toString();
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
