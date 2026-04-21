package com.example.coursetutor.agent.collaboration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 协作管理器 - 管理 Agent 间的协作模式
 */
@Slf4j
@Component
public class CollaborationManager {
    
    @Autowired
    private AgentMessageBus messageBus;
    
    @Autowired
    private AgentRegistry agentRegistry;
    
    /** 活跃的协作会话 */
    private final Map<String, CollaborationSession> activeSessions = new HashMap<>();
    
    /**
     * 创建串行协作会话
     */
    public CollaborationSession createPipelineSession(String taskId, List<String> agentSequence) {
        CollaborationSession session = CollaborationSession.builder()
                .sessionId(UUID.randomUUID().toString())
                .taskId(taskId)
                .mode(CollaborationMode.PIPELINE)
                .agentSequence(agentSequence)
                .currentIndex(0)
                .status(SessionStatus.INITIATED)
                .createdAt(System.currentTimeMillis())
                .results(new HashMap<>())
                .build();
        
        activeSessions.put(session.getSessionId(), session);
        log.info("创建串行协作会话: sessionId={}, agents={}", session.getSessionId(), agentSequence);
        
        return session;
    }
    
    /**
     * 创建并行协作会话
     */
    public CollaborationSession createParallelSession(String taskId, List<String> agents) {
        CollaborationSession session = CollaborationSession.builder()
                .sessionId(UUID.randomUUID().toString())
                .taskId(taskId)
                .mode(CollaborationMode.PARALLEL)
                .parallelAgents(agents)
                .status(SessionStatus.INITIATED)
                .createdAt(System.currentTimeMillis())
                .results(new HashMap<>())
                .build();
        
        activeSessions.put(session.getSessionId(), session);
        log.info("创建并行协作会话: sessionId={}, agents={}", session.getSessionId(), agents);
        
        return session;
    }
    
    /**
     * 执行串行协作
     */
    public Object executePipeline(String sessionId, Object initialInput) {
        CollaborationSession session = activeSessions.get(sessionId);
        if (session == null || session.getMode() != CollaborationMode.PIPELINE) {
            throw new IllegalArgumentException("无效的会话或模式");
        }
        
        session.setStatus(SessionStatus.RUNNING);
        Object currentResult = initialInput;
        
        for (int i = session.getCurrentIndex(); i < session.getAgentSequence().size(); i++) {
            String agentName = session.getAgentSequence().get(i);
            
            try {
                // 发送任务请求
                AgentMessage request = AgentMessage.taskRequest(
                        "Orchestrator", agentName, 
                        Map.of("input", currentResult, "step", i + 1)
                );
                
                // 等待响应
                CompletableFuture<AgentMessage> future = messageBus.sendAndWait(request, 30000);
                AgentMessage response = future.get(30, TimeUnit.SECONDS);
                
                // 提取结果
                Object result = response.getPayload();
                session.getResults().put(agentName, result);
                currentResult = result;
                session.setCurrentIndex(i + 1);
                
                log.info("串行协作步骤完成: agent={}, step={}", agentName, i + 1);
                
            } catch (Exception e) {
                log.error("串行协作步骤失败: agent={}, step={}", agentName, i + 1, e);
                session.setStatus(SessionStatus.FAILED);
                session.setError("步骤 " + (i + 1) + " 失败: " + e.getMessage());
                break;
            }
        }
        
        if (session.getStatus() != SessionStatus.FAILED) {
            session.setStatus(SessionStatus.COMPLETED);
        }
        
        return currentResult;
    }
    
    /**
     * 执行并行协作
     */
    public Map<String, Object> executeParallel(String sessionId, Object commonInput) {
        CollaborationSession session = activeSessions.get(sessionId);
        if (session == null || session.getMode() != CollaborationMode.PARALLEL) {
            throw new IllegalArgumentException("无效的会话或模式");
        }
        
        session.setStatus(SessionStatus.RUNNING);
        Map<String, Object> results = new ConcurrentHashMap<>();
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        
        for (String agentName : session.getParallelAgents()) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    AgentMessage request = AgentMessage.taskRequest(
                            "Orchestrator", agentName,
                            Map.of("input", commonInput)
                    );
                    
                    CompletableFuture<AgentMessage> responseFuture = messageBus.sendAndWait(request, 30000);
                    AgentMessage response = responseFuture.get(30, TimeUnit.SECONDS);
                    results.put(agentName, response.getPayload());
                    
                    log.info("并行协作完成: agent={}", agentName);
                    
                } catch (Exception e) {
                    log.error("并行协作失败: agent={}", agentName, e);
                    results.put(agentName, "ERROR: " + e.getMessage());
                }
            });
            
            futures.add(future);
        }
        
        // 等待所有完成
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        
        session.getResults().putAll(results);
        session.setStatus(SessionStatus.COMPLETED);
        
        return results;
    }
    
    /**
     * 创建层次协作
     */
    public CollaborationSession createHierarchicalSession(String taskId, String coordinator, List<String> workers) {
        CollaborationSession session = CollaborationSession.builder()
                .sessionId(UUID.randomUUID().toString())
                .taskId(taskId)
                .mode(CollaborationMode.HIERARCHICAL)
                .agentSequence(List.of(coordinator))
                .parallelAgents(workers)
                .status(SessionStatus.INITIATED)
                .createdAt(System.currentTimeMillis())
                .results(new HashMap<>())
                .build();
        
        activeSessions.put(session.getSessionId(), session);
        return session;
    }
    
    /**
     * 获取会话
     */
    public CollaborationSession getSession(String sessionId) {
        return activeSessions.get(sessionId);
    }
    
    /**
     * 获取活跃会话数
     */
    public int getActiveSessionCount() {
        return (int) activeSessions.values().stream()
                .filter(s -> s.getStatus() == SessionStatus.RUNNING)
                .count();
    }
    
    /**
     * 清理过期会话
     */
    public void cleanupExpiredSessions(long ttlMinutes) {
        long now = System.currentTimeMillis();
        activeSessions.entrySet().removeIf(entry -> {
            CollaborationSession session = entry.getValue();
            return (now - session.getCreatedAt()) > ttlMinutes * 60 * 1000;
        });
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollaborationSession {
        private String sessionId;
        private String taskId;
        private CollaborationMode mode;
        private List<String> agentSequence;
        private List<String> parallelAgents;
        private int currentIndex;
        private SessionStatus status;
        private long createdAt;
        private Map<String, Object> results;
        private String error;
    }
    
    public enum CollaborationMode {
        PIPELINE,      // 串行管道
        PARALLEL,      // 并行
        LOOP,          // 循环
        HIERARCHICAL   // 层次
    }
    
    public enum SessionStatus {
        INITIATED,     // 初始化
        RUNNING,       // 运行中
        COMPLETED,     // 完成
        FAILED,        // 失败
        CANCELLED      // 取消
    }
}
