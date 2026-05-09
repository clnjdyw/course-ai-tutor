package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.Course;
import com.example.coursetutor.entity.KnowledgePoint;
import com.example.coursetutor.repository.CourseRepository;
import com.example.coursetutor.repository.KnowledgePointRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final CourseRepository courseRepository;
    private final KnowledgePointRepository knowledgePointRepository;

    @GetMapping("/courses")
    public ApiResponse<List<Course>> getCourses() {
        return ApiResponse.ok(courseRepository.findAll());
    }

    @GetMapping
    public ApiResponse<List<KnowledgePoint>> getKnowledgePoints(
            @RequestParam(required = false) Long courseId,
            @RequestParam(defaultValue = "100") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        List<KnowledgePoint> points;
        if (courseId != null) {
            points = knowledgePointRepository.findByCourseId(courseId);
        } else {
            points = knowledgePointRepository.findAll();
        }
        if (points.size() > limit) {
            points = points.subList(offset, Math.min(offset + limit, points.size()));
        }
        return ApiResponse.ok(points);
    }

    @GetMapping("/{id}")
    public ApiResponse<KnowledgePoint> getKnowledgePoint(@PathVariable Long id) {
        return knowledgePointRepository.findById(id)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("知识点不存在"));
    }

    @PostMapping
    public ApiResponse<?> createKnowledgePoint(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        KnowledgePoint kp = KnowledgePoint.builder()
                .courseId(getLong(body, "courseId"))
                .title((String) body.get("title"))
                .description((String) body.get("description"))
                .content((String) body.get("content"))
                .difficulty(getInt(body, "difficulty", 1))
                .parentId(getLong(body, "parentId"))
                .agentType((String) body.get("agentType"))
                .knowledgeBaseId((String) body.get("knowledgeBaseId"))
                .prerequisites((String) body.get("prerequisites"))
                .tags((String) body.get("tags"))
                .build();

        KnowledgePoint saved = knowledgePointRepository.save(kp);
        return ApiResponse.ok(Map.of("id", saved.getId()), "知识点创建成功");
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateKnowledgePoint(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        return knowledgePointRepository.findById(id).map(kp -> {
            if (body.containsKey("title")) kp.setTitle((String) body.get("title"));
            if (body.containsKey("description")) kp.setDescription((String) body.get("description"));
            if (body.containsKey("content")) kp.setContent((String) body.get("content"));
            if (body.containsKey("difficulty")) kp.setDifficulty((Integer) body.get("difficulty"));
            if (body.containsKey("parentId")) kp.setParentId(getLong(body, "parentId"));
            if (body.containsKey("agentType")) kp.setAgentType((String) body.get("agentType"));
            if (body.containsKey("knowledgeBaseId")) kp.setKnowledgeBaseId((String) body.get("knowledgeBaseId"));
            if (body.containsKey("prerequisites")) kp.setPrerequisites((String) body.get("prerequisites"));
            if (body.containsKey("tags")) kp.setTags((String) body.get("tags"));
            knowledgePointRepository.save(kp);
            return ApiResponse.ok("知识点更新成功");
        }).orElse(ApiResponse.error("知识点不存在"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteKnowledgePoint(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        if (!knowledgePointRepository.existsById(id)) {
            return ApiResponse.error("知识点不存在");
        }
        knowledgePointRepository.deleteById(id);
        return ApiResponse.ok("知识点已删除");
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).longValue() : null;
    }

    private Integer getInt(Map<String, Object> map, String key, int defaultValue) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).intValue() : defaultValue;
    }
}
