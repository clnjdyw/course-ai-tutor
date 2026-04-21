package com.example.coursetutor.controller;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolManager;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 工具控制器 - 提供工具管理和执行接口
 */
@Slf4j
@RestController
@RequestMapping("/api/tools")
public class ToolController {
    
    @Autowired
    private ToolManager toolManager;
    
    /**
     * 获取所有可用工具列表
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getTools() {
        List<Tool> tools = toolManager.getAllTools();
        
        List<Map<String, Object>> toolList = tools.stream()
                .map(tool -> Map.<String, Object>of(
                        "name", tool.getName(),
                        "description", tool.getDescription(),
                        "category", tool.getCategory(),
                        "tags", tool.getTags(),
                        "example", tool.getExample() != null ? tool.getExample() : ""
                ))
                .toList();
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "count", tools.size(),
                "tools", toolList
        ));
    }
    
    /**
     * 获取工具详情
     */
    @GetMapping("/{toolName}")
    public ResponseEntity<Map<String, Object>> getTool(@PathVariable String toolName) {
        return toolManager.getTool(toolName)
                .map(tool -> ResponseEntity.ok(Map.<String, Object>of(
                        "success", true,
                        "name", tool.getName(),
                        "description", tool.getDescription(),
                        "category", tool.getCategory(),
                        "parametersSchema", tool.getParametersSchema(),
                        "tags", tool.getTags(),
                        "example", tool.getExample() != null ? tool.getExample() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 搜索工具
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchTools(@RequestParam String query) {
        List<Tool> results = toolManager.searchTools(query);
        
        List<Map<String, Object>> toolList = results.stream()
                .map(tool -> Map.<String, Object>of(
                        "name", tool.getName(),
                        "description", tool.getDescription(),
                        "category", tool.getCategory()
                ))
                .toList();
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "query", query,
                "count", toolList.size(),
                "results", toolList
        ));
    }
    
    /**
     * 按分类获取工具
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getToolsByCategory(@PathVariable String category) {
        List<Tool> tools = toolManager.getToolsByCategory(category);
        
        List<Map<String, Object>> toolList = tools.stream()
                .map(tool -> Map.<String, Object>of(
                        "name", tool.getName(),
                        "description", tool.getDescription(),
                        "tags", tool.getTags()
                ))
                .toList();
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "category", category,
                "count", toolList.size(),
                "tools", toolList
        ));
    }
    
    /**
     * 执行工具
     */
    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> executeTool(@RequestBody Map<String, Object> request) {
        String toolName = (String) request.get("tool");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = (Map<String, Object>) request.getOrDefault("params", new java.util.HashMap<>());
        
        if (toolName == null || toolName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "工具名称不能为空"
            ));
        }
        
        log.info("执行工具请求: tool={}, params={}", toolName, params);
        
        ToolResult result = toolManager.execute(toolName, params);
        
        return ResponseEntity.ok(Map.of(
                "success", result.isSuccess(),
                "tool", toolName,
                "result", result.getContent(),
                "error", result.getError() != null ? result.getError() : "",
                "metadata", result.getMetadata() != null ? result.getMetadata() : new java.util.HashMap<>(),
                "executionTimeMs", result.getExecutionTimeMs()
        ));
    }
    
    /**
     * 批量执行工具
     */
    @PostMapping("/execute/batch")
    public ResponseEntity<Map<String, Object>> executeToolsBatch(@RequestBody List<Map<String, Object>> requests) {
        List<Map<String, Object>> results = requests.stream()
                .map(request -> {
                    String toolName = (String) request.get("tool");
                    @SuppressWarnings("unchecked")
                    Map<String, Object> params = (Map<String, Object>) request.getOrDefault("params", new java.util.HashMap<>());
                    
                    ToolResult result = toolManager.execute(toolName, params);
                    
                    return (Map<String, Object>) Map.of(
                            "tool", toolName,
                            "success", result.isSuccess(),
                            "result", result.getContent(),
                            "error", result.getError() != null ? result.getError() : "",
                            "executionTimeMs", result.getExecutionTimeMs()
                    );
                })
                .toList();
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "count", results.size(),
                "results", results
        ));
    }
    
    /**
     * 获取工具统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "statistics", toolManager.getStatistics()
        ));
    }
    
    /**
     * 获取函数调用模式（用于 LLM）
     */
    @GetMapping("/functions")
    public ResponseEntity<Map<String, Object>> getFunctionSchemas() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "functions", toolManager.getFunctionSchemas()
        ));
    }
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "tools", toolManager.getAvailableTools().size(),
                "timestamp", java.time.LocalDateTime.now()
        ));
    }
}
