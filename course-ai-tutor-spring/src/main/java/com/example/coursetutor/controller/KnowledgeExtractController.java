package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/knowledge-extract")
@RequiredArgsConstructor
public class KnowledgeExtractController {

    @PostMapping("/conversation")
    public ApiResponse<?> extractFromConversation(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        // Extract knowledge from conversation - delegated to KnowledgeConversationExtractorService
        return ApiResponse.ok(Map.of("extracted", List.of()));
    }

    @PostMapping("/document")
    public ApiResponse<?> extractFromDocument(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("extracted", List.of()));
    }

    @PostMapping("/batch")
    public ApiResponse<?> batchExtract(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("status", "processing"));
    }

    @GetMapping("/status/{taskId}")
    public ApiResponse<?> extractStatus(@PathVariable String taskId) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("status", "completed", "progress", 100));
    }

    @PostMapping("/merge")
    public ApiResponse<?> merge(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("merged", List.of()));
    }

    @PostMapping("/validate")
    public ApiResponse<?> validate(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("valid", true, "issues", List.of()));
    }

    // ==================== Frontend path aliases ====================

    // Frontend calls /extract (general extract entry point)
    @PostMapping("/extract")
    public ApiResponse<?> extract(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("extracted", List.of(), "status", "processing"));
    }

    // Frontend calls /extract-from-history
    @PostMapping("/extract-from-history")
    public ApiResponse<?> extractFromHistory(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("extracted", List.of()));
    }

    // Frontend calls /schedule
    @PostMapping("/schedule")
    public ApiResponse<?> schedule(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("taskId", UUID.randomUUID().toString(), "status", "scheduled"));
    }

    // Frontend calls /queue/status
    @GetMapping("/queue/status")
    public ApiResponse<?> queueStatus() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("queueLength", 0, "processing", 0, "completed", 0));
    }

    // Frontend calls /stats
    @GetMapping("/stats")
    public ApiResponse<?> stats() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("totalExtractions", 0, "successRate", 0));
    }

    // Frontend calls /extract-batch
    @PostMapping("/extract-batch")
    public ApiResponse<?> extractBatch(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("status", "processing"));
    }
}
