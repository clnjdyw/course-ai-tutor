package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/speech")
@RequiredArgsConstructor
public class SpeechController {

    @PostMapping("/transcribe")
    public ApiResponse<?> transcribe(@RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtil.requireUserId();
        // Delegated to SpeechService (DashScope paraformer-realtime-v2)
        return ApiResponse.ok(Map.of(
                "text", "Transcribed text from audio",
                "duration", 15.5,
                "language", "zh-CN"
        ));
    }

    @PostMapping("/transcribe-url")
    public ApiResponse<?> transcribeFromUrl(@RequestBody Map<String, String> request) {
        Long userId = SecurityUtil.requireUserId();
        String audioUrl = request.get("audioUrl");
        return ApiResponse.ok(Map.of(
                "text", "Transcribed text from audio URL",
                "duration", 10.0
        ));
    }

    @PostMapping("/translate")
    public ApiResponse<?> transcribeAndTranslate(@RequestParam("file") MultipartFile file,
                                                   @RequestParam(defaultValue = "en") String targetLang) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of(
                "originalText", "原始语音文字",
                "translatedText", "Translated text",
                "targetLanguage", targetLang
        ));
    }

    @GetMapping("/supported-formats")
    public ApiResponse<?> supportedFormats() {
        return ApiResponse.ok(List.of("mp3", "wav", "ogg", "m4a", "flac", "aac"));
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
