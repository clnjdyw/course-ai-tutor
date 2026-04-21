package com.example.coursetutor.controller;

import com.example.coursetutor.agent.AgentManager;
import com.example.coursetutor.agent.CompanionAgent;
import com.example.coursetutor.dto.AgentRequest;
import com.example.coursetutor.dto.AgentResponse;
import com.example.coursetutor.dto.ChatRequest;
import com.example.coursetutor.dto.ChatResponse;
import com.example.coursetutor.entity.UserMoodEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 智能体控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/agent")
public class AgentController {

    @Autowired
    private AgentManager agentManager;

    @Autowired
    private CompanionAgent companionAgent;

    @Autowired
    private ChatClient chatClient;

    /**
     * 统一请求入口
     */
    @PostMapping("/request")
    public ResponseEntity<AgentResponse> handleRequest(@RequestBody AgentRequest request) {
        log.info("收到智能体请求：{}", request);
        AgentResponse response = agentManager.handleRequest(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 流式请求入口（SSE）
     */
    @PostMapping(value = "/request/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter handleStreamRequest(@RequestBody AgentRequest request) {
        log.info("收到流式智能体请求：userId={}, type={}", request.getUserId(), request.getType());
        
        SseEmitter emitter = new SseEmitter(5 * 60 * 1000L); // 5分钟超时
        
        // 异步处理流式响应
        new Thread(() -> {
            try {
                String systemPrompt = getSystemPromptByType(request.getType());
                String userPrompt = buildUserPrompt(request);
                
                StringBuilder fullContent = new StringBuilder();
                
                chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .stream()
                    .content()
                    .doOnNext(chunk -> {
                        try {
                            if (chunk != null && !chunk.isEmpty()) {
                                fullContent.append(chunk);
                                Map<String, Object> data = new HashMap<>();
                                data.put("content", fullContent.toString());
                                data.put("done", false);
                                emitter.send(SseEmitter.event().data(data));
                            }
                        } catch (IOException e) {
                            log.error("发送 SSE 数据失败", e);
                        }
                    })
                    .doOnComplete(() -> {
                        try {
                            Map<String, Object> data = new HashMap<>();
                            data.put("content", fullContent.toString());
                            data.put("done", true);
                            emitter.send(SseEmitter.event().name("done").data(data));
                            emitter.complete();
                            log.info("流式响应完成");
                        } catch (IOException e) {
                            log.error("完成 SSE 流失败", e);
                        }
                    })
                    .doOnError(error -> {
                        log.error("流式响应错误", error);
                        try {
                            emitter.completeWithError(error);
                        } catch (Exception e) {
                            log.error("关闭 SSE 失败", e);
                        }
                    })
                    .subscribe();
                    
            } catch (Exception e) {
                log.error("处理流式请求失败", e);
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    log.error("关闭 SSE 失败", ex);
                }
            }
        }).start();
        
        return emitter;
    }

    /**
     * 根据请求类型获取系统提示词
     */
    private String getSystemPromptByType(String type) {
        return switch (type != null ? type.toLowerCase() : "") {
            case "plan", "planner", "规划" -> 
                """
                你是一位专业的学习规划师，擅长根据学生的目标和水平制定个性化的学习计划。
                核心规划原则：
                1. 目标拆解：把大目标变成小游戏，每个阶段都有小成就
                2. 时间合理：考虑学生注意力时长，每次学习 15-25 分钟
                3. 劳逸结合：安排休息时间和娱乐活动
                4. 激励设计：每个阶段完成后有奖励建议
                5. 灵活调整：根据学生实际情况可调整进度
                """;
            case "teach", "tutor", "教学" ->
                """
                你是一位经验丰富的课程讲师，擅长用简单易懂的方式讲解复杂概念。
                核心教学原则：
                1. 苏格拉底式引导：通过提问引导学生自己思考
                2. 循序渐进：由浅入深，每次只讲解一个小概念
                3. 启发式教学：当学生问答案时，引导思考而非直接回答
                4. 鼓励探索：对尝试给予积极反馈
                5. 举例说明：用生活中的例子帮助理解抽象概念
                """;
            case "help", "helper", "答疑" ->
                """
                你是一位耐心的答疑助手，负责实时解答学生的问题。
                核心答疑原则：
                1. 引导思考：先问学生"你是怎么想的？"
                2. 分步提示：卡住时给出提示，而非完整解答
                3. 错误分析：帮助分析错误原因
                4. 鼓励尝试：鼓励再次尝试
                5. 追问澄清：如果问题不清楚，请学生具体说明
                """;
            case "evaluate", "evaluator", "评估" ->
                """
                你是一位专业的学习评估师，负责评估学生的学习效果并提供反馈。
                核心评估原则：
                1. 正向激励：先找优点，再提改进建议，最后鼓励
                2. 具体反馈：具体指出做得好的地方
                3. 成长思维：强调进步和潜力
                4. 可操作建议：每个改进点都要给出具体的做法
                5. 温和纠错：用"可以试试..."代替"你错了"
                """;
            default ->
                """
                你是一位贴心的学习伙伴，负责陪伴学生学习和交流。
                核心陪伴原则：
                1. 情绪识别：根据学生的表达判断情绪状态
                2. 共情回应：先回应情绪，再回应内容
                3. 积极引导：用积极的角度重新framing困难
                4. 温暖有趣：像一个大朋友一样说话
                5. 记住偏好：记住学生喜欢的东西
                """;
        };
    }

    /**
     * 构建用户提示词
     */
    private String buildUserPrompt(AgentRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("用户ID: ").append(request.getUserId()).append("\n\n");
        
        if (request.getContent() != null && !request.getContent().isEmpty()) {
            prompt.append("请求内容: ").append(request.getContent()).append("\n");
        }
        
        if (request.getContext() != null && !request.getContext().isEmpty()) {
            prompt.append("上下文信息: ").append(request.getContext()).append("\n");
        }
        
        return prompt.toString();
    }

    /**
     * 聊天接口
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.info("收到聊天请求：{}", request);
        ChatResponse response = companionAgent.chat(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户情绪历史
     */
    @GetMapping("/mood/history/{userId}")
    public ResponseEntity<Map<String, Object>> getMoodHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "7") int days) {
        log.info("获取用户情绪历史：userId={}, days={}", userId, days);

        List<UserMoodEntity> history = companionAgent.getMoodHistory(userId, days);
        CompanionAgent.MoodSnapshot currentMood = companionAgent.getCurrentMood(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("currentMood", currentMood);
        response.put("history", history);
        response.put("totalRecords", history.size());

        return ResponseEntity.ok(response);
    }

    /**
     * 获取用户当前情绪状态
     */
    @GetMapping("/mood/current/{userId}")
    public ResponseEntity<Map<String, Object>> getCurrentMood(@PathVariable Long userId) {
        log.info("获取用户当前情绪：userId={}", userId);

        CompanionAgent.MoodSnapshot currentMood = companionAgent.getCurrentMood(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("mood", currentMood);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取智能体状态
     */
    @GetMapping("/status")
    public ResponseEntity<String> getAgentStatus() {
        String status = agentManager.getAgentStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * 获取所有智能体信息
     */
    @GetMapping("/list")
    public ResponseEntity<?> getAgentList() {
        return ResponseEntity.ok(agentManager.getAllAgents().stream()
            .map(agent -> new AgentInfo(
                agent.getAgentName(),
                agent.getAgentDescription(),
                agent.getAgentType().name()
            ))
            .toList());
    }

    public record AgentInfo(String name, String description, String type) {}
}
