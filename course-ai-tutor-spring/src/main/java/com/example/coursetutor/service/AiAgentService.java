package com.example.coursetutor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.*;

/**
 * AI Service wrapper using Spring AI ChatClient
 */
@Service
@RequiredArgsConstructor
public class AiAgentService {

    private final ChatModel chatModel;
    private final StreamingAiService streamingAiService;
    private ChatClient chatClient;

    public ChatClient getChatClient() {
        if (chatClient == null) {
            chatClient = ChatClient.builder(chatModel).build();
        }
        return chatClient;
    }

    public String chat(String prompt) {
        return getChatClient().prompt()
                .user(prompt)
                .call()
                .content();
    }

    public String chat(String prompt, String systemPrompt) {
        return getChatClient().prompt()
                .system(systemPrompt)
                .user(prompt)
                .call()
                .content();
    }

    /**
     * Chat with tool callbacks enabled
     */
    public String chatWithTools(String prompt, String systemPrompt) {
        return getChatClient().prompt()
                .system(systemPrompt != null ? systemPrompt : "You are a helpful learning assistant. Use available tools to get user context when needed.")
                .user(prompt)
                .call()
                .content();
    }

    /**
     * Stream response with tool support
     */
    public reactor.core.publisher.Flux<String> stream(String prompt, String systemPrompt) {
        return streamingAiService.stream(prompt, systemPrompt);
    }

    public Map<String, Object> structuredResponse(String prompt, Class<?> responseType) {
        String content = chat(prompt);
        // Parse JSON response - in production use Jackson ObjectMapper
        Map<String, Object> result = new HashMap<>();
        result.put("content", content);
        return result;
    }
}
