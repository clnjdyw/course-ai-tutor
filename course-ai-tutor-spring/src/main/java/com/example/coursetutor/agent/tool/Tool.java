package com.example.coursetutor.agent.tool;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 工具接口 - 所有工具必须实现此接口
 */
public interface Tool {
    
    /**
     * 获取工具名称
     */
    String getName();
    
    /**
     * 获取工具描述（用于 LLM 理解工具用途）
     */
    String getDescription();
    
    /**
     * 获取参数定义（JSON Schema 格式）
     */
    String getParametersSchema();
    
    /**
     * 执行工具
     * @param params 参数Map
     * @return 执行结果
     */
    ToolResult execute(Map<String, Object> params);
    
    /**
     * 验证参数是否合法
     */
    default boolean validate(Map<String, Object> params) {
        return true;
    }
    
    /**
     * 获取工具分类
     */
    default String getCategory() {
        return "general";
    }
    
    /**
     * 获取示例用法
     */
    default String getExample() {
        return null;
    }
    
    /**
     * 获取工具标签（用于搜索和分类）
     */
    default List<String> getTags() {
        return List.of();
    }
    
    /**
     * 参数定义
     */
    @Data
    class Parameter {
        private String name;
        private String type;          // string, number, boolean, array, object
        private String description;
        private boolean required;
        private Object defaultValue;
        private List<String> enumValues;  // 枚举值
        
        public Parameter() {}
        
        public Parameter(String name, String type, String description, boolean required) {
            this.name = name;
            this.type = type;
            this.description = description;
            this.required = required;
        }
    }
}
