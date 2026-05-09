package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.LearningReminder;
import com.example.coursetutor.repository.LearningReminderRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class RemindersController {

    private final LearningReminderRepository reminderRepository;

    @GetMapping
    public ApiResponse<List<LearningReminder>> getReminders() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(reminderRepository.findByUserIdAndStatus(userId, "pending"));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> getReminder(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return reminderRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("提醒不存在"));
    }

    @PostMapping
    public ApiResponse<?> createReminder(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        LearningReminder reminder = LearningReminder.builder()
                .userId(userId)
                .title((String) body.get("title"))
                .content((String) body.get("content"))
                .reminderTime(LocalDateTime.parse((String) body.get("reminderTime")))
                .reminderType((String) body.getOrDefault("reminderType", "study"))
                .build();

        LearningReminder saved = reminderRepository.save(reminder);
        return ApiResponse.ok(Map.of("id", saved.getId()), "提醒创建成功");
    }

    @PutMapping("/{id}")
    public ApiResponse<?> updateReminder(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        return reminderRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .map(r -> {
                    if (body.containsKey("title")) r.setTitle((String) body.get("title"));
                    if (body.containsKey("content")) r.setContent((String) body.get("content"));
                    if (body.containsKey("reminderTime")) r.setReminderTime(LocalDateTime.parse((String) body.get("reminderTime")));
                    if (body.containsKey("reminderType")) r.setReminderType((String) body.get("reminderType"));
                    if (body.containsKey("status")) r.setStatus((String) body.get("status"));
                    reminderRepository.save(r);
                    return ApiResponse.ok("提醒更新成功");
                })
                .orElse(ApiResponse.error("提醒不存在"));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteReminder(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return reminderRepository.findById(id)
                .filter(r -> r.getUserId().equals(userId))
                .map(r -> {
                    reminderRepository.delete(r);
                    return ApiResponse.ok("提醒已删除");
                })
                .orElse(ApiResponse.error("提醒不存在或无权限"));
    }
}
