package com.example.coursetutor.controller;

import com.example.coursetutor.agent.PlannerAgent;
import com.example.coursetutor.dto.PlanRequest;
import com.example.coursetutor.dto.PlanResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 规划智能体控制器
 */
@Slf4j
@RestController
@RequestMapping("/planner")
@RequiredArgsConstructor
public class PlannerController {
    
    private final PlannerAgent plannerAgent;
    
    /**
     * 创建学习计划
     */
    @PostMapping("/plan")
    public ResponseEntity<PlanResponse> createPlan(@RequestBody PlanRequest request) {
        log.info("收到创建学习计划请求：{}", request);
        
        PlanResponse response = plannerAgent.createPlan(request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 调整学习计划
     */
    @PutMapping("/plan/{planId}")
    public ResponseEntity<PlanResponse> adjustPlan(
            @PathVariable Long planId,
            @RequestBody String feedback) {
        log.info("收到调整学习计划请求：planId={}, feedback={}", planId, feedback);
        
        PlanResponse response = plannerAgent.adjustPlan(planId, feedback);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取智能体信息
     */
    @GetMapping("/info")
    public ResponseEntity<AgentInfo> getAgentInfo() {
        return ResponseEntity.ok(new AgentInfo(
            plannerAgent.getAgentName(),
            plannerAgent.getAgentDescription()
        ));
    }
    
    public record AgentInfo(String name, String description) {}
}
