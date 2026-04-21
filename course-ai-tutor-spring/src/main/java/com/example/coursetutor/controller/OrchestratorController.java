package com.example.coursetutor.controller;

import com.example.coursetutor.agent.OrchestratorAgent;
import com.example.coursetutor.agent.collaboration.AgentRegistry;
import com.example.coursetutor.agent.memory.MemorySystem;
import com.example.coursetutor.agent.orchestrator.Orchestrator;
import com.example.coursetutor.agent.orchestrator.OrchestratorResult;
import com.example.coursetutor.agent.planning.PlanningEngine;
import com.example.coursetutor.agent.planning.PlanningResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * 增强版智能体控制器 - 支持规划引擎和协调器
 */
@Slf4j
@RestController
@RequestMapping("/api/v2")
public class OrchestratorController {
    
    @Autowired
    private OrchestratorAgent orchestratorAgent;
    
    @Autowired
    private Orchestrator orchestrator;
    
    @Autowired
    private PlanningEngine planningEngine;
    
    @Autowired
    private AgentRegistry agentRegistry;
    
    @Autowired
    private MemorySystem memorySystem;
    
    /**
     * 统一请求入口（增强版）
     */
    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> handleRequest(@RequestBody Map<String, Object> request) {
        String userInput = (String) request.get("content");
        Long userId = getLongParam(request, "userId", 1L);
        String sessionId = (String) request.getOrDefault("sessionId", UUID.randomUUID().toString());
        
        log.info("收到请求: userId={}, sessionId={}", userId, sessionId);
        
        try {
            String response = orchestratorAgent.handleRequest(userInput, userId, sessionId);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", response,
                    "sessionId", sessionId,
                    "agent", "Orchestrator"
            ));
        } catch (Exception e) {
            log.error("处理请求失败", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
    
    /**
     * 流式响应（SSE）
     */
    @PostMapping(value = "/request/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter handleStreamRequest(@RequestBody Map<String, Object> request) {
        String userInput = (String) request.get("content");
        Long userId = getLongParam(request, "userId", 1L);
        String sessionId = (String) request.getOrDefault("sessionId", UUID.randomUUID().toString());
        
        SseEmitter emitter = new SseEmitter(5 * 60 * 1000L);
        
        CompletableFuture.runAsync(() -> {
            try {
                // 获取规划结果
                PlanningResult planResult = planningEngine.createPlan(userInput, userId);
                
                // 发送计划信息
                Map<String, Object> planInfo = new HashMap<>();
                planInfo.put("type", "plan");
                planInfo.put("intent", planResult.getIntent() != null ? 
                        planResult.getIntent().getIntentType().name() : "UNKNOWN");
                planInfo.put("taskCount", planResult.getTaskPlan() != null ? 
                        planResult.getTaskPlan().getSubTasks().size() : 0);
                
                emitter.send(SseEmitter.event().data(planInfo));
                
                // 执行并发送进度
                if (planResult.isSuccess()) {
                    OrchestratorResult result = orchestrator.execute(userInput, userId);
                    
                    // 分块发送响应
                    String response = result.getResponse();
                    int chunkSize = 50;
                    for (int i = 0; i < response.length(); i += chunkSize) {
                        int end = Math.min(i + chunkSize, response.length());
                        String chunk = response.substring(i, end);
                        
                        Map<String, Object> chunkData = new HashMap<>();
                        chunkData.put("type", "content");
                        chunkData.put("content", chunk);
                        chunkData.put("progress", (end * 100) / response.length());
                        
                        emitter.send(SseEmitter.event().data(chunkData));
                    }
                }
                
                emitter.send(SseEmitter.event().name("done").data(Map.of("type", "done")));
                emitter.complete();
                
            } catch (Exception e) {
                log.error("流式处理失败", e);
                try {
                    emitter.send(SseEmitter.event().data(Map.of(
                            "type", "error",
                            "message", e.getMessage()
                    )));
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    log.error("关闭 emitter 失败", ex);
                }
            }
        });
        
        return emitter;
    }
    
    /**
     * 仅规划（不执行）
     */
    @PostMapping("/plan")
    public ResponseEntity<Map<String, Object>> createPlan(@RequestBody Map<String, Object> request) {
        String userInput = (String) request.get("content");
        Long userId = getLongParam(request, "userId", 1L);
        
        log.info("创建计划: userId={}, input={}", userId, userInput);
        
        try {
            PlanningResult result = planningEngine.createPlan(userInput, userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("planId", result.getPlanId());
            response.put("error", result.getError());
            
            if (result.getIntent() != null) {
                response.put("intent", Map.of(
                        "type", result.getIntent().getIntentType().name(),
                        "topic", result.getIntent().getMainTopic(),
                        "confidence", result.getIntent().getConfidence()
                ));
            }
            
            if (result.getTaskPlan() != null) {
                response.put("tasks", result.getTaskPlan().getSubTasks().stream()
                        .map(task -> Map.of(
                                "id", task.getTaskId(),
                                "name", task.getName(),
                                "type", task.getType().name()
                        ))
                        .toList());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("创建计划失败", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
    
    /**
     * 获取系统状态
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(orchestratorAgent.getSystemStatus());
    }
    
    /**
     * 获取 Agent 列表
     */
    @GetMapping("/agents")
    public ResponseEntity<Map<String, Object>> getAgents() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "agents", agentRegistry.getAllAgents()
        ));
    }
    
    /**
     * 获取记忆统计
     */
    @GetMapping("/memory/stats")
    public ResponseEntity<Map<String, Object>> getMemoryStats() {
        return ResponseEntity.ok(memorySystem.getStatistics());
    }
    
    /**
     * 清理记忆
     */
    @PostMapping("/memory/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupMemory() {
        memorySystem.cleanup();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "记忆清理完成"
        ));
    }
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "ok");
        health.put("timestamp", java.time.LocalDateTime.now());
        health.put("agents", agentRegistry.getOnlineAgents().size());
        health.put("totalAgents", agentRegistry.getAllAgents().size());
        return ResponseEntity.ok(health);
    }
    
    private Long getLongParam(Map<String, Object> params, String key, Long defaultValue) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return defaultValue;
    }
}
