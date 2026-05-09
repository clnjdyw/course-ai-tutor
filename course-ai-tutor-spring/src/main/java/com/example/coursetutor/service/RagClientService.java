package com.example.coursetutor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * RAG microservice client - calls external RAG service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RagClientService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.rag.service-url:http://localhost:8082}")
    private String ragServiceUrl;

    @Value("${app.rag.enabled:true}")
    private boolean ragEnabled;

    public List<Map<String, Object>> search(String query, int topK) {
        if (!ragEnabled) {
            return List.of();
        }

        try {
            String url = ragServiceUrl + "/api/rag/search";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                    "query", query,
                    "topK", topK
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            return parseSearchResults(response.getBody());
        } catch (Exception e) {
            log.error("RAG service call failed: {}", e.getMessage());
            return List.of();
        }
    }

    public Map<String, Object> addDocument(String knowledgeBaseId, String content) {
        if (!ragEnabled) {
            return Map.of("status", "disabled");
        }

        try {
            String url = ragServiceUrl + "/api/rag/documents";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                    "knowledgeBaseId", knowledgeBaseId,
                    "content", content
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            return Map.of("status", "success", "response", response.getBody());
        } catch (Exception e) {
            log.error("RAG document add failed: {}", e.getMessage());
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    public Map<String, Object> embedKnowledgeBase(String knowledgeBaseId) {
        if (!ragEnabled) {
            return Map.of("status", "disabled");
        }

        try {
            String url = ragServiceUrl + "/api/rag/embed/" + knowledgeBaseId;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            return Map.of("status", "embedding_started");
        } catch (Exception e) {
            log.error("RAG embed failed: {}", e.getMessage());
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseSearchResults(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode results = root.path("results");

            List<Map<String, Object>> list = new ArrayList<>();
            for (JsonNode node : results) {
                Map<String, Object> item = objectMapper.convertValue(node, Map.class);
                list.add(item);
            }
            return list;
        } catch (Exception e) {
            log.error("Failed to parse RAG response: {}", e.getMessage());
            return List.of();
        }
    }
}
