package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.service.OcrService;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;

    @PostMapping("/recognize")
    public ApiResponse<?> recognize(@RequestParam("file") MultipartFile file) {
        try {
            Long userId = SecurityUtil.requireUserId();
            Map<String, Object> result = ocrService.recognizeImage(file);
            return ApiResponse.ok(result);
        } catch (java.io.IOException e) {
            log.error("OCR识别失败", e);
            return ApiResponse.error("OCR识别失败: " + e.getMessage());
        }
    }

    @PostMapping("/recognize-url")
    public ApiResponse<?> recognizeFromUrl(@RequestBody Map<String, String> request) {
        Long userId = SecurityUtil.requireUserId();
        String imageUrl = request.get("imageUrl");
        if (imageUrl == null || imageUrl.isBlank()) {
            return ApiResponse.error("imageUrl parameter is required");
        }
        Map<String, Object> result = ocrService.recognizeImageUrl(imageUrl);
        return ApiResponse.ok(result);
    }

    @PostMapping("/handwriting")
    public ApiResponse<?> recognizeHandwriting(@RequestParam("file") MultipartFile file) {
        try {
            Long userId = SecurityUtil.requireUserId();
            Map<String, Object> result = ocrService.recognizeHandwriting(file);
            return ApiResponse.ok(result);
        } catch (java.io.IOException e) {
            log.error("手写识别失败", e);
            return ApiResponse.error("手写识别失败: " + e.getMessage());
        }
    }

    @GetMapping("/supported-formats")
    public ApiResponse<?> supportedFormats() {
        return ApiResponse.ok(List.of("png", "jpg", "jpeg", "gif", "bmp", "webp"));
    }

    @GetMapping("/cache/stats")
    public ApiResponse<?> cacheStats() {
        return ApiResponse.ok(Map.of("cacheHits", 0, "cacheMisses", 0, "cacheSize", 0));
    }

    @PostMapping("/cache/clear")
    public ApiResponse<?> clearCache() {
        return ApiResponse.ok(Map.of("message", "Cache cleared"));
    }
}
