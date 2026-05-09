package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<?> health() {
        return ApiResponse.ok(java.util.Map.of(
                "status", "ok",
                "timestamp", Instant.now().toString(),
                "uptime", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime()
        ));
    }
}
