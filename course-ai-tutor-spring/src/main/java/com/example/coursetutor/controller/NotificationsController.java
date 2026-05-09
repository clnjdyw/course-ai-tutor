package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.PendingNotification;
import com.example.coursetutor.repository.PendingNotificationRepository;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationsController {

    private final PendingNotificationRepository notificationRepository;

    @GetMapping("/pending")
    public ApiResponse<List<PendingNotification>> getPending() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(notificationRepository.findByUserIdAndStatus(userId, "pending_browser"));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<?> markAsRead(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return notificationRepository.findById(id)
                .filter(n -> n.getUserId().equals(userId))
                .map(n -> {
                    n.setStatus("read");
                    notificationRepository.save(n);
                    return ApiResponse.ok("已标记为已读");
                })
                .orElse(ApiResponse.error("通知不存在"));
    }

    @PostMapping("/request-browser-permission")
    public ApiResponse<?> requestBrowserPermission() {
        return ApiResponse.ok("浏览器通知权限请求已发送");
    }
}
