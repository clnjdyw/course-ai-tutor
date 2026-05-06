package com.example.coursetutor.agent.tool.impl;

import com.example.coursetutor.agent.tool.Tool;
import com.example.coursetutor.agent.tool.ToolResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * 代码执行器工具 - 已禁用，存在 RCE 安全风险
 * 原 ScriptEngine.eval() 允许任意代码执行，需要沙箱化后才能重新启用。
 */
@Slf4j
@Component
public class CodeExecutorTool implements Tool {

    @Override
    public String getName() {
        return "code_executor";
    }

    @Override
    public String getDescription() {
        return "代码执行功能（已禁用，待沙箱化改造）";
    }

    @Override
    public String getParametersSchema() {
        return "{}";
    }

    @Override
    public ToolResult execute(Map<String, Object> params) {
        return ToolResult.error("代码执行功能已禁用，请联系管理员");
    }

    @Override
    public boolean validate(Map<String, Object> params) {
        return false;
    }

    @Override
    public String getCategory() {
        return "execution";
    }

    @Override
    public List<String> getTags() {
        return List.of("code", "disabled");
    }

    @Override
    public String getExample() {
        return "功能已禁用";
    }
}
