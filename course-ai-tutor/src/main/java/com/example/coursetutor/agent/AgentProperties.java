package com.example.coursetutor.agent;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 智能体配置属性
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.agent")
public class AgentProperties {
    
    private Planner planner = new Planner();
    private Tutor tutor = new Tutor();
    private Helper helper = new Helper();
    private Evaluator evaluator = new Evaluator();
    
    @Data
    public static class Planner {
        private boolean enabled = true;
        private String model = "Qwen/Qwen2.5-Coder-32B-Instruct";
    }
    
    @Data
    public static class Tutor {
        private boolean enabled = true;
        private String model = "Qwen/Qwen2.5-Coder-32B-Instruct";
    }
    
    @Data
    public static class Helper {
        private boolean enabled = true;
        private String model = "Qwen/Qwen2.5-Coder-32B-Instruct";
    }
    
    @Data
    public static class Evaluator {
        private boolean enabled = true;
        private String model = "Qwen/Qwen2.5-Coder-32B-Instruct";
    }
}
