package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.Note;
import com.example.coursetutor.entity.NoteComment;
import com.example.coursetutor.repository.NoteCommentRepository;
import com.example.coursetutor.repository.NoteRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NoteRepository noteRepository;
    private final NoteCommentRepository noteCommentRepository;

    @GetMapping("/public")
    public ApiResponse<?> getPublicNotes(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        List<Note> notes;
        if (search != null && !search.isBlank()) {
            notes = noteRepository.findByIsPublicTrueAndTitleContainingIgnoreCase(search);
        } else {
            notes = noteRepository.findByIsPublicTrue();
        }
        long total = notes.size();
        if (notes.size() > limit) {
            notes = notes.subList(offset, Math.min(offset + limit, notes.size()));
        }
        return ApiResponse.ok(Map.of("notes", notes, "total", total));
    }

    @GetMapping
    public ApiResponse<List<Note>> getUserNotes() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(noteRepository.findByUserId(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getNote(@PathVariable Long id) {
        noteRepository.incrementViews(id);
        return noteRepository.findById(id)
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("笔记不存在"));
    }

    @PostMapping
    public ApiResponse<?> createNote(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        Note note = Note.builder()
                .userId(userId)
                .title((String) body.get("title"))
                .content((String) body.get("content"))
                .tags((String) body.get("tags"))
                .courseId(getLong(body, "courseId"))
                .knowledgePointId(getLong(body, "knowledgePointId"))
                .isPublic(Boolean.TRUE.equals(body.get("isPublic")))
                .build();

        Note saved = noteRepository.save(note);
        return ApiResponse.ok(Map.of("id", saved.getId()), "笔记创建成功");
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateNote(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        return noteRepository.findById(id).map(note -> {
            if (!note.getUserId().equals(userId)) {
                return ApiResponse.error("无权限修改");
            }
            if (body.containsKey("title")) note.setTitle((String) body.get("title"));
            if (body.containsKey("content")) note.setContent((String) body.get("content"));
            if (body.containsKey("tags")) note.setTags((String) body.get("tags"));
            if (body.containsKey("isPublic")) note.setIsPublic((Boolean) body.get("isPublic"));
            noteRepository.save(note);
            return ApiResponse.ok("笔记更新成功");
        }).orElse(ApiResponse.error("笔记不存在"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteNote(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return noteRepository.findById(id)
                .filter(note -> note.getUserId().equals(userId))
                .map(note -> {
                    noteCommentRepository.deleteByNoteId(id);
                    noteRepository.delete(note);
                    return ApiResponse.ok("笔记已删除");
                })
                .orElse(ApiResponse.error("笔记不存在或无权限"));
    }

    @GetMapping("/{id}/comments")
    public ApiResponse<List<NoteComment>> getComments(@PathVariable Long id) {
        return ApiResponse.ok(noteCommentRepository.findByNoteId(id));
    }

    @PostMapping("/{id}/comments")
    public ApiResponse<?> addComment(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        NoteComment comment = NoteComment.builder()
                .noteId(id)
                .userId(userId)
                .content((String) body.get("content"))
                .build();

        NoteComment saved = noteCommentRepository.save(comment);
        return ApiResponse.ok(Map.of("id", saved.getId()), "评论发表成功");
    }

    @PostMapping("/{id}/like")
    public ApiResponse<?> likeNote(@PathVariable Long id) {
        noteRepository.incrementLikes(id);
        return ApiResponse.ok("点赞成功");
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).longValue() : null;
    }
}
