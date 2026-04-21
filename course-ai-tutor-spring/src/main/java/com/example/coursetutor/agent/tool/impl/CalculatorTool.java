package com.example.coursetutor.agent.tool.impl;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 计算器工具 - 支持数学表达式计算
 */
@Slf4j
@Component
public class CalculatorTool implements Tool {
    
    private final ScriptEngine engine;
    
    public CalculatorTool() {
        ScriptEngineManager manager = new ScriptEngineManager();
        this.engine = manager.getEngineByName("JavaScript");
    }
    
    @Override
    public String getName() {
        return "calculator";
    }
    
    @Override
    public String getDescription() {
        return "执行数学计算。可以计算算术表达式、百分比、统计值等。输入数学表达式，返回计算结果。";
    }
    
    @Override
    public String getParametersSchema() {
        return """
            {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "数学表达式，如 '2 + 3 * 4' 或 'sqrt(16) + 5' 或 '100 * 0.15'"
                    }
                },
                "required": ["expression"]
            }
            """;
    }
    
    @Override
    public ToolResult execute(Map<String, Object> params) {
        String expression = (String) params.get("expression");
        
        if (expression == null || expression.trim().isEmpty()) {
            return ToolResult.error("表达式不能为空");
        }
        
        try {
            // 预处理表达式
            String processedExpr = preprocessExpression(expression);
            
            // 执行计算
            Object result = engine.eval(processedExpr);
            
            // 格式化结果
            String formattedResult = formatResult(result);
            
            log.info("计算完成: {} = {}", expression, formattedResult);
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("expression", expression);
            metadata.put("processedExpression", processedExpr);
            metadata.put("resultType", result.getClass().getSimpleName());
            
            return ToolResult.success(formattedResult, metadata);
            
        } catch (ScriptException e) {
            log.error("计算失败: {}", expression, e);
            return ToolResult.error("计算错误: " + e.getMessage());
        }
    }
    
    @Override
    public boolean validate(Map<String, Object> params) {
        return params != null && params.containsKey("expression");
    }
    
    @Override
    public String getCategory() {
        return "calculation";
    }
    
    @Override
    public List<String> getTags() {
        return List.of("math", "calculation", "算术", "统计", "百分比");
    }
    
    @Override
    public String getExample() {
        return """
            示例 1: 算术计算
            expression: "2 + 3 * 4"
            结果: 14
            
            示例 2: 百分比计算
            expression: "100 * 0.15"
            结果: 15
            
            示例 3: 统计计算
            expression: "(85 + 90 + 78) / 3"
            结果: 84.33
            """;
    }
    
    /**
     * 预处理表达式
     */
    private String preprocessExpression(String expression) {
        String result = expression.trim();
        
        // 替换常见中文符号
        result = result.replaceAll("（", "(").replaceAll("）", ")");
        result = result.replaceAll("，", ",").replaceAll("。", ".");
        
        // 移除 "等于"、"的结果" 等文字
        result = result.replaceAll("等于\\s*", "");
        result = result.replaceAll("的结果\\s*", "");
        
        // 替换数学函数别名
        result = result.replaceAll("平方根\\s*\\(", "sqrt(");
        result = result.replaceAll("开方\\s*\\(", "pow(");
        result = result.replaceAll("绝对值\\s*\\(", "Math.abs(");
        
        return result;
    }
    
    /**
     * 格式化结果
     */
    private String formatResult(Object result) {
        if (result instanceof Double) {
            double value = (Double) result;
            if (value == Math.floor(value) && !Double.isInfinite(value)) {
                return String.valueOf((long) value);
            }
            BigDecimal bd = new BigDecimal(value).setScale(6, RoundingMode.HALF_UP);
            return bd.stripTrailingZeros().toString();
        } else if (result instanceof Float) {
            float value = (Float) result;
            BigDecimal bd = new BigDecimal(value).setScale(6, RoundingMode.HALF_UP);
            return bd.stripTrailingZeros().toString();
        }
        return result.toString();
    }
}
