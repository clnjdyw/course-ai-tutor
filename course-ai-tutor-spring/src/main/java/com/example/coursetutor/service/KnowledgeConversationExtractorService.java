package com.example.coursetutor.service;

import com.example.coursetutor.entity.Conversation;
import com.example.coursetutor.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Extracts knowledge points from conversations
 */
@Service
@RequiredArgsConstructor
public class KnowledgeConversationExtractorService {

    private final AiAgentService aiAgentService;
    private final ConversationRepository conversationRepository;

    public List<Map<String, Object>> extractFromConversation(Long conversationId) {
        return conversationRepository.findById(conversationId)
                .map(conv -> extractFromMessages(conv.getMessages()))
                .orElse(List.of());
    }

    public List<Map<String, Object>> extractFromUserConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> allExtracted = new ArrayList<>();

        for (Conversation conv : conversations) {
            allExtracted.addAll(extractFromMessages(conv.getMessages()));
        }
        return allExtracted;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractFromMessages(String messages) {
        if (messages == null || messages.isEmpty()) {
            return List.of();
        }

        String prompt = "From the following conversation, extract the key knowledge points mentioned. Return as a JSON array of objects with fields: title, description, category.\n\nConversation:\n" + messages;
        String result = aiAgentService.chat(prompt, "You are a knowledge extraction specialist. Analyze conversations and extract important knowledge concepts.");

        // In production, parse JSON from result
        List<Map<String, Object>> extracted = new ArrayList<>();
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("title", "Extracted Knowledge");
        item.put("description", result);
        item.put("category", "conversation");
        extracted.add(item);

        return extracted;
    }
}
