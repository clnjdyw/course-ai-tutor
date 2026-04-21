package com.example.coursetutor.controller;

import com.example.coursetutor.agent.EvaluatorAgent;
import com.example.coursetutor.dto.EvaluateRequest;
import com.example.coursetutor.dto.EvaluateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 评估智能体控制器
 */
@Slf4j
@RestController
@RequestMapping("/evaluator")
@RequiredArgsConstructor
public class EvaluatorController {
    
    private final EvaluatorAgent evaluatorAgent;
    
    /**
     * 评估作业
     */
    @PostMapping("/evaluate")
    public ResponseEntity<EvaluateResponse> evaluate(@RequestBody EvaluateRequest request) {
        log.info("收到评估请求：exerciseId={}", request.getExerciseId());
        
        EvaluateResponse response = evaluatorAgent.evaluateExercise(request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 生成学习报告
     */
    @PostMapping("/report")
    public ResponseEntity<EvaluateResponse> generateReport(
            @RequestParam Long userId,
            @RequestBody String learningData) {
        log.info("收到生成报告请求：userId={}", userId);
        
        EvaluateResponse response = evaluatorAgent.generateReport(userId, learningData);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取智能体信息
     */
    @GetMapping("/info")
    public ResponseEntity<AgentInfo> getAgentInfo() {
        return ResponseEntity.ok(new AgentInfo(
            evaluatorAgent.getAgentName(),
            evaluatorAgent.getAgentDescription()
        ));
    }
    
    public record AgentInfo(String name, String description) {}
}
