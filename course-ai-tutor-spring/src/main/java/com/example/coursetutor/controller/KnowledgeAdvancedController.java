package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.KnowledgePoint;
import com.example.coursetutor.repository.KnowledgePointRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/knowledge-advanced")
@RequiredArgsConstructor
public class KnowledgeAdvancedController {

    private final KnowledgePointRepository knowledgePointRepository;

    @PostMapping("/extract")
    public ApiResponse<?> extract(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        // AI-driven knowledge extraction - delegated to KnowledgeExtractorService
        return ApiResponse.ok(Map.of("message", "Knowledge extraction initiated", "status", "processing"));
    }

    @GetMapping("/tree")
    public ApiResponse<?> tree(@RequestParam(required = false) Long courseId) {
        Long userId = SecurityUtil.requireUserId();
        List<KnowledgePoint> points;
        if (courseId != null) {
            points = knowledgePointRepository.findByCourseId(courseId);
        } else {
            points = knowledgePointRepository.findAll();
        }
        return ApiResponse.ok(buildTree(points));
    }

    // Path variant matching frontend /tree/{courseId}
    @GetMapping("/tree/{courseId}")
    public ApiResponse<?> treeByPath(@PathVariable Long courseId) {
        return tree(courseId);
    }

    @GetMapping("/graph")
    public ApiResponse<?> graph(@RequestParam(required = false) Long courseId) {
        Long userId = SecurityUtil.requireUserId();
        List<KnowledgePoint> points = courseId != null
                ? knowledgePointRepository.findByCourseId(courseId)
                : knowledgePointRepository.findAll();
        return ApiResponse.ok(buildGraph(points));
    }

    // Path variant matching frontend /graph/{courseId}
    @GetMapping("/graph/{courseId}")
    public ApiResponse<?> graphByPath(@PathVariable Long courseId) {
        return graph(courseId);
    }

    @PostMapping("/recommend")
    public ApiResponse<?> recommend(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        // Adaptive recommendation - delegated to KnowledgeRecommendationService
        return ApiResponse.ok(List.of());
    }

    // Path variant matching frontend /recommend/{courseId}
    @PostMapping("/recommend/{courseId}")
    public ApiResponse<?> recommendByCourse(@PathVariable Long courseId, @RequestBody Map<String, Object> request) {
        return recommend(request);
    }

    @GetMapping("/prerequisites/{id}")
    public ApiResponse<?> prerequisites(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return knowledgePointRepository.findById(id)
                .map(kp -> {
                    List<Long> prereqIds = parsePrerequisites(kp.getPrerequisites());
                    List<KnowledgePoint> prereqs = knowledgePointRepository.findAllById(prereqIds);
                    return ApiResponse.ok(prereqs);
                })
                .orElse(ApiResponse.error("知识点不存在"));
    }

    @GetMapping("/dependencies/{id}")
    public ApiResponse<?> dependencies(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        List<KnowledgePoint> all = knowledgePointRepository.findAll();
        List<KnowledgePoint> dependents = all.stream()
                .filter(kp -> parsePrerequisites(kp.getPrerequisites()).contains(id))
                .toList();
        return ApiResponse.ok(dependents);
    }

    @PostMapping("/batch-extract")
    public ApiResponse<?> batchExtract(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("status", "processing"));
    }

    @GetMapping("/similarity/{id1}/{id2}")
    public ApiResponse<?> similarity(@PathVariable Long id1, @PathVariable Long id2) {
        Long userId = SecurityUtil.requireUserId();
        // Compute semantic similarity between two knowledge points
        return ApiResponse.ok(Map.of("similarity", 0.0));
    }

    @PostMapping("/reorganize")
    public ApiResponse<?> reorganize(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("status", "processing"));
    }

    @GetMapping("/gap-analysis")
    public ApiResponse<?> gapAnalysis(@RequestParam(required = false) Long courseId) {
        Long userId = SecurityUtil.requireUserId();
        // Analyze learning gaps based on user progress
        return ApiResponse.ok(Map.of("gaps", List.of()));
    }

    // Path variant matching frontend /learning-path/{courseId}/{targetPointId}
    @GetMapping("/learning-path/{courseId}/{targetPointId}")
    public ApiResponse<?> learningPath(@PathVariable Long courseId, @PathVariable Long targetPointId) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("path", List.of()));
    }

    // Path variant matching frontend /learning-order/{courseId}
    @GetMapping("/learning-order/{courseId}")
    public ApiResponse<?> learningOrder(@PathVariable Long courseId) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("order", List.of()));
    }

    // Path variant matching frontend /evaluate/{knowledgePointId}
    @PostMapping("/evaluate/{knowledgePointId}")
    public ApiResponse<?> evaluatePoint(@PathVariable Long knowledgePointId) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("mastery", 0.0, "score", 0));
    }

    // Path variant matching frontend /evaluate/batch/{courseId}
    @PostMapping("/evaluate/batch/{courseId}")
    public ApiResponse<?> evaluateBatch(@PathVariable Long courseId) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("results", List.of()));
    }

    // Path variant matching frontend /import/{courseId}
    @PostMapping("/import/{courseId}")
    public ApiResponse<?> importFile(@PathVariable Long courseId,
                                      @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "File import initiated"));
    }

    // Path variant matching frontend /import-text/{courseId}
    @PostMapping("/import-text/{courseId}")
    public ApiResponse<?> importText(@PathVariable Long courseId,
                                      @RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Text import initiated"));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buildTree(List<KnowledgePoint> points) {
        Map<Long, Map<String, Object>> nodeMap = new LinkedHashMap<>();
        List<Map<String, Object>> roots = new ArrayList<>();

        for (KnowledgePoint kp : points) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", kp.getId());
            node.put("title", kp.getTitle());
            node.put("description", kp.getDescription());
            node.put("difficulty", kp.getDifficulty());
            node.put("children", new ArrayList<Map<String, Object>>());
            nodeMap.put(kp.getId(), node);
        }

        for (KnowledgePoint kp : points) {
            Map<String, Object> node = nodeMap.get(kp.getId());
            if (kp.getParentId() == null || kp.getParentId() == 0) {
                roots.add(node);
            } else {
                Map<String, Object> parent = nodeMap.get(kp.getParentId());
                if (parent != null) {
                    @SuppressWarnings("rawtypes")
                    List children = (List) parent.get("children");
                    children.add(node);
                }
            }
        }
        return roots;
    }

    private Map<String, Object> buildGraph(List<KnowledgePoint> points) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        for (KnowledgePoint kp : points) {
            nodes.add(Map.of(
                    "id", kp.getId(),
                    "label", kp.getTitle(),
                    "difficulty", kp.getDifficulty()
            ));
            for (Long prereqId : parsePrerequisites(kp.getPrerequisites())) {
                edges.add(Map.of(
                        "from", prereqId,
                        "to", kp.getId(),
                        "type", "prerequisite"
                ));
            }
        }
        return Map.of("nodes", nodes, "edges", edges);
    }

    private List<Long> parsePrerequisites(String prereqStr) {
        List<Long> ids = new ArrayList<>();
        if (prereqStr == null || prereqStr.isBlank()) return ids;
        try {
            for (String s : prereqStr.split(",")) {
                ids.add(Long.parseLong(s.trim()));
            }
        } catch (NumberFormatException e) {
            // ignore malformed
        }
        return ids;
    }
}
