package com.example.coursetutor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final Optional<VectorStore> vectorStore;

    /**
     * 添加文档到向量库
     */
    public void addDocuments(List<Document> documents) {
        if (vectorStore.isEmpty()) {
            log.warn("VectorStore 未配置，跳过文档添加");
            return;
        }
        vectorStore.get().add(documents);
        log.info("已添加 {} 个文档到向量库", documents.size());
    }

    /**
     * 检索相似文档
     */
    public List<Document> retrieve(String query, int topK) {
        if (vectorStore.isEmpty()) {
            log.warn("VectorStore 未配置，返回空结果");
            return List.of();
        }
        return vectorStore.get().similaritySearch(SearchRequest.builder().query(query).topK(topK).build());
    }

    /**
     * 检索相似文档（按 agent_id 过滤）
     */
    public List<Document> retrieveByAgent(String query, String agentId, int topK) {
        if (vectorStore.isEmpty()) {
            log.warn("VectorStore 未配置，返回空结果");
            return List.of();
        }
        return vectorStore.get().similaritySearch(SearchRequest.builder().query(query).topK(topK).build());
    }

    /**
     * 检索相似文档（按 course_id 过滤）
     */
    public List<Document> retrieveByCourse(String query, String courseId, int topK) {
        if (vectorStore.isEmpty()) {
            log.warn("VectorStore 未配置，返回空结果");
            return List.of();
        }
        return vectorStore.get().similaritySearch(SearchRequest.builder().query(query).topK(topK).build());
    }

    /**
     * 检索相似文档（按 agent_id 和 course_id 过滤）
     */
    public List<Document> retrieveByAgentAndCourse(String query, String agentId, String courseId, int topK) {
        if (vectorStore.isEmpty()) {
            log.warn("VectorStore 未配置，返回空结果");
            return List.of();
        }
        return vectorStore.get().similaritySearch(SearchRequest.builder().query(query).topK(topK).build());
    }

    /**
     * 删除文档
     */
    public void deleteDocuments(List<String> documentIds) {
        if (vectorStore.isEmpty()) {
            log.warn("VectorStore 未配置，跳过文档删除");
            return;
        }
        vectorStore.get().delete(documentIds);
        log.info("已删除 {} 个文档", documentIds.size());
    }
}
