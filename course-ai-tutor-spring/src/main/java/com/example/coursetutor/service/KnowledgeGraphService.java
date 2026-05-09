package com.example.coursetutor.service;

import com.example.coursetutor.entity.KnowledgePoint;
import com.example.coursetutor.repository.KnowledgePointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Builds knowledge graphs, trees, and learning paths
 */
@Service
@RequiredArgsConstructor
public class KnowledgeGraphService {

    private final KnowledgePointRepository knowledgePointRepository;

    public List<Map<String, Object>> buildTree(Long courseId) {
        List<KnowledgePoint> points = knowledgePointRepository.findByCourseId(courseId);
        return buildTreeFromPoints(points);
    }

    public Map<String, Object> buildGraph(Long courseId) {
        List<KnowledgePoint> points = knowledgePointRepository.findByCourseId(courseId);
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        for (KnowledgePoint kp : points) {
            nodes.add(Map.of(
                    "id", kp.getId(),
                    "label", kp.getTitle(),
                    "difficulty", kp.getDifficulty()
            ));
            // Parse prerequisites and create edges
            if (kp.getPrerequisites() != null && !kp.getPrerequisites().isEmpty()) {
                for (String prereqStr : kp.getPrerequisites().split(",")) {
                    try {
                        long prereqId = Long.parseLong(prereqStr.trim());
                        edges.add(Map.of(
                                "source", prereqId,
                                "target", kp.getId(),
                                "type", "prerequisite"
                        ));
                    } catch (NumberFormatException e) {
                        // skip
                    }
                }
            }
        }
        return Map.of("nodes", nodes, "edges", edges);
    }

    public List<Long> recommendLearningPath(Long userId, Long startKnowledgePointId) {
        // BFS/DFS to find optimal learning path based on prerequisites
        List<Long> path = new ArrayList<>();
        Set<Long> visited = new HashSet<>();
        Deque<Long> queue = new ArrayDeque<>();
        queue.add(startKnowledgePointId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();
            if (visited.contains(current)) continue;
            visited.add(current);
            path.add(current);

            // Find dependents (knowledge points that have current as prerequisite)
            List<KnowledgePoint> all = knowledgePointRepository.findAll();
            for (KnowledgePoint kp : all) {
                if (kp.getPrerequisites() != null &&
                    isPrerequisiteOf(kp.getPrerequisites(), current)) {
                    queue.add(kp.getId());
                }
            }
        }
        return path;
    }

    public Map<String, Object> analyzeKnowledgePoint(Long knowledgePointId) {
        Optional<KnowledgePoint> opt = knowledgePointRepository.findById(knowledgePointId);
        if (opt.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Knowledge point not found");
            return error;
        }
        KnowledgePoint kp = opt.get();
        List<KnowledgePoint> all = knowledgePointRepository.findAll();
        long dependentCount = all.stream()
                .filter(p -> isPrerequisiteOf(p.getPrerequisites(), kp.getId()))
                .count();
        long prerequisiteCount = kp.getPrerequisites() != null
                ? kp.getPrerequisites().split(",").length : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("id", kp.getId());
        result.put("title", kp.getTitle());
        result.put("prerequisiteCount", prerequisiteCount);
        result.put("dependentCount", dependentCount);
        result.put("difficulty", kp.getDifficulty());
        result.put("isLeaf", dependentCount == 0);
        result.put("isRoot", prerequisiteCount == 0);
        return result;
    }

    private boolean isPrerequisiteOf(String prerequisites, long prerequisiteId) {
        if (prerequisites == null || prerequisites.isBlank()) return false;
        return Arrays.stream(prerequisites.split(","))
                .map(String::trim)
                .anyMatch(s -> {
                    try { return Long.parseLong(s) == prerequisiteId; }
                    catch (NumberFormatException e) { return false; }
                });
    }

    private List<Map<String, Object>> buildTreeFromPoints(List<KnowledgePoint> points) {
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
}
