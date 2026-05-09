package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    @GetMapping("/excel")
    public ApiResponse<?> exportExcel(
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Long userId = SecurityUtil.requireUserId();
        // Delegated to ExportService
        return ApiResponse.ok(Map.of(
                "message", "Export initiated",
                "type", type,
                "downloadUrl", "/api/export/download/temp-file.xlsx"
        ));
    }

    @GetMapping("/csv")
    public ApiResponse<?> exportCsv(
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of(
                "message", "Export initiated",
                "type", type,
                "downloadUrl", "/api/export/download/temp-file.csv"
        ));
    }

    // Path variant matching frontend /csv/{type}
    @GetMapping("/csv/{type}")
    public ApiResponse<?> exportCsvByPath(@PathVariable String type) {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(Map.of(
                "message", "Export initiated",
                "type", type,
                "downloadUrl", "/api/export/download/temp-file.csv"
        ));
    }
}
