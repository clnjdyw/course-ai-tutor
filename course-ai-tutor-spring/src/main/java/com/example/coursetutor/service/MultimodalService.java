package com.example.coursetutor.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 多模态 AI 服务 - 支持图片识别
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MultimodalService {

    private final ChatClient.Builder chatClientBuilder;

    @Value("${app.multimodal.enabled:true}")
    private boolean multimodalEnabled;

    @Value("${app.multimodal.model:Pro/Qwen/Qwen2-VL-72B-Instruct}")
    private String multimodalModel;

    @Value("${app.multimodal.max-tokens:2048}")
    private int maxTokens;

    @Value("${app.multimodal.temperature:0.7}")
    private double temperature;

    /**
     * 处理包含图片的聊天请求
     */
    public String chatWithImage(String textMessage, String imageBase64, String imageMimeType) {
        if (!multimodalEnabled) {
            log.warn("多模态功能未启用，降级为纯文本处理");
            return chatTextOnly(textMessage);
        }

        try {
            log.info("处理多模态请求，文本长度: {}, 图片: {}",
                    textMessage != null ? textMessage.length() : 0,
                    imageBase64 != null ? "已提供" : "无");

            // 构建包含图片数据URI的提示词
            String prompt = (textMessage != null ? textMessage : "请分析这张图片") +
                    "\n\n[data:image/" + (imageMimeType != null ? imageMimeType : "png") + ";base64," + imageBase64 + "]";

            // 调用多模态模型
            ChatClient chatClient = chatClientBuilder.build();
            ChatResponse response = chatClient.prompt(new Prompt(prompt))
                    .call()
                    .chatResponse();

            if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
                log.warn("多模态模型返回空响应，降级为纯文本");
                return chatTextOnly(textMessage != null ? textMessage : "请分析这张图片");
            }

            String result = response.getResult() != null && response.getResult().getOutput() != null
                    ? response.getResult().getOutput().getText() : null;
            log.info("多模态响应完成，长度: {}", result != null ? result.length() : 0);

            return result;

        } catch (Exception e) {
            log.error("多模态处理失败，降级为纯文本", e);
            return chatTextOnly(textMessage + "\n\n（注：图片处理失败，已降级为纯文本模式）");
        }
    }

    /**
     * 纯文本聊天（降级方案）
     */
    private String chatTextOnly(String message) {
        try {
            ChatClient chatClient = chatClientBuilder.build();
            return chatClient.prompt()
                    .user(message)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("纯文本聊天失败", e);
            return "抱歉，AI 服务暂时不可用，请稍后再试。";
        }
    }

    /**
     * 检查是否支持多模态
     */
    public boolean isMultimodalEnabled() {
        return multimodalEnabled;
    }

    /**
     * 获取当前多模态模型名称
     */
    public String getMultimodalModel() {
        return multimodalModel;
    }
}
