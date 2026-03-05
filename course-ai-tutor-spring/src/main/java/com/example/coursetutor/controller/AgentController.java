package com.example.coursetutor.controller;

import com.example.coursetutor.agent.AgentManager;
import com.example.coursetutor.agent.CompanionAgent;
import com.example.coursetutor.dto.AgentRequest;
import com.example.coursetutor.dto.AgentResponse;
import com.example.coursetutor.dto.ChatRequest;
import com.example.coursetutor.dto.ChatResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 智能体控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/agent")
public class AgentController {
    
    @Autowired
    private AgentManager agentManager;
    
    @Autowired
    private CompanionAgent companionAgent;
    
    /**
     * 统一请求入口
     */
    @PostMapping("/request")
    public ResponseEntity<AgentResponse> handleRequest(@RequestBody AgentRequest request) {
        log.info("收到智能体请求：{}", request);
        AgentResponse response = agentManager.handleRequest(request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 聊天接口
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.info("收到聊天请求：{}", request);
        ChatResponse response = companionAgent.chat(request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 获取智能体状态
     */
    @GetMapping("/status")
    public ResponseEntity<String> getAgentStatus() {
        String status = agentManager.getAgentStatus();
        return ResponseEntity.ok(status);
    }
    
    /**
     * 获取所有智能体信息
     */
    @GetMapping("/list")
    public ResponseEntity<?> getAgentList() {
        return ResponseEntity.ok(agentManager.getAllAgents().stream()
            .map(agent -> new AgentInfo(
                agent.getAgentName(),
                agent.getAgentDescription(),
                agent.getAgentType().name()
            ))
            .toList());
    }
    
    public record AgentInfo(String name, String description, String type) {}
}
