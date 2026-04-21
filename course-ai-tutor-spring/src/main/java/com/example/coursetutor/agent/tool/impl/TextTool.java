package com.example.coursetutor.agent.tool.impl;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 文本处理工具 - 文本转换、提取、统计等功能
 */
@Slf4j
@Component
public class TextTool implements Tool {
    
    @Override
    public String getName() {
        return "text_processor";
    }
    
    @Override
    public String getDescription() {
        return "文本处理工具，支持文本转换、提取、统计、格式化等操作。用于处理用户输入、格式化输出、数据清洗等场景。";
    }
    
    @Override
    public String getParametersSchema() {
        return """
            {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "操作类型: uppercase/lowercase/titlecase(大小写), trim(去空格), extract_numbers(提取数字), extract_keywords(提取关键词), count_words(统计词数), summarize(摘要), json_format(JSON格式化)",
                        "enum": ["uppercase", "lowercase", "titlecase", "trim", "extract_numbers", "extract_keywords", "count_words", "summarize", "json_format"]
                    },
                    "text": {
                        "type": "string",
                        "description": "要处理的文本"
                    },
                    "max_length": {
                        "type": "number",
                        "description": "最大长度，用于摘要等"
                    }
                },
                "required": ["action", "text"]
            }
            """;
    }
    
    @Override
    public ToolResult execute(Map<String, Object> params) {
        String action = (String) params.get("action");
        String text = (String) params.get("text");
        
        if (action == null || text == null) {
            return ToolResult.error("action 和 text 参数不能为空");
        }
        
        try {
            return switch (action.toLowerCase()) {
                case "uppercase" -> toUpperCase(text);
                case "lowercase" -> toLowerCase(text);
                case "titlecase" -> toTitleCase(text);
                case "trim" -> trimText(text);
                case "extract_numbers" -> extractNumbers(text);
                case "extract_keywords" -> extractKeywords(text);
                case "count_words" -> countWords(text);
                case "summarize" -> summarize(text, params);
                case "json_format" -> jsonFormat(text);
                default -> ToolResult.error("未知操作: " + action);
            };
        } catch (Exception e) {
            log.error("文本处理失败: {}", action, e);
            return ToolResult.error("处理失败: " + e.getMessage());
        }
    }
    
    @Override
    public boolean validate(Map<String, Object> params) {
        return params != null && params.containsKey("action") && params.containsKey("text");
    }
    
    @Override
    public String getCategory() {
        return "utility";
    }
    
    @Override
    public List<String> getTags() {
        return List.of("text", "string", "文本", "字符串", "处理", "格式化");
    }
    
    @Override
    public String getExample() {
        return """
            示例 1: 转大写
            action: "uppercase"
            text: "hello world"
            结果: "HELLO WORLD"
            
            示例 2: 提取数字
            action: "extract_numbers"
            text: "订单号12345，总价998.5元"
            结果: "[12345, 998.5]"
            
            示例 3: 统计词数
            action: "count_words"
            text: "Hello world, this is a test."
            结果: 6
            """;
    }
    
    private ToolResult toUpperCase(String text) {
        return ToolResult.success(text.toUpperCase());
    }
    
    private ToolResult toLowerCase(String text) {
        return ToolResult.success(text.toLowerCase());
    }
    
    private ToolResult toTitleCase(String text) {
        String[] words = text.split("\\s+");
        StringBuilder result = new StringBuilder();
        
        for (int i = 0; i < words.length; i++) {
            if (words[i].isEmpty()) continue;
            if (i > 0) result.append(" ");
            result.append(words[i].substring(0, 1).toUpperCase())
                  .append(words[i].substring(1).toLowerCase());
        }
        
        return ToolResult.success(result.toString());
    }
    
    private ToolResult trimText(String text) {
        return ToolResult.success(text.trim().replaceAll("\\s+", " "));
    }
    
    private ToolResult extractNumbers(String text) {
        List<Double> numbers = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean hasDecimal = false;
        
        for (char c : text.toCharArray()) {
            if (Character.isDigit(c)) {
                current.append(c);
            } else if (c == '.' && !hasDecimal && current.length() > 0) {
                current.append(c);
                hasDecimal = true;
            } else if (c == '-' && current.length() == 0) {
                current.append(c);
            } else {
                if (current.length() > 0) {
                    try {
                        numbers.add(Double.parseDouble(current.toString()));
                    } catch (NumberFormatException ignored) {}
                    current = new StringBuilder();
                    hasDecimal = false;
                }
            }
        }
        
        if (current.length() > 0) {
            try {
                numbers.add(Double.parseDouble(current.toString()));
            } catch (NumberFormatException ignored) {}
        }
        
        return ToolResult.success(numbers.toString());
    }
    
    private ToolResult extractKeywords(String text) {
        // 简单的关键词提取（实际应用中可使用TF-IDF等算法）
        String[] words = text.toLowerCase()
                .replaceAll("[^a-zA-Z\\u4e00-\\u9fa5]", " ")
                .split("\\s+");
        
        Map<String, Integer> wordCount = new HashMap<>();
        Set<String> stopWords = Set.of("the", "a", "an", "is", "are", "was", "were", "的", "是", "在", "了", "和");
        
        for (String word : words) {
            if (word.length() > 2 && !stopWords.contains(word)) {
                wordCount.merge(word, 1, Integer::sum);
            }
        }
        
        // 按频率排序，取前10个
        List<String> keywords = wordCount.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(10)
                .map(Map.Entry::getKey)
                .toList();
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("totalWords", words.length);
        metadata.put("uniqueWords", wordCount.size());
        
        return ToolResult.success(keywords.toString(), metadata);
    }
    
    private ToolResult countWords(String text) {
        String[] words = text.trim().split("\\s+");
        int count = 0;
        
        for (String word : words) {
            if (!word.isEmpty()) count++;
        }
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("words", count);
        metadata.put("characters", text.length());
        metadata.put("charactersNoSpaces", text.replaceAll("\\s", "").length());
        
        return ToolResult.success(String.valueOf(count), metadata);
    }
    
    private ToolResult summarize(String text, Map<String, Object> params) {
        int maxLength = getIntParam(params, "max_length", 100);
        
        // 简单摘要：取前N个字符
        String summary;
        if (text.length() <= maxLength) {
            summary = text;
        } else {
            // 在句子边界截断
            int cutoff = text.lastIndexOf("。", maxLength);
            if (cutoff < maxLength / 2) {
                cutoff = text.lastIndexOf(".", maxLength);
            }
            if (cutoff < maxLength / 2) {
                cutoff = text.lastIndexOf("，", maxLength);
            }
            if (cutoff < maxLength / 2) {
                cutoff = text.lastIndexOf(",", maxLength);
            }
            if (cutoff < 0) {
                cutoff = maxLength;
            }
            summary = text.substring(0, cutoff) + "...";
        }
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("originalLength", text.length());
        metadata.put("summaryLength", summary.length());
        
        return ToolResult.success(summary, metadata);
    }
    
    private ToolResult jsonFormat(String text) {
        try {
            // 尝试解析并重新格式化
            Object parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue(text, Object.class);
            String formatted = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(parsed);
            return ToolResult.success(formatted);
        } catch (Exception e) {
            return ToolResult.error("JSON格式错误: " + e.getMessage());
        }
    }
    
    private int getIntParam(Map<String, Object> params, String key, int defaultValue) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
}
