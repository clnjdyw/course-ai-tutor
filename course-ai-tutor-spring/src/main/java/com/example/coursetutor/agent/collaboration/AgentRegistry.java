package com.example.coursetutor.agent.collaboration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Agent 注册中心 - 管理所有 Agent 的注册和状态
 */
@Slf4j
@Component
public class AgentRegistry {
    
    /** Agent 注册表 */
    private final Map<String, AgentInfo> agents = new ConcurrentHashMap<>();
    
    /** Agent 实例 Map */
    private final Map<String, Object> agentInstances = new ConcurrentHashMap<>();
    
    @PostConstruct
    public void init() {
        // 注册系统内置 Agent
        registerDefaultAgents();
    }
    
    /**
     * 注册默认 Agent
     */
    private void registerDefaultAgents() {
        register("Manager", "管理智能体", AgentType.MANAGER, this);
        register("Planner", "规划智能体", AgentType.PLANNER, null);
        register("Tutor", "教学智能体", AgentType.TUTOR, null);
        register("Helper", "答疑智能体", AgentType.HELPER, null);
        register("Evaluator", "评估智能体", AgentType.EVALUATOR, null);
        register("Companion", "陪伴智能体", AgentType.COMPANION, null);
        register("Orchestrator", "协调器", AgentType.ORCHESTRATOR, null);
        
        log.info("默认 Agent 注册完成，共 {} 个", agents.size());
    }
    
    /**
     * 注册 Agent
     */
    public void register(String name, String description, AgentType type, Object instance) {
        AgentInfo info = AgentInfo.builder()
                .name(name)
                .description(description)
                .type(type)
                .status(AgentStatus.ONLINE)
                .registeredAt(LocalDateTime.now())
                .lastHeartbeat(LocalDateTime.now())
                .capabilities(new ArrayList<>())
                .build();
        
        agents.put(name, info);
        if (instance != null) {
            agentInstances.put(name, instance);
        }
        
        log.info("Agent 注册: {} ({})", name, type);
    }
    
    /**
     * 注销 Agent
     */
    public void unregister(String name) {
        AgentInfo info = agents.get(name);
        if (info != null) {
            info.setStatus(AgentStatus.OFFLINE);
            agents.remove(name);
            agentInstances.remove(name);
            log.info("Agent 注销: {}", name);
        }
    }
    
    /**
     * 获取 Agent 信息
     */
    public Optional<AgentInfo> getAgent(String name) {
        return Optional.ofNullable(agents.get(name));
    }
    
    /**
     * 获取 Agent 实例
     */
    @SuppressWarnings("unchecked")
    public <T> T getAgentInstance(String name) {
        return (T) agentInstances.get(name);
    }
    
    /**
     * 获取所有 Agent
     */
    public List<AgentInfo> getAllAgents() {
        return new ArrayList<>(agents.values());
    }
    
    /**
     * 按类型获取 Agent
     */
    public List<AgentInfo> getAgentsByType(AgentType type) {
        return agents.values().stream()
                .filter(info -> info.getType() == type)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取在线 Agent
     */
    public List<AgentInfo> getOnlineAgents() {
        return agents.values().stream()
                .filter(info -> info.getStatus() == AgentStatus.ONLINE)
                .collect(Collectors.toList());
    }
    
    /**
     * 更新心跳
     */
    public void heartbeat(String name) {
        AgentInfo info = agents.get(name);
        if (info != null) {
            info.setLastHeartbeat(LocalDateTime.now());
            if (info.getStatus() == AgentStatus.OFFLINE) {
                info.setStatus(AgentStatus.ONLINE);
            }
        }
    }
    
    /**
     * 更新状态
     */
    public void updateStatus(String name, AgentStatus status) {
        AgentInfo info = agents.get(name);
        if (info != null) {
            info.setStatus(status);
        }
    }
    
    /**
     * 添加能力
     */
    public void addCapability(String name, String capability) {
        AgentInfo info = agents.get(name);
        if (info != null) {
            info.getCapabilities().add(capability);
        }
    }
    
    /**
     * 选择最合适的 Agent
     */
    public Optional<String> selectAgent(AgentType type, List<String> requiredCapabilities) {
        return agents.values().stream()
                .filter(info -> info.getType() == type && info.getStatus() == AgentStatus.ONLINE)
                .filter(info -> {
                    if (requiredCapabilities == null || requiredCapabilities.isEmpty()) {
                        return true;
                    }
                    Set<String> caps = new HashSet<>(info.getCapabilities());
                    return caps.containsAll(requiredCapabilities);
                })
                .findFirst()
                .map(AgentInfo::getName);
    }
    
    /**
     * 获取统计信息
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAgents", agents.size());
        stats.put("onlineAgents", agents.values().stream()
                .filter(i -> i.getStatus() == AgentStatus.ONLINE).count());
        stats.put("byType", agents.values().stream()
                .collect(Collectors.groupingBy(i -> i.getType().name(), Collectors.counting())));
        return stats;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentInfo {
        private String name;
        private String description;
        private AgentType type;
        private AgentStatus status;
        private LocalDateTime registeredAt;
        private LocalDateTime lastHeartbeat;
        private List<String> capabilities;
        private Map<String, Object> metadata;
    }
    
    public enum AgentStatus {
        ONLINE,     // 在线
        OFFLINE,    // 离线
        BUSY,       // 忙碌
        ERROR       // 错误
    }
    
    public enum AgentType {
        MANAGER,      // 管理
        PLANNER,      // 规划
        TUTOR,        // 教学
        HELPER,       // 答疑
        EVALUATOR,    // 评估
        COMPANION,    // 陪伴
        ORCHESTRATOR  // 协调
    }
}
