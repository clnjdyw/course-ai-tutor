package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 教学对话消息控制器 - 对应前端 /api/learning/tutor/messages
 */
@RestController
@RequestMapping("/api/learning/tutor")
@RequiredArgsConstructor
public class TutorMessagesController {

    @PostMapping("/messages")
    public ApiResponse<?> saveMessage(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                       @RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Message saved"));
    }

    @GetMapping("/messages")
    public ApiResponse<?> loadMessages(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                        @RequestParam(required = false) String agentType) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(List.of());
    }

    @DeleteMapping("/messages")
    public ApiResponse<?> clearMessages(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of("message", "Messages cleared"));
    }
}
