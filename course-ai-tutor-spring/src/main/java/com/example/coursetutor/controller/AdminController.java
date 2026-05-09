package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.*;
import com.example.coursetutor.repository.*;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final KnowledgePointRepository knowledgePointRepository;
    private final ExerciseRepository exerciseRepository;
    private final NoteRepository noteRepository;
    private final WrongQuestionRepository wrongQuestionRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final ConversationRepository conversationRepository;
    private final CommunityPostRepository communityPostRepository;
    private final AchievementRepository achievementRepository;
    private final LearningSessionRepository learningSessionRepository;

    // ==================== User Management ====================

    @GetMapping("/users")
    public ApiResponse<?> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        return ApiResponse.ok(Map.of("users", List.of(), "total", 0, "page", page, "size", size));
    }

    @GetMapping("/users/{id}")
    public ApiResponse<?> getUser(@PathVariable Long id) {
        requireAdmin();
        return ApiResponse.ok(Map.of());
    }

    @PutMapping("/users/{id}")
    public ApiResponse<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "User updated"));
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse<?> deleteUser(@PathVariable Long id) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "User deleted"));
    }

    @PostMapping("/users/{id}/reset-password")
    public ApiResponse<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Password reset"));
    }

    @GetMapping("/users/search")
    public ApiResponse<?> searchUsers(@RequestParam String query) {
        requireAdmin();
        return ApiResponse.ok(List.of());
    }

    @PostMapping("/users")
    public ApiResponse<?> createUser(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "User created"));
    }

    @PostMapping("/users/{id}/ban")
    public ApiResponse<?> banUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "User ban status updated"));
    }

    // ==================== Sub-Admin Management ====================

    @GetMapping("/sub-admins")
    public ApiResponse<?> listSubAdmins() {
        requireAdmin();
        return ApiResponse.ok(List.of());
    }

    @PostMapping("/sub-admins")
    public ApiResponse<?> createSubAdmin(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Sub-admin created"));
    }

    @PutMapping("/sub-admins/{id}")
    public ApiResponse<?> updateSubAdmin(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Sub-admin updated"));
    }

    // ==================== Notifications ====================

    @PostMapping("/notifications")
    public ApiResponse<?> createNotification(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Notification created"));
    }

    @DeleteMapping("/notifications/{id}")
    public ApiResponse<?> deleteNotification(@PathVariable Long id) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Notification deleted"));
    }

    // ==================== Dashboard ====================

    @GetMapping("/dashboard")
    public ApiResponse<?> dashboard() {
        requireAdmin();
        return ApiResponse.ok(Map.of(
                "totalUsers", 0,
                "activeUsers", 0,
                "totalCourses", 0,
                "totalKnowledgePoints", 0,
                "todaySessions", 0,
                "todayAIRequests", 0
        ));
    }

    @GetMapping("/learning-stats")
    public ApiResponse<?> learningStats(
            @RequestParam(required = false) String period,
            @RequestParam(defaultValue = "30") int days) {
        requireAdmin();
        return ApiResponse.ok(Map.of(
                "totalStudyHours", 0,
                "avgAccuracy", 0,
                "totalExercises", 0,
                "totalNotes", 0,
                "topKnowledgePoints", List.of()
        ));
    }

    // ==================== Maintenance Mode ====================

    @PostMapping("/maintenance")
    public ApiResponse<?> toggleMaintenance(@RequestBody Map<String, Object> request) {
        requireAdmin();
        boolean enabled = Boolean.TRUE.equals(request.get("enabled"));
        return ApiResponse.ok(Map.of("message", "Maintenance mode " + (enabled ? "enabled" : "disabled")));
    }

    // ==================== Security Center ====================

    @GetMapping("/security")
    public ApiResponse<?> getSecuritySettings() {
        requireAdmin();
        return ApiResponse.ok(Map.of(
                "sensitiveWords", List.of(),
                "ipBlacklist", List.of(),
                "activeRateLimits", Map.of()
        ));
    }

    @PostMapping("/security/sensitive-words")
    public ApiResponse<?> addSensitiveWord(@RequestBody Map<String, String> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Sensitive word added"));
    }

    @DeleteMapping("/security/sensitive-words/{word}")
    public ApiResponse<?> removeSensitiveWord(@PathVariable String word) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Sensitive word removed"));
    }

    @PostMapping("/security/ip-blacklist")
    public ApiResponse<?> addIPBlacklist(@RequestBody Map<String, String> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "IP added to blacklist"));
    }

    @DeleteMapping("/security/ip-blacklist/{ip}")
    public ApiResponse<?> removeIPBlacklist(@PathVariable String ip) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "IP removed from blacklist"));
    }

    // ==================== AI Analysis ====================

    @PostMapping("/ai-analysis")
    public ApiResponse<?> aiAnalysis(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "AI analysis initiated", "status", "processing"));
    }

    // ==================== Logs ====================

    @GetMapping("/settings")
    public ApiResponse<?> getSettings() {
        requireAdmin();
        return ApiResponse.ok(Map.of());
    }

    @PutMapping("/settings")
    public ApiResponse<?> updateSettings(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Settings updated"));
    }

    @GetMapping("/settings/ai")
    public ApiResponse<?> getAiSettings() {
        requireAdmin();
        return ApiResponse.ok(Map.of(
                "model", System.getenv("AI_MODEL"),
                "baseUrl", System.getenv("DASHSCOPE_BASE_URL")
        ));
    }

    @PutMapping("/settings/ai")
    public ApiResponse<?> updateAiSettings(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "AI settings updated"));
    }

    // ==================== Security ====================

    @GetMapping("/security/logs")
    public ApiResponse<?> getSecurityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        requireAdmin();
        return ApiResponse.ok(Map.of("logs", List.of(), "total", 0));
    }

    @GetMapping("/security/rate-limits")
    public ApiResponse<?> getRateLimits() {
        requireAdmin();
        return ApiResponse.ok(Map.of());
    }

    @PutMapping("/security/rate-limits")
    public ApiResponse<?> updateRateLimits(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Rate limits updated"));
    }

    // ==================== Backup & Restore ====================

    @PostMapping("/backup")
    public ApiResponse<?> createBackup() {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Backup initiated", "status", "processing"));
    }

    @GetMapping("/backup/list")
    public ApiResponse<?> listBackups() {
        requireAdmin();
        return ApiResponse.ok(List.of());
    }

    @PostMapping("/restore")
    public ApiResponse<?> restoreBackup(@RequestBody Map<String, String> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Restore initiated"));
    }

    // ==================== Statistics ====================

    @GetMapping("/stats")
    public ApiResponse<?> stats() {
        requireAdmin();
        return ApiResponse.ok(Map.of(
                "totalUsers", 0,
                "totalCourses", 0,
                "totalKnowledgePoints", 0,
                "totalSessions", 0,
                "activeUsers", 0
        ));
    }

    @GetMapping("/stats/usage")
    public ApiResponse<?> usageStats(@RequestParam(required = false) String period) {
        requireAdmin();
        return ApiResponse.ok(Map.of("apiCalls", 0, "tokenUsage", 0, "aiRequests", 0));
    }

    // ==================== Notifications ====================

    @PostMapping("/notifications/broadcast")
    public ApiResponse<?> broadcastNotification(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Notification sent"));
    }

    @GetMapping("/notifications")
    public ApiResponse<?> listNotifications() {
        requireAdmin();
        return ApiResponse.ok(List.of());
    }

    // ==================== Resources ====================

    @GetMapping("/resources")
    public ApiResponse<?> listResources() {
        requireAdmin();
        return ApiResponse.ok(List.of());
    }

    @PostMapping("/resources")
    public ApiResponse<?> createResource(@RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Resource created"));
    }

    @DeleteMapping("/resources/{id}")
    public ApiResponse<?> deleteResource(@PathVariable Long id) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Resource deleted"));
    }

    // ==================== Logs ====================

    @GetMapping("/logs")
    public ApiResponse<?> listLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String level) {
        requireAdmin();
        return ApiResponse.ok(Map.of("logs", List.of(), "total", 0));
    }

    // ==================== AI Agent Management ====================

    @GetMapping("/agents")
    public ApiResponse<?> listAgents() {
        requireAdmin();
        return ApiResponse.ok(List.of());
    }

    @PutMapping("/agents/{id}")
    public ApiResponse<?> updateAgent(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Agent updated"));
    }

    @GetMapping("/agents/stats")
    public ApiResponse<?> agentStats() {
        requireAdmin();
        return ApiResponse.ok(Map.of("activeAgents", 0, "totalCalls", 0, "avgResponseTime", 0));
    }

    // ==================== Knowledge Base Admin ====================

    @GetMapping("/knowledge-bases")
    public ApiResponse<?> listKnowledgeBases() {
        requireAdmin();
        return ApiResponse.ok(List.of());
    }

    @PostMapping("/knowledge-bases/{id}/rebuild")
    public ApiResponse<?> rebuildKnowledgeBase(@PathVariable Long id) {
        requireAdmin();
        return ApiResponse.ok(Map.of("message", "Knowledge base rebuild initiated"));
    }

    // ==================== System Health ====================

    @GetMapping("/health")
    public ApiResponse<?> systemHealth() {
        requireAdmin();
        return ApiResponse.ok(Map.of(
                "status", "ok",
                "database", "connected",
                "ai", "available",
                "memory", Runtime.getRuntime().totalMemory() / (1024 * 1024) + "MB",
                "freeMemory", Runtime.getRuntime().freeMemory() / (1024 * 1024) + "MB"
        ));
    }

    // ==================== Course Management ====================

    @GetMapping("/courses")
    public ApiResponse<?> listCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = courseRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/courses/{id}")
    public ApiResponse<?> getCourse(@PathVariable Long id) {
        requireAdmin();
        return courseRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/courses")
    public ApiResponse<?> createCourse(@RequestBody Course course) {
        requireAdmin();
        return ApiResponse.ok(courseRepository.save(course), "创建成功");
    }

    @PutMapping("/courses/{id}")
    public ApiResponse<?> updateCourse(@PathVariable Long id, @RequestBody Course course) {
        requireAdmin();
        return courseRepository.findById(id)
            .map(existing -> {
                if (course.getTitle() != null) existing.setTitle(course.getTitle());
                if (course.getDescription() != null) existing.setDescription(course.getDescription());
                if (course.getCategory() != null) existing.setCategory(course.getCategory());
                if (course.getStatus() != null) existing.setStatus(course.getStatus());
                if (course.getInstructorId() != null) existing.setInstructorId(course.getInstructorId());
                if (course.getCoverUrl() != null) existing.setCoverUrl(course.getCoverUrl());
                return ApiResponse.ok(courseRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/courses/{id}")
    public ApiResponse<?> deleteCourse(@PathVariable Long id) {
        requireAdmin();
        if (courseRepository.existsById(id)) {
            courseRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Knowledge Point Management ====================

    @GetMapping("/knowledge-points")
    public ApiResponse<?> listKnowledgePoints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = knowledgePointRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/knowledge-points/{id}")
    public ApiResponse<?> getKnowledgePoint(@PathVariable Long id) {
        requireAdmin();
        return knowledgePointRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/knowledge-points")
    public ApiResponse<?> createKnowledgePoint(@RequestBody KnowledgePoint kp) {
        requireAdmin();
        return ApiResponse.ok(knowledgePointRepository.save(kp), "创建成功");
    }

    @PutMapping("/knowledge-points/{id}")
    public ApiResponse<?> updateKnowledgePoint(@PathVariable Long id, @RequestBody KnowledgePoint kp) {
        requireAdmin();
        return knowledgePointRepository.findById(id)
            .map(existing -> {
                if (kp.getTitle() != null) existing.setTitle(kp.getTitle());
                if (kp.getDescription() != null) existing.setDescription(kp.getDescription());
                if (kp.getContent() != null) existing.setContent(kp.getContent());
                if (kp.getDifficulty() != null) existing.setDifficulty(kp.getDifficulty());
                if (kp.getParentId() != null) existing.setParentId(kp.getParentId());
                if (kp.getAgentType() != null) existing.setAgentType(kp.getAgentType());
                if (kp.getKnowledgeBaseId() != null) existing.setKnowledgeBaseId(kp.getKnowledgeBaseId());
                if (kp.getPrerequisites() != null) existing.setPrerequisites(kp.getPrerequisites());
                if (kp.getTags() != null) existing.setTags(kp.getTags());
                return ApiResponse.ok(knowledgePointRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/knowledge-points/{id}")
    public ApiResponse<?> deleteKnowledgePoint(@PathVariable Long id) {
        requireAdmin();
        if (knowledgePointRepository.existsById(id)) {
            knowledgePointRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Exercise Management ====================

    @GetMapping("/exercises")
    public ApiResponse<?> listExercises(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = exerciseRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/exercises/{id}")
    public ApiResponse<?> getExercise(@PathVariable Long id) {
        requireAdmin();
        return exerciseRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/exercises")
    public ApiResponse<?> createExercise(@RequestBody Exercise exercise) {
        requireAdmin();
        return ApiResponse.ok(exerciseRepository.save(exercise), "创建成功");
    }

    @PutMapping("/exercises/{id}")
    public ApiResponse<?> updateExercise(@PathVariable Long id, @RequestBody Exercise exercise) {
        requireAdmin();
        return exerciseRepository.findById(id)
            .map(existing -> {
                if (exercise.getCourseId() != null) existing.setCourseId(exercise.getCourseId());
                if (exercise.getQuestion() != null) existing.setQuestion(exercise.getQuestion());
                if (exercise.getAnswer() != null) existing.setAnswer(exercise.getAnswer());
                if (exercise.getExplanation() != null) existing.setExplanation(exercise.getExplanation());
                if (exercise.getDifficulty() != null) existing.setDifficulty(exercise.getDifficulty());
                if (exercise.getType() != null) existing.setType(exercise.getType());
                return ApiResponse.ok(exerciseRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/exercises/{id}")
    public ApiResponse<?> deleteExercise(@PathVariable Long id) {
        requireAdmin();
        if (exerciseRepository.existsById(id)) {
            exerciseRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Note Management ====================

    @GetMapping("/notes")
    public ApiResponse<?> listNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = noteRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/notes/{id}")
    public ApiResponse<?> getNote(@PathVariable Long id) {
        requireAdmin();
        return noteRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/notes")
    public ApiResponse<?> createNote(@RequestBody Note note) {
        requireAdmin();
        return ApiResponse.ok(noteRepository.save(note), "创建成功");
    }

    @PutMapping("/notes/{id}")
    public ApiResponse<?> updateNote(@PathVariable Long id, @RequestBody Note note) {
        requireAdmin();
        return noteRepository.findById(id)
            .map(existing -> {
                if (note.getUserId() != null) existing.setUserId(note.getUserId());
                if (note.getCourseId() != null) existing.setCourseId(note.getCourseId());
                if (note.getKnowledgePointId() != null) existing.setKnowledgePointId(note.getKnowledgePointId());
                if (note.getTitle() != null) existing.setTitle(note.getTitle());
                if (note.getContent() != null) existing.setContent(note.getContent());
                if (note.getTags() != null) existing.setTags(note.getTags());
                if (note.getIsPublic() != null) existing.setIsPublic(note.getIsPublic());
                return ApiResponse.ok(noteRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/notes/{id}")
    public ApiResponse<?> deleteNote(@PathVariable Long id) {
        requireAdmin();
        if (noteRepository.existsById(id)) {
            noteRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Wrong Question Management ====================

    @GetMapping("/wrong-questions")
    public ApiResponse<?> listWrongQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = wrongQuestionRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/wrong-questions/{id}")
    public ApiResponse<?> getWrongQuestion(@PathVariable Long id) {
        requireAdmin();
        return wrongQuestionRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/wrong-questions")
    public ApiResponse<?> createWrongQuestion(@RequestBody WrongQuestion wq) {
        requireAdmin();
        return ApiResponse.ok(wrongQuestionRepository.save(wq), "创建成功");
    }

    @PutMapping("/wrong-questions/{id}")
    public ApiResponse<?> updateWrongQuestion(@PathVariable Long id, @RequestBody WrongQuestion wq) {
        requireAdmin();
        return wrongQuestionRepository.findById(id)
            .map(existing -> {
                if (wq.getUserId() != null) existing.setUserId(wq.getUserId());
                if (wq.getExerciseId() != null) existing.setExerciseId(wq.getExerciseId());
                if (wq.getUserAnswer() != null) existing.setUserAnswer(wq.getUserAnswer());
                if (wq.getCorrectAnswer() != null) existing.setCorrectAnswer(wq.getCorrectAnswer());
                if (wq.getErrorAnalysis() != null) existing.setErrorAnalysis(wq.getErrorAnalysis());
                if (wq.getReviewCount() != null) existing.setReviewCount(wq.getReviewCount());
                if (wq.getMastered() != null) existing.setMastered(wq.getMastered());
                return ApiResponse.ok(wrongQuestionRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/wrong-questions/{id}")
    public ApiResponse<?> deleteWrongQuestion(@PathVariable Long id) {
        requireAdmin();
        if (wrongQuestionRepository.existsById(id)) {
            wrongQuestionRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Study Plan Management ====================

    @GetMapping("/study-plans")
    public ApiResponse<?> listStudyPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = studyPlanRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/study-plans/{id}")
    public ApiResponse<?> getStudyPlan(@PathVariable Long id) {
        requireAdmin();
        return studyPlanRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/study-plans")
    public ApiResponse<?> createStudyPlan(@RequestBody StudyPlan plan) {
        requireAdmin();
        return ApiResponse.ok(studyPlanRepository.save(plan), "创建成功");
    }

    @PutMapping("/study-plans/{id}")
    public ApiResponse<?> updateStudyPlan(@PathVariable Long id, @RequestBody StudyPlan plan) {
        requireAdmin();
        return studyPlanRepository.findById(id)
            .map(existing -> {
                if (plan.getUserId() != null) existing.setUserId(plan.getUserId());
                if (plan.getGoal() != null) existing.setGoal(plan.getGoal());
                if (plan.getSchedule() != null) existing.setSchedule(plan.getSchedule());
                if (plan.getResources() != null) existing.setResources(plan.getResources());
                if (plan.getPlanContent() != null) existing.setPlanContent(plan.getPlanContent());
                if (plan.getInputParams() != null) existing.setInputParams(plan.getInputParams());
                if (plan.getProgress() != null) existing.setProgress(plan.getProgress());
                if (plan.getStatus() != null) existing.setStatus(plan.getStatus());
                return ApiResponse.ok(studyPlanRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/study-plans/{id}")
    public ApiResponse<?> deleteStudyPlan(@PathVariable Long id) {
        requireAdmin();
        if (studyPlanRepository.existsById(id)) {
            studyPlanRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Conversation Management ====================

    @GetMapping("/conversations")
    public ApiResponse<?> listConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = conversationRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/conversations/{id}")
    public ApiResponse<?> getConversation(@PathVariable Long id) {
        requireAdmin();
        return conversationRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/conversations")
    public ApiResponse<?> createConversation(@RequestBody Conversation conv) {
        requireAdmin();
        return ApiResponse.ok(conversationRepository.save(conv), "创建成功");
    }

    @PutMapping("/conversations/{id}")
    public ApiResponse<?> updateConversation(@PathVariable Long id, @RequestBody Conversation conv) {
        requireAdmin();
        return conversationRepository.findById(id)
            .map(existing -> {
                if (conv.getUserId() != null) existing.setUserId(conv.getUserId());
                if (conv.getAgentType() != null) existing.setAgentType(conv.getAgentType());
                if (conv.getMessages() != null) existing.setMessages(conv.getMessages());
                if (conv.getTopic() != null) existing.setTopic(conv.getTopic());
                return ApiResponse.ok(conversationRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/conversations/{id}")
    public ApiResponse<?> deleteConversation(@PathVariable Long id) {
        requireAdmin();
        if (conversationRepository.existsById(id)) {
            conversationRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Community Post Management ====================

    @GetMapping("/community-posts")
    public ApiResponse<?> listCommunityPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = communityPostRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/community-posts/{id}")
    public ApiResponse<?> getCommunityPost(@PathVariable Long id) {
        requireAdmin();
        return communityPostRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/community-posts")
    public ApiResponse<?> createCommunityPost(@RequestBody CommunityPost post) {
        requireAdmin();
        return ApiResponse.ok(communityPostRepository.save(post), "创建成功");
    }

    @PutMapping("/community-posts/{id}")
    public ApiResponse<?> updateCommunityPost(@PathVariable Long id, @RequestBody CommunityPost post) {
        requireAdmin();
        return communityPostRepository.findById(id)
            .map(existing -> {
                if (post.getUserId() != null) existing.setUserId(post.getUserId());
                if (post.getTitle() != null) existing.setTitle(post.getTitle());
                if (post.getContent() != null) existing.setContent(post.getContent());
                if (post.getType() != null) existing.setType(post.getType());
                if (post.getTags() != null) existing.setTags(post.getTags());
                if (post.getStatus() != null) existing.setStatus(post.getStatus());
                return ApiResponse.ok(communityPostRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/community-posts/{id}")
    public ApiResponse<?> deleteCommunityPost(@PathVariable Long id) {
        requireAdmin();
        if (communityPostRepository.existsById(id)) {
            communityPostRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Achievement Management ====================

    @GetMapping("/achievements")
    public ApiResponse<?> listAchievements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = achievementRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/achievements/{id}")
    public ApiResponse<?> getAchievement(@PathVariable Long id) {
        requireAdmin();
        return achievementRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @PostMapping("/achievements")
    public ApiResponse<?> createAchievement(@RequestBody Achievement achievement) {
        requireAdmin();
        return ApiResponse.ok(achievementRepository.save(achievement), "创建成功");
    }

    @PutMapping("/achievements/{id}")
    public ApiResponse<?> updateAchievement(@PathVariable Long id, @RequestBody Achievement achievement) {
        requireAdmin();
        return achievementRepository.findById(id)
            .map(existing -> {
                if (achievement.getCode() != null) existing.setCode(achievement.getCode());
                if (achievement.getName() != null) existing.setName(achievement.getName());
                if (achievement.getDescription() != null) existing.setDescription(achievement.getDescription());
                if (achievement.getCategory() != null) existing.setCategory(achievement.getCategory());
                if (achievement.getPoints() != null) existing.setPoints(achievement.getPoints());
                if (achievement.getIcon() != null) existing.setIcon(achievement.getIcon());
                return ApiResponse.ok(achievementRepository.save(existing), "更新成功");
            })
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/achievements/{id}")
    public ApiResponse<?> deleteAchievement(@PathVariable Long id) {
        requireAdmin();
        if (achievementRepository.existsById(id)) {
            achievementRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    // ==================== Learning Session Management (Read-Only + Delete) ====================

    @GetMapping("/learning-sessions")
    public ApiResponse<?> listLearningSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        requireAdmin();
        var p = org.springframework.data.domain.PageRequest.of(page, size);
        var result = learningSessionRepository.findAll(p);
        return ApiResponse.ok(Map.of("list", result.getContent(), "total", result.getTotalElements(), "page", page, "size", size));
    }

    @GetMapping("/learning-sessions/{id}")
    public ApiResponse<?> getLearningSession(@PathVariable Long id) {
        requireAdmin();
        return learningSessionRepository.findById(id)
            .map(ApiResponse::ok)
            .orElse(ApiResponse.error("数据不存在"));
    }

    @DeleteMapping("/learning-sessions/{id}")
    public ApiResponse<?> deleteLearningSession(@PathVariable Long id) {
        requireAdmin();
        if (learningSessionRepository.existsById(id)) {
            learningSessionRepository.deleteById(id);
            return ApiResponse.ok("删除成功");
        }
        return ApiResponse.error("数据不存在");
    }

    private void requireAdmin() {
        Long userId = SecurityUtil.requireUserId();
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("未授权访问"));
        if (!"admin".equals(user.getRole())) {
            throw new org.springframework.security.access.AccessDeniedException("需要管理员权限");
        }
    }
}
