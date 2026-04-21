package com.example.coursetutor.agent.tool.impl;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * 日期时间工具 - 获取当前时间、执行日期计算
 */
@Slf4j
@Component
public class DateTimeTool implements Tool {
    
    private static final DateTimeFormatter DEFAULT_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    
    @Override
    public String getName() {
        return "datetime";
    }
    
    @Override
    public String getDescription() {
        return "获取当前日期时间、执行日期计算、格式化日期。支持获取当前时间、计算日期间隔、日期加减、格式化输出等。";
    }
    
    @Override
    public String getParametersSchema() {
        return """
            {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "操作类型: now(获取当前时间), format(格式化日期), add(日期加减), diff(计算间隔)",
                        "enum": ["now", "format", "add", "diff"]
                    },
                    "date": {
                        "type": "string",
                        "description": "日期字符串，格式: yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss"
                    },
                    "format": {
                        "type": "string",
                        "description": "输出格式，如: yyyy-MM-dd, HH:mm, yyyy年MM月dd日"
                    },
                    "years": {
                        "type": "number",
                        "description": "加/减的年数"
                    },
                    "months": {
                        "type": "number",
                        "description": "加/减的月数"
                    },
                    "days": {
                        "type": "number",
                        "description": "加/减的天数"
                    },
                    "date1": {
                        "type": "string",
                        "description": "第一个日期"
                    },
                    "date2": {
                        "type": "string",
                        "description": "第二个日期"
                    },
                    "unit": {
                        "type": "string",
                        "description": "间隔单位: days, hours, minutes, seconds",
                        "enum": ["days", "hours", "minutes", "seconds"]
                    }
                },
                "required": ["action"]
            }
            """;
    }
    
    @Override
    public ToolResult execute(Map<String, Object> params) {
        String action = (String) params.get("action");
        
        if (action == null) {
            return ToolResult.error("action 参数不能为空");
        }
        
        try {
            return switch (action.toLowerCase()) {
                case "now" -> getCurrentTime(params);
                case "format" -> formatDate(params);
                case "add" -> addToDate(params);
                case "diff" -> calculateDiff(params);
                default -> ToolResult.error("未知操作: " + action);
            };
        } catch (Exception e) {
            log.error("日期时间操作失败: {}", action, e);
            return ToolResult.error("操作失败: " + e.getMessage());
        }
    }
    
    @Override
    public boolean validate(Map<String, Object> params) {
        return params != null && params.containsKey("action");
    }
    
    @Override
    public String getCategory() {
        return "utility";
    }
    
    @Override
    public List<String> getTags() {
        return List.of("date", "time", "datetime", "日期", "时间", "日历");
    }
    
    @Override
    public String getExample() {
        return """
            示例 1: 获取当前时间
            action: "now"
            结果: 2026-04-21 17:42:30
            
            示例 2: 格式化日期
            action: "format"
            date: "2026-04-21"
            format: "yyyy年MM月dd日"
            结果: 2026年04月21日
            
            示例 3: 日期加减
            action: "add"
            date: "2026-04-21"
            days: 7
            结果: 2026-04-28
            
            示例 4: 计算间隔
            action: "diff"
            date1: "2026-04-01"
            date2: "2026-04-21"
            unit: "days"
            结果: 20
            """;
    }
    
    private ToolResult getCurrentTime(Map<String, Object> params) {
        LocalDateTime now = LocalDateTime.now();
        String format = (String) params.get("format");
        
        String result;
        if (format != null && !format.isEmpty()) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
            result = now.format(formatter);
        } else {
            result = now.format(DEFAULT_FORMATTER);
        }
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("timestamp", now.toString());
        metadata.put("epoch", now.toEpochSecond(java.time.ZoneOffset.of("+8")));
        
        return ToolResult.success(result, metadata);
    }
    
    private ToolResult formatDate(Map<String, Object> params) {
        String dateStr = (String) params.get("date");
        String format = (String) params.get("format");
        
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return ToolResult.error("date 参数不能为空");
        }
        
        LocalDateTime date = parseDate(dateStr);
        if (date == null) {
            return ToolResult.error("日期格式错误，请使用 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss");
        }
        
        String result;
        if (format != null && !format.isEmpty()) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
            result = date.format(formatter);
        } else {
            result = date.format(DEFAULT_FORMATTER);
        }
        
        return ToolResult.success(result);
    }
    
    private ToolResult addToDate(Map<String, Object> params) {
        String dateStr = (String) params.get("date");
        Integer years = getIntParam(params, "years", 0);
        Integer months = getIntParam(params, "months", 0);
        Integer days = getIntParam(params, "days", 0);
        
        LocalDateTime date;
        if (dateStr != null && !dateStr.trim().isEmpty()) {
            date = parseDate(dateStr);
            if (date == null) {
                return ToolResult.error("日期格式错误");
            }
        } else {
            date = LocalDateTime.now();
        }
        
        LocalDateTime result = date;
        if (years != 0) result = result.plusYears(years);
        if (months != 0) result = result.plusMonths(months);
        if (days != 0) result = result.plusDays(days);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("original", date.format(DEFAULT_FORMATTER));
        metadata.put("operations", Map.of("years", years, "months", months, "days", days));
        
        return ToolResult.success(result.format(DEFAULT_FORMATTER), metadata);
    }
    
    private ToolResult calculateDiff(Map<String, Object> params) {
        String date1Str = (String) params.get("date1");
        String date2Str = (String) params.get("date2");
        String unit = (String) params.getOrDefault("unit", "days");
        
        if (date1Str == null || date2Str == null) {
            return ToolResult.error("date1 和 date2 参数不能为空");
        }
        
        LocalDateTime date1 = parseDate(date1Str);
        LocalDateTime date2 = parseDate(date2Str);
        
        if (date1 == null || date2 == null) {
            return ToolResult.error("日期格式错误");
        }
        
        long diff;
        String result;
        
        switch (unit.toLowerCase()) {
            case "hours" -> {
                diff = ChronoUnit.HOURS.between(date1, date2);
                result = String.valueOf(diff);
            }
            case "minutes" -> {
                diff = ChronoUnit.MINUTES.between(date1, date2);
                result = String.valueOf(diff);
            }
            case "seconds" -> {
                diff = ChronoUnit.SECONDS.between(date1, date2);
                result = String.valueOf(diff);
            }
            default -> {
                diff = ChronoUnit.DAYS.between(date1, date2);
                result = String.valueOf(diff);
            }
        }
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("date1", date1Str);
        metadata.put("date2", date2Str);
        metadata.put("unit", unit);
        metadata.put("sign", diff >= 0 ? "positive" : "negative");
        
        return ToolResult.success(result, metadata);
    }
    
    private LocalDateTime parseDate(String dateStr) {
        dateStr = dateStr.trim();
        
        try {
            if (dateStr.contains(":")) {
                return LocalDateTime.parse(dateStr, DEFAULT_FORMATTER);
            } else {
                return LocalDate.parse(dateStr, DATE_FORMATTER).atStartOfDay();
            }
        } catch (Exception e) {
            log.warn("日期解析失败: {}", dateStr);
            return null;
        }
    }
    
    private Integer getIntParam(Map<String, Object> params, String key, int defaultValue) {
        Object value = params.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return defaultValue;
    }
}
