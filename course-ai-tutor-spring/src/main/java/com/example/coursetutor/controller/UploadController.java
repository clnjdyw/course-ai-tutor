package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10MB

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif",
            ".pdf", ".docx", ".doc", ".txt", ".md", ".csv",
            ".mp3", ".wav"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/markdown",
            "text/csv",
            "audio/mpeg", "audio/wav"
    );

    @Value("${app.upload.dir:./data/uploads}")
    private String uploadDir;

    @PostMapping
    public ApiResponse<?> uploadFile(@RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtil.requireUserId();

        if (file.isEmpty()) {
            return ApiResponse.error("文件不能为空");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ApiResponse.error("文件大小超过限制（最大 10MB）");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        } else {
            return ApiResponse.error("文件必须包含有效的扩展名");
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ApiResponse.error("不支持的文件类型，允许的类型：" + String.join(", ", ALLOWED_EXTENSIONS));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            return ApiResponse.error("文件的 MIME 类型不被允许，请上传合法的文件类型");
        }

        String filename = UUID.randomUUID().toString() + extension;
        Path uploadPath = Paths.get(uploadDir);

        try {
            Files.createDirectories(uploadPath);
            Path targetPath = uploadPath.resolve(filename);
            file.transferTo(targetPath);

            String url = "/uploads/" + filename;
            return ApiResponse.ok(Map.of(
                    "url", url,
                    "filename", filename,
                    "size", file.getSize()
            ));
        } catch (IOException e) {
            log.error("File upload failed", e);
            return ApiResponse.error("文件上传失败: " + e.getMessage());
        }
    }
}
