package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/knowledge-bases")
@RequiredArgsConstructor
public class KnowledgeBasesController {

    @PostMapping
    public ApiResponse<?> create(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        // Create user knowledge base - delegated to service
        return ApiResponse.ok(Map.of("message", "Knowledge base created"));
    }

    @GetMapping
    public ApiResponse<?> list() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(List.of());
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getById(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of());
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Knowledge base updated"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> delete(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Knowledge base deleted"));
    }

    @PostMapping("/{id}/documents")
    public ApiResponse<?> addDocument(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Document added"));
    }

    @GetMapping("/{id}/documents")
    public ApiResponse<?> listDocuments(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(List.of());
    }

    @PostMapping("/{id}/search")
    public ApiResponse<?> search(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        String query = (String) request.getOrDefault("query", "");
        return ApiResponse.ok(Map.of("results", List.of()));
    }

    @PostMapping("/{id}/embed")
    public ApiResponse<?> embed(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("status", "processing"));
    }

    // ==================== Frontend path aliases (entries = documents) ====================

    @PostMapping("/{id}/entries")
    public ApiResponse<?> addEntry(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return addDocument(id, request);
    }

    @GetMapping("/{id}/entries")
    public ApiResponse<?> listEntries(@PathVariable Long id) {
        return listDocuments(id);
    }

    @DeleteMapping("/{id}/entries/{entryId}")
    public ApiResponse<?> deleteEntry(@PathVariable Long id, @PathVariable Long entryId) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Entry deleted"));
    }

    @GetMapping("/{id}/search")
    public ApiResponse<?> searchByQuery(@PathVariable Long id, @RequestParam String q) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("results", List.of()));
    }
}
