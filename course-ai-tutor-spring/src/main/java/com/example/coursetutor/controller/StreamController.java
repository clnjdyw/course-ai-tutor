package com.example.coursetutor.controller;

import com.example.coursetutor.service.AiAgentService;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;

/**
 * SSE streaming controller for AI responses using Spring AI native streaming
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StreamController {

    private final AiAgentService aiAgentService;

    @PostMapping(value = "/request/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        String message = (String) request.getOrDefault("message", "");

        SseEmitter emitter = new SseEmitter(300_000L);

        aiAgentService.stream(message, null)
                .doOnNext(chunk -> {
                    try {
                        emitter.send(SseEmitter.event().name("content").data(Map.of("content", chunk, "done", false)));
                    } catch (IOException e) {
                        // Emitter may be closed
                    }
                })
                .doOnComplete(() -> {
                    try {
                        emitter.send(SseEmitter.event().name("done").data(Map.of("done", true)));
                        emitter.complete();
                    } catch (IOException e) {
                        // Ignore
                    }
                })
                .doOnError(error -> {
                    try {
                        emitter.send(SseEmitter.event().name("error").data(Map.of("error", error.getMessage())));
                        emitter.completeWithError(error);
                    } catch (IOException e) {
                        emitter.completeWithError(error);
                    }
                })
                .subscribe();

        return emitter;
    }

    @PostMapping(value = "/agents/{agentType}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamWithAgent(@PathVariable String agentType, @RequestBody Map<String, Object> request) {
        Long userId = SecurityUtil.requireUserId();
        String message = (String) request.getOrDefault("message", "");

        SseEmitter emitter = new SseEmitter(300_000L);

        String systemPrompt = switch (agentType) {
            case "tutor" -> "You are a teaching assistant. Help students learn effectively.";
            case "planner" -> "You are a learning planner. Help students create study plans.";
            case "evaluator" -> "You are an evaluator. Assess student understanding.";
            case "companion" -> "You are a learning companion. Provide encouragement and motivation.";
            default -> "You are a helpful AI assistant.";
        };

        aiAgentService.stream(message, systemPrompt)
                .doOnNext(chunk -> {
                    try {
                        emitter.send(SseEmitter.event().name("content").data(Map.of("content", chunk, "done", false)));
                    } catch (IOException e) {
                        // Emitter may be closed
                    }
                })
                .doOnComplete(() -> {
                    try {
                        emitter.send(SseEmitter.event().name("done").data(Map.of("done", true)));
                        emitter.complete();
                    } catch (IOException e) {
                        // Ignore
                    }
                })
                .doOnError(error -> {
                    try {
                        emitter.send(SseEmitter.event().name("error").data(Map.of("error", error.getMessage())));
                        emitter.completeWithError(error);
                    } catch (IOException e) {
                        emitter.completeWithError(error);
                    }
                })
                .subscribe();

        return emitter;
    }
}
