package com.example.coursetutor.controller;

import com.example.coursetutor.agent.TutorAgent;
import com.example.coursetutor.dto.TeachRequest;
import com.example.coursetutor.dto.TeachResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 教学智能体控制器
 */
@Slf4j
@RestController
@RequestMapping("/tutor")
@RequiredArgsConstructor
public class TutorController {
    
    private final TutorAgent tutorAgent;
    
    /**
     * 讲解知识点
     */
    @PostMapping("/teach")
    public ResponseEntity<TeachResponse> teach(@RequestBody TeachRequest request) {
        log.info("收到教学请求：topic={}", request.getTopic());
        
        TeachResponse response = tutorAgent.teach(request);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 解答疑问
     */
    @PostMapping("/answer")
    public ResponseEntity<TeachResponse> answerQuestion(
            @RequestParam Long userId,
            @RequestParam String question,
            @RequestParam(required = false) String context) {
        log.info("收到答疑请求：userId={}, question={}", userId, question);
        
        TeachResponse response = tutorAgent.answerQuestion(userId, question, context);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取智能体信息
     */
    @GetMapping("/info")
    public ResponseEntity<AgentInfo> getAgentInfo() {
        return ResponseEntity.ok(new AgentInfo(
            tutorAgent.getAgentName(),
            tutorAgent.getAgentDescription()
        ));
    }
    
    public record AgentInfo(String name, String description) {}
}
