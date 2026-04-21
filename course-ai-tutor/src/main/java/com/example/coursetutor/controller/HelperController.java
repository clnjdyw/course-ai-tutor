package com.example.coursetutor.controller;

import com.example.coursetutor.agent.HelperAgent;
import com.example.coursetutor.dto.AnswerRequest;
import com.example.coursetutor.dto.AnswerResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 答疑智能体控制器
 */
@Slf4j
@RestController
@RequestMapping("/helper")
@RequiredArgsConstructor
public class HelperController {
    
    private final HelperAgent helperAgent;
    
    /**
     * 解答问题
     */
    @PostMapping("/answer")
    public ResponseEntity<AnswerResponse> answer(@RequestBody AnswerRequest request) {
        log.info("收到答疑请求：question={}", request.getQuestion());
        
        AnswerResponse response = helperAgent.answer(request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 代码调试
     */
    @PostMapping("/debug")
    public ResponseEntity<AnswerResponse> debugCode(
            @RequestParam Long userId,
            @RequestParam String code,
            @RequestParam String errorMessage) {
        log.info("收到代码调试请求：userId={}", userId);
        
        AnswerResponse response = helperAgent.debugCode(userId, code, errorMessage);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取智能体信息
     */
    @GetMapping("/info")
    public ResponseEntity<AgentInfo> getAgentInfo() {
        return ResponseEntity.ok(new AgentInfo(
            helperAgent.getAgentName(),
            helperAgent.getAgentDescription()
        ));
    }
    
    public record AgentInfo(String name, String description) {}
}
