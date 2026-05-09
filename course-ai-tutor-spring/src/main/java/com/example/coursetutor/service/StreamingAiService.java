package com.example.coursetutor.service;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

/**
 * Streaming AI service using Spring AI native Flux streaming
 */
@Service
public class StreamingAiService {

    private final ChatModel chatModel;

    public StreamingAiService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    /**
     * Stream AI response as Flux of content chunks
     */
    public Flux<String> stream(String prompt) {
        return chatModel.stream(prompt);
    }

    /**
     * Stream AI response with system prompt
     */
    public Flux<String> stream(String prompt, String systemPrompt) {
        String fullPrompt = systemPrompt + "\n\n" + prompt;
        return chatModel.stream(fullPrompt);
    }

    /**
     * Stream with full ChatResponse objects (includes metadata)
     */
    public Flux<ChatResponse> streamWithResponse(String prompt) {
        return chatModel.stream(new Prompt(prompt));
    }
}
