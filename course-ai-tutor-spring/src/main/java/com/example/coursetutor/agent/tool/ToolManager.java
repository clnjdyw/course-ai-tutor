package com.example.coursetutor.agent.tool;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 工具管理器 - 统一管理所有工具
 */
@Slf4j
@Component
public class ToolManager {
    
    private final Map<String, Tool> tools = new ConcurrentHashMap<>();
    private final Map<String, String> categoryIndex = new ConcurrentHashMap<>();
    
    @PostConstruct
    public void init() {
        log.info("ToolManager 初始化...");
        // 可以在此预注册默认工具
    }
    
    /**
     * 注册工具
     */
    public void registerTool(Tool tool) {
        if (tool == null || tool.getName() == null) {
            throw new IllegalArgumentException("Tool 或 tool.name 不能为 null");
        }
        
        String name = tool.getName().toLowerCase();
        tools.put(name, tool);
        categoryIndex.put(name, tool.getCategory());
        
        log.info("工具注册: {} (分类: {})", name, tool.getCategory());
    }
    
    /**
     * 注销工具
     */
    public void unregisterTool(String toolName) {
        String name = toolName.toLowerCase();
        tools.remove(name);
        categoryIndex.remove(name);
        log.info("工具注销: {}", name);
    }
    
    /**
     * 获取工具
     */
    public Optional<Tool> getTool(String toolName) {
        return Optional.ofNullable(tools.get(toolName.toLowerCase()));
    }
    
    /**
     * 执行工具
     */
    public ToolResult execute(String toolName, Map<String, Object> params) {
        long startTime = System.currentTimeMillis();
        
        Tool tool = tools.get(toolName.toLowerCase());
        if (tool == null) {
            return ToolResult.error("工具不存在: " + toolName)
                    .withExecutionTime(System.currentTimeMillis() - startTime);
        }
        
        try {
            if (!tool.validate(params)) {
                return ToolResult.error("参数验证失败")
                        .withExecutionTime(System.currentTimeMillis() - startTime);
            }
            
            log.info("执行工具: {} with params: {}", toolName, params);
            ToolResult result = tool.execute(params);
            return result.withExecutionTime(System.currentTimeMillis() - startTime);
            
        } catch (Exception e) {
            log.error("工具执行失败: {}", toolName, e);
            return ToolResult.error(e).withExecutionTime(System.currentTimeMillis() - startTime);
        }
    }
    
    /**
     * 获取所有可用工具
     */
    public List<Tool> getAllTools() {
        return new ArrayList<>(tools.values());
    }
    
    /**
     * 获取所有工具名称
     */
    public List<String> getAvailableTools() {
        return new ArrayList<>(tools.keySet());
    }
    
    /**
     * 获取指定分类的工具
     */
    public List<Tool> getToolsByCategory(String category) {
        return tools.values().stream()
                .filter(tool -> tool.getCategory().equalsIgnoreCase(category))
                .collect(Collectors.toList());
    }
    
    /**
     * 搜索工具（按名称、描述、标签）
     */
    public List<Tool> searchTools(String query) {
        String lowerQuery = query.toLowerCase();
        return tools.values().stream()
                .filter(tool -> 
                    tool.getName().toLowerCase().contains(lowerQuery) ||
                    tool.getDescription().toLowerCase().contains(lowerQuery) ||
                    tool.getTags().stream().anyMatch(tag -> tag.toLowerCase().contains(lowerQuery)))
                .collect(Collectors.toList());
    }
    
    /**
     * 根据用户意图推荐工具
     */
    public List<Tool> suggestTools(String intent) {
        String lowerIntent = intent.toLowerCase();
        
        return tools.values().stream()
                .filter(tool -> 
                    tool.getDescription().toLowerCase().contains(lowerIntent) ||
                    tool.getTags().stream().anyMatch(tag -> tag.toLowerCase().contains(lowerIntent)))
                .collect(Collectors.toList());
    }
    
    /**
     * 获取工具的函数调用格式（用于 LLM）
     */
    public List<Map<String, Object>> getFunctionSchemas() {
        return tools.values().stream()
                .map(tool -> {
                    Map<String, Object> schema = new HashMap<>();
                    schema.put("name", tool.getName());
                    schema.put("description", tool.getDescription());
                    schema.put("parameters", parseParametersSchema(tool.getParametersSchema()));
                    return schema;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 解析参数字符串为 Map
     */
    private Map<String, Object> parseParametersSchema(String schema) {
        if (schema == null || schema.isEmpty()) {
            Map<String, Object> emptySchema = new HashMap<>();
            emptySchema.put("type", "object");
            emptySchema.put("properties", new HashMap<>());
            return emptySchema;
        }
        
        try {
            // 简单解析，实际使用时可以用 Jackson 或 Gson
            Map<String, Object> result = new HashMap<>();
            result.put("type", "object");
            result.put("properties", new HashMap<>());
            return result;
        } catch (Exception e) {
            log.warn("解析参数 schema 失败: {}", schema);
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("type", "object");
            fallback.put("properties", new HashMap<>());
            return fallback;
        }
    }
    
    /**
     * 获取工具统计信息
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTools", tools.size());
        stats.put("tools", tools.keySet());
        stats.put("categories", categoryIndex.values().stream().distinct().collect(Collectors.toList()));
        return stats;
    }
}
