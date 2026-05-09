package com.example.coursetutor.service;

import com.example.coursetutor.entity.KnowledgePoint;
import com.example.coursetutor.repository.KnowledgePointRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KnowledgeGraphServiceTest {

    @Mock
    private KnowledgePointRepository knowledgePointRepository;

    private KnowledgeGraphService service;

    @BeforeEach
    void setUp() {
        service = new KnowledgeGraphService(knowledgePointRepository);
    }

    @Test
    @DisplayName("buildTree returns root nodes with nested children")
    void buildTree_returnsRootsWithChildren() {
        Long courseId = 1L;

        KnowledgePoint root = KnowledgePoint.builder().id(1L).courseId(courseId).title("Root").difficulty(1).build();
        KnowledgePoint child = KnowledgePoint.builder().id(2L).courseId(courseId).title("Child").difficulty(2).prerequisites("1").build();
        child.setParentId(1L);

        when(knowledgePointRepository.findByCourseId(courseId)).thenReturn(List.of(root, child));

        List<Map<String, Object>> tree = service.buildTree(courseId);

        assertThat(tree).hasSize(1);
        assertThat((long) tree.get(0).get("id")).isEqualTo(1L);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> children = (List<Map<String, Object>>) tree.get(0).get("children");
        assertThat(children).hasSize(1);
        assertThat((long) children.get(0).get("id")).isEqualTo(2L);
    }

    @Test
    @DisplayName("buildGraph returns nodes and edges")
    void buildGraph_returnsNodesAndEdges() {
        Long courseId = 1L;

        KnowledgePoint kp1 = KnowledgePoint.builder().id(1L).courseId(courseId).title("Math").difficulty(1).build();
        KnowledgePoint kp2 = KnowledgePoint.builder().id(2L).courseId(courseId).title("Algebra").difficulty(2).prerequisites("1").build();

        when(knowledgePointRepository.findByCourseId(courseId)).thenReturn(List.of(kp1, kp2));

        Map<String, Object> graph = service.buildGraph(courseId);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> nodes = (List<Map<String, Object>>) graph.get("nodes");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> edges = (List<Map<String, Object>>) graph.get("edges");

        assertThat(nodes).hasSize(2);
        assertThat(edges).hasSize(1);
    }

    @Test
    @DisplayName("analyzeKnowledgePoint returns prerequisite and dependent counts")
    void analyzeKnowledgePoint_returnsCounts() {
        KnowledgePoint kp1 = KnowledgePoint.builder().id(1L).courseId(1L).title("Basics").difficulty(1).build();
        KnowledgePoint kp2 = KnowledgePoint.builder().id(2L).courseId(1L).title("Advanced").difficulty(3).prerequisites("1").build();

        when(knowledgePointRepository.findById(1L)).thenReturn(java.util.Optional.of(kp1));
        when(knowledgePointRepository.findAll()).thenReturn(List.of(kp1, kp2));

        Map<String, Object> analysis = service.analyzeKnowledgePoint(1L);

        assertThat(analysis).containsEntry("prerequisiteCount", 0L);
        assertThat(analysis).containsEntry("dependentCount", 1L);
    }
}
