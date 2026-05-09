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
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.*;

/**
 * OCR service using DashScope vision model (qwen-vl-max-latest)
 */
@Service
@RequiredArgsConstructor
public class OcrService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ai.dashscope.api-key:}")
    private String apiKey;

    @Value("${app.ai.dashscope.base-url:https://dashscope.aliyuncs.com}")
    private String baseUrl;

    @Value("${app.ai.ocr-model:qwen-vl-max-latest}")
    private String ocrModel;

    @Value("${app.allowed-image-domains:dashscope.aliyuncs.com,oss-cn-hangzhou.aliyuncs.com,oss-cn-shanghai.aliyuncs.com,oss-cn-beijing.aliyuncs.com}")
    private List<String> allowedImageDomains;

    public Map<String, Object> recognizeImage(MultipartFile file) throws IOException {
        // Convert image to base64
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType();

        return callVisionModel(base64Image, mimeType);
    }

    public Map<String, Object> recognizeImageUrl(String imageUrl) {
        validateImageUrl(imageUrl);
        return callVisionModelWithUrl(imageUrl);
    }

    /**
     * Validate image URL to prevent SSRF attacks.
     * Checks: (1) only http/https protocols, (2) hostname is in the allowlist,
     * (3) resolved IP is not in private/internal ranges.
     */
    private void validateImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("Image URL must not be empty");
        }

        URI uri;
        try {
            uri = new URI(imageUrl);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid image URL: " + e.getMessage());
        }

        // Protocol check: only allow http and https
        String scheme = uri.getScheme();
        if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException(
                    "Invalid image URL protocol: only http and https are allowed. Got: " + scheme);
        }

        String host = uri.getHost();
        if (host == null) {
            throw new IllegalArgumentException("Invalid image URL: missing host");
        }

        String normalizedHost = host.toLowerCase(Locale.ROOT);

        // Reject localhost explicitly
        if ("localhost".equals(normalizedHost)) {
            throw new IllegalArgumentException(
                    "Image URL is not from an allowed domain: localhost is not permitted");
        }

        // Allowlist check: the hostname must end with one of the allowed domains
        boolean isAllowed = allowedImageDomains.stream()
                .map(String::toLowerCase)
                .anyMatch(allowed -> normalizedHost.equals(allowed) || normalizedHost.endsWith("." + allowed));
        if (!isAllowed) {
            throw new IllegalArgumentException(
                    "Image URL is not from an allowed domain. Allowed domains: " + allowedImageDomains);
        }

        // Resolve the IP and verify it is not a private/internal address
        // (defends against DNS rebinding when an allowed domain name resolves to an internal IP)
        try {
            InetAddress address = InetAddress.getByName(host);
            if (isPrivateOrInternal(address)) {
                throw new IllegalArgumentException(
                        "Image URL resolves to an internal or private IP address: " + address.getHostAddress());
            }
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Unable to resolve image URL host: " + host);
        }
    }

    /**
     * Check if an IP address belongs to a private, loopback, link-local,
     * or site-local range (e.g. 127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x).
     */
    private boolean isPrivateOrInternal(InetAddress address) {
        return address.isLoopbackAddress()
                || address.isSiteLocalAddress()
                || address.isAnyLocalAddress()
                || address.isLinkLocalAddress();
    }

    public Map<String, Object> recognizeHandwriting(MultipartFile file) throws IOException {
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType();

        return callVisionModelWithPrompt(
                base64Image, mimeType,
                "Please recognize and extract the handwritten text from this image. Return only the text content."
        );
    }

    private Map<String, Object> callVisionModel(String base64Image, String mimeType) {
        return callVisionModelWithPrompt(
                base64Image, mimeType,
                "Please extract all text from this image. Return the text content."
        );
    }

    private Map<String, Object> callVisionModelWithPrompt(String base64Image, String mimeType, String prompt) {
        String url = baseUrl + "/compatible-mode/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String dataUri = "data:" + mimeType + ";base64," + base64Image;

        Map<String, Object> requestBody = Map.of(
                "model", ocrModel,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "image_url", "image_url", Map.of("url", dataUri)),
                                Map.of("type", "text", "text", prompt)
                        )
                ))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        return parseResponse(response.getBody());
    }

    private Map<String, Object> callVisionModelWithUrl(String imageUrl) {
        String url = baseUrl + "/compatible-mode/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = Map.of(
                "model", ocrModel,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "image_url", "image_url", Map.of("url", imageUrl)),
                                Map.of("type", "text", "text", "Please extract all text from this image.")
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
                    "confidence", 0.95,
                    "raw", responseBody
            );
        } catch (Exception e) {
            return Map.of(
                    "text", "",
                    "error", e.getMessage()
            );
        }
    }
}
