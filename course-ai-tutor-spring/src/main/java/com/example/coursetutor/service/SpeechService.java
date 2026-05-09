package com.example.coursetutor.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

/**
 * Speech-to-text service using DashScope paraformer model
 */
@Service
@RequiredArgsConstructor
public class SpeechService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ai.dashscope.api-key:}")
    private String apiKey;

    @Value("${app.ai.dashscope.base-url:https://dashscope.aliyuncs.com}")
    private String baseUrl;

    @Value("${app.ai.speech-model:paraformer-realtime-v2}")
    private String speechModel;

    public Map<String, Object> transcribe(MultipartFile file) throws IOException {
        String base64Audio = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType();

        return callSpeechModel(base64Audio, mimeType);
    }

    public Map<String, Object> transcribeUrl(String audioUrl) {
        return callSpeechModelWithUrl(audioUrl);
    }

    public Map<String, Object> transcribeAndTranslate(MultipartFile file, String targetLang) throws IOException {
        String base64Audio = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType();

        // First transcribe
        Map<String, Object> transcription = callSpeechModel(base64Audio, mimeType);
        String originalText = (String) transcription.get("text");

        // Then translate using AI
        return Map.of(
                "originalText", originalText,
                "targetLanguage", targetLang,
                "translatedText", "Translation of: " + originalText // Would use AiAgentService in production
        );
    }

    private Map<String, Object> callSpeechModel(String base64Audio, String mimeType) {
        String url = baseUrl + "/compatible-mode/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String dataUri = "data:" + mimeType + ";base64," + base64Audio;

        Map<String, Object> requestBody = Map.of(
                "model", speechModel,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "audio", "audio", Map.of("url", dataUri)),
                                Map.of("type", "text", "text", "Please transcribe this audio to text.")
                        )
                ))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        return parseResponse(response.getBody());
    }

    private Map<String, Object> callSpeechModelWithUrl(String audioUrl) {
        String url = baseUrl + "/compatible-mode/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = Map.of(
                "model", speechModel,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "audio", "audio", Map.of("url", audioUrl)),
                                Map.of("type", "text", "text", "Please transcribe this audio to text.")
                        )
                ))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        return parseResponse(response.getBody());
    }

    private Map<String, Object> parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String text = root.path("choices").get(0).path("message").path("content").asText();
            return Map.of(
                    "text", text,
                    "duration", 0.0
            );
        } catch (Exception e) {
            return Map.of(
                    "text", "",
                    "error", e.getMessage()
            );
        }
    }
}
