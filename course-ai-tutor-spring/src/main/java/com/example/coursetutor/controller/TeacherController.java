package com.example.coursetutor.controller;

import com.example.coursetutor.entity.Document;
import com.example.coursetutor.entity.KnowledgeBase;
import com.example.coursetutor.repository.DocumentRepository;
import com.example.coursetutor.repository.KnowledgeBaseRepository;
import com.example.coursetutor.service.RagService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.DocumentReader;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 教师端控制器 - 知识库管理
 */
@Slf4j
@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final DocumentRepository documentRepository;
    private final RagService ragService;

    /**
     * 获取知识库列表
     */
    @GetMapping("/knowledge-bases")
    public ResponseEntity<Map<String, Object>> getKnowledgeBases(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = (Long) authentication.getPrincipal();
            List<KnowledgeBase> knowledgeBases = knowledgeBaseRepository.findByCreatedBy(userId);

            response.put("success", true);
            response.put("data", knowledgeBases);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取知识库列表失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 创建知识库
     */
    @PostMapping("/knowledge-bases")
    public ResponseEntity<Map<String, Object>> createKnowledgeBase(
            @RequestBody CreateKnowledgeBaseRequest request,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = (Long) authentication.getPrincipal();

            KnowledgeBase kb = KnowledgeBase.builder()
                    .name(request.getName())
                    .description(request.getDescription())
                    .category(request.getCategory())
                    .agentId(request.getAgentId())
                    .courseId(request.getCourseId())
                    .createdBy(userId)
                    .build();

            knowledgeBaseRepository.save(kb);

            response.put("success", true);
            response.put("message", "知识库创建成功");
            response.put("data", kb);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("创建知识库失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 上传文档并向量化
     */
    @PostMapping("/documents/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("knowledgeBaseId") Long knowledgeBaseId,
            @RequestParam(value = "agentId", required = false) String agentId,
            @RequestParam(value = "courseId", required = false) String courseId,
            @RequestParam(value = "title", required = false) String title,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            Long userId = (Long) authentication.getPrincipal();
            String originalFilename = file.getOriginalFilename();
            String fileType = getFileExtension(originalFilename);

            // 验证文件类型
            if (!isValidFileType(fileType)) {
                response.put("success", false);
                response.put("message", "不支持的文件类型，仅支持 PDF、DOCX、DOC、TXT");
                return ResponseEntity.badRequest().body(response);
            }

            log.info("📄 开始处理文档: {}, 类型: {}", originalFilename, fileType);

            // 创建文档记录
            Document doc = Document.builder()
                    .knowledgeBaseId(knowledgeBaseId)
                    .title(title != null ? title : originalFilename)
                    .fileType(fileType)
                    .status("processing")
                    .agentId(agentId)
                    .courseId(courseId)
                    .uploadedBy(userId)
                    .build();

            documentRepository.save(doc);

            // 解析文档内容
            String content = parseDocument(file, fileType);
            doc.setContent(content);
            doc.setWordCount(content.length());

            // 分块
            TokenTextSplitter splitter = new TokenTextSplitter(500, 350, 50, 100, true);
            List<org.springframework.ai.document.Document> springAiDocs = splitter.split(
                    List.of(new org.springframework.ai.document.Document(content))
            );

            log.info("文档分块完成，共 {} 个块", springAiDocs.size());

            // 存入向量库
            ragService.addDocuments(springAiDocs);

            // 更新文档状态
            doc.setStatus("processed");
            doc.setChunkCount(springAiDocs.size());
            documentRepository.save(doc);

            log.info("✅ 文档处理完成: {}", originalFilename);

            response.put("success", true);
            response.put("message", "文档上传成功");
            response.put("data", Map.of(
                    "documentId", doc.getId(),
                    "chunks", springAiDocs.size(),
                    "wordCount", content.length()
            ));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("文档上传失败", e);
            response.put("success", false);
            response.put("message", "文档上传失败，请稍后重试");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 解析文档内容
     */
    private String parseDocument(MultipartFile file, String fileType) throws IOException {
        byte[] fileBytes = file.getBytes();
        ByteArrayResource resource = new ByteArrayResource(fileBytes);

        DocumentReader reader;

        if ("pdf".equalsIgnoreCase(fileType)) {
            reader = new PagePdfDocumentReader(resource);
        } else {
            // DOCX, DOC, TXT 使用 Tika
            reader = new TikaDocumentReader(resource);
        }

        List<org.springframework.ai.document.Document> docs = reader.get();
        return docs.stream()
                .map(d -> d.getText())
                .collect(Collectors.joining("\n"));
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * 验证文件类型
     */
    private boolean isValidFileType(String fileType) {
        return List.of("pdf", "docx", "doc", "txt").contains(fileType.toLowerCase());
    }

    /**
     * 获取文档列表
     */
    @GetMapping("/documents")
    public ResponseEntity<Map<String, Object>> getDocuments(
            @RequestParam(required = false) Long knowledgeBaseId,
            Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = (Long) authentication.getPrincipal();

            List<Document> documents;
            if (knowledgeBaseId != null) {
                documents = documentRepository.findByKnowledgeBaseId(knowledgeBaseId);
            } else {
                documents = documentRepository.findByUploadedBy(userId);
            }

            response.put("success", true);
            response.put("data", documents);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取文档列表失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 删除文档
     */
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Map<String, Object>> deleteDocument(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            documentRepository.deleteById(id);
            // TODO: 同时删除向量库中的数据

            response.put("success", true);
            response.put("message", "文档删除成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("删除文档失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    // ==================== 学生管理 ====================

    @GetMapping("/students")
    public ResponseEntity<Map<String, Object>> getStudents(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        try {
            response.put("success", true);
            response.put("data", List.of());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取学生列表失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/students/{id}")
    public ResponseEntity<Map<String, Object>> getStudent(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            response.put("success", true);
            response.put("data", Map.of());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取学生详情失败", e);
            response.put("success", false);
            response.put("message", "服务器内部错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    @Data
    public static class CreateKnowledgeBaseRequest {
        private String name;
        private String description;
        private String category;
        private String agentId;
        private String courseId;
    }
}
