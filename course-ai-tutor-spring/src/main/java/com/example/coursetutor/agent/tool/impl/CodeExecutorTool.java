package com.example.coursetutor.agent.tool.impl;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.script.CompiledScript;
import javax.script.Invocable;
import java.io.StringReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 代码执行器工具 - 安全地执行代码
 */
@Slf4j
@Component
public class CodeExecutorTool implements Tool {
    
    private final ScriptEngineManager manager;
    private final ExecutorService executor;
    private final Map<String, ScriptEngine> engineCache;
    
    // 安全限制
    private static final int MAX_EXECUTION_TIME_MS = 10000;  // 10秒超时
    private static final int MAX_OUTPUT_LENGTH = 10000;      // 最大输出长度
    private static final List<String> ALLOWED_LANGUAGES = List.of("javascript", "python", "js");
    
    public CodeExecutorTool() {
        this.manager = new ScriptEngineManager();
        this.executor = Executors.newFixedThreadPool(4);
        this.engineCache = new ConcurrentHashMap<>();
    }
    
    @Override
    public String getName() {
        return "code_executor";
    }
    
    @Override
    public String getDescription() {
        return "安全地执行代码片段。支持 JavaScript (Nashorn)。可用于计算、验证代码逻辑、生成测试数据等。执行有超时限制（10秒）和输出限制。";
    }
    
    @Override
    public String getParametersSchema() {
        return """
            {
                "type": "object",
                "properties": {
                    "language": {
                        "type": "string",
                        "description": "编程语言: javascript",
                        "enum": ["javascript", "js"]
                    },
                    "code": {
                        "type": "string",
                        "description": "要执行的代码"
                    },
                    "timeout": {
                        "type": "number",
                        "description": "超时时间（毫秒），默认10000"
                    }
                },
                "required": ["language", "code"]
            }
            """;
    }
    
    @Override
    public ToolResult execute(Map<String, Object> params) {
        String language = (String) params.get("language");
        String code = (String) params.get("code");
        int timeout = getIntParam(params, "timeout", MAX_EXECUTION_TIME_MS);
        
        if (language == null || code == null) {
            return ToolResult.error("language 和 code 参数不能为空");
        }
        
        if (!ALLOWED_LANGUAGES.contains(language.toLowerCase())) {
            return ToolResult.error("不支持的语言: " + language + "，支持的: " + ALLOWED_LANGUAGES);
        }
        
        try {
            log.info("执行代码: language={}, length={}", language, code.length());
            return executeWithTimeout(code, language, timeout);
        } catch (Exception e) {
            log.error("代码执行失败", e);
            return ToolResult.error("执行失败: " + e.getMessage());
        }
    }
    
    @Override
    public boolean validate(Map<String, Object> params) {
        if (params == null || !params.containsKey("language") || !params.containsKey("code")) {
            return false;
        }
        String code = (String) params.get("code");
        // 基本安全检查
        return code != null && 
               !code.toLowerCase().contains("system") &&
               !code.toLowerCase().contains("runtime") &&
               !code.toLowerCase().contains("process");
    }
    
    @Override
    public String getCategory() {
        return "execution";
    }
    
    @Override
    public List<String> getTags() {
        return List.of("code", "execute", "代码", "执行", "运行", "脚本");
    }
    
    @Override
    public String getExample() {
        return """
            示例 1: 数学计算
            language: "javascript"
            code: "Math.sqrt(16) + Math.pow(2, 3)"
            结果: 12
            
            示例 2: 字符串处理
            language: "javascript"
            code: "'hello world'.toUpperCase()"
            结果: "HELLO WORLD"
            
            示例 3: 数据处理
            language: "javascript"
            code: "[1,2,3,4,5].filter(x => x % 2 === 0).reduce((a, b) => a + b, 0)"
            结果: 6
            """;
    }
    
    private ToolResult executeWithTimeout(String code, String language, int timeout) throws Exception {
        Future<ToolResult> future = executor.submit(() -> executeCode(code, language));
        
        try {
            return future.get(timeout, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            return ToolResult.error("代码执行超时（超过 " + (timeout/1000) + " 秒）");
        } catch (ExecutionException e) {
            return ToolResult.error("执行错误: " + e.getCause().getMessage());
        }
    }
    
    private ToolResult executeCode(String code, String language) {
        long startTime = System.currentTimeMillis();
        StringBuilder output = new StringBuilder();
        
        try {
            ScriptEngine engine = getEngine(language);
            
            // 创建自定义输出流
            java.io.StringWriter writer = new java.io.StringWriter();
            engine.getContext().setWriter(writer);
            
            // 执行代码
            Object result = engine.eval(code);
            
            // 获取输出
            String execOutput = writer.toString();
            if (execOutput != null && !execOutput.isEmpty()) {
                output.append(execOutput);
            }
            
            // 添加返回值
            if (result != null) {
                if (output.length() > 0) {
                    output.append("\n");
                }
                output.append("=> ");
                output.append(formatResult(result));
            }
            
            // 截断过长的输出
            String finalOutput = truncateOutput(output.toString());
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("language", language);
            metadata.put("executionTimeMs", executionTime);
            metadata.put("truncated", output.length() > MAX_OUTPUT_LENGTH);
            
            log.info("代码执行成功，耗时: {}ms", executionTime);
            
            return ToolResult.success(finalOutput, metadata);
            
        } catch (ScriptException e) {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("language", language);
            metadata.put("errorType", "ScriptException");
            
            return ToolResult.error("脚本错误: " + e.getMessage());
        }
    }
    
    private ScriptEngine getEngine(String language) {
        return engineCache.computeIfAbsent(language, lang -> {
            if ("javascript".equalsIgnoreCase(lang) || "js".equalsIgnoreCase(lang)) {
                return manager.getEngineByName("JavaScript");
            }
            return manager.getEngineByName(lang);
        });
    }
    
    private String formatResult(Object result) {
        if (result == null) {
            return "undefined";
        }
        if (result instanceof String) {
            return "\"" + result + "\"";
        }
        if (result instanceof Double) {
            double value = (Double) result;
            if (value == Math.floor(value) && !Double.isInfinite(value)) {
                return String.valueOf((long) value);
            }
            return String.format("%.6f", value).replaceAll("0+$", "").replaceAll("\\.$", "");
        }
        if (result instanceof Float) {
            return String.format("%.6f", (Float) result).replaceAll("0+$", "").replaceAll("\\.$", "");
        }
        if (result instanceof Object[]) {
            return java.util.Arrays.toString((Object[]) result);
        }
        if (result instanceof int[]) {
            return java.util.Arrays.toString((int[]) result);
        }
        if (result instanceof double[]) {
            return java.util.Arrays.toString((double[]) result);
        }
        return result.toString();
    }
    
    private String truncateOutput(String output) {
        if (output.length() <= MAX_OUTPUT_LENGTH) {
            return output;
        }
        return output.substring(0, MAX_OUTPUT_LENGTH) + 
               "\n... (输出已截断，超过最大长度 " + MAX_OUTPUT_LENGTH + " 字符)";
    }
    
    private int getIntParam(Map<String, Object> params, String key, int defaultValue) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
}
