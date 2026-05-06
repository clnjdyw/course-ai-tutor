package com.example.coursetutor.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {
    private Long userId;
    private String message;

    // 多模态支持：Base64 编码的图片
    private String imageBase64;

    // 可选：图片 URL（如果图片已上传到云存储）
    private String imageUrl;

    // 图片 MIME 类型（如 image/png, image/jpeg）
    private String imageMimeType;
}
