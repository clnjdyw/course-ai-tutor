package com.example.coursetutor.controller;

import com.example.coursetutor.entity.Achievement;
import com.example.coursetutor.entity.UserAchievement;
import com.example.coursetutor.repository.AchievementRepository;
import com.example.coursetutor.repository.UserAchievementRepository;
import com.example.coursetutor.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 成就系统控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/achievements")
public class AchievementController {

    @Autowired
    private AchievementRepository achievementRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private Long extractUserId(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                return jwtUtil.getUserIdFromToken(token);
            }
        }
        return null;
    }

    /**
     * 获取用户成就列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserAchievements(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            List<Achievement> allAchievements = achievementRepository.findAllByOrderByCategoryAscPointsDesc();
            List<UserAchievement> unlockedAchievements = userAchievementRepository.findByUserIdOrderByUnlockedAtDesc(userId);
            Set<Long> unlockedIds = unlockedAchievements.stream()
                .map(UserAchievement::getAchievementId)
                .collect(Collectors.toSet());

            List<Map<String, Object>> achievements = allAchievements.stream().map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("code", a.getCode());
                map.put("name", a.getName());
                map.put("description", a.getDescription());
                map.put("category", a.getCategory());
                map.put("points", a.getPoints());
                map.put("icon", a.getIcon());
                map.put("unlocked", unlockedIds.contains(a.getId()));

                Optional<UserAchievement> unlocked = unlockedAchievements.stream()
                    .filter(ua -> ua.getAchievementId().equals(a.getId()))
                    .findFirst();
                unlocked.ifPresent(ua -> map.put("unlockedAt", ua.getUnlockedAt()));

                return map;
            }).collect(Collectors.toList());

            List<Map<String, Object>> recentUnlocks = unlockedAchievements.stream()
                .limit(5)
                .map(ua -> {
                    Achievement a = achievementRepository.findById(ua.getAchievementId()).orElse(null);
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", ua.getId());
                    map.put("name", a != null ? a.getName() : "未知成就");
                    map.put("icon", a != null ? a.getIcon() : "❓");
                    map.put("time", ua.getUnlockedAt());
                    map.put("points", a != null ? a.getPoints() : 0);
                    return map;
                })
                .collect(Collectors.toList());

            int totalPoints = unlockedAchievements.stream()
                .mapToInt(ua -> achievementRepository.findById(ua.getAchievementId())
                    .map(Achievement::getPoints).orElse(0))
                .sum();

            response.put("success", true);
            response.put("data", Map.of(
                "achievements", achievements,
                "recentUnlocks", recentUnlocks,
                "totalPoints", totalPoints,
                "unlockedCount", unlockedAchievements.size(),
                "totalCount", allAchievements.size()
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("获取成就失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 解锁成就
     */
    @PostMapping("/unlock/{code}")
    public ResponseEntity<Map<String, Object>> unlockAchievement(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String code) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = extractUserId(authHeader);
            if (userId == null) {
                response.put("success", false);
                response.put("message", "未认证");
                return ResponseEntity.status(401).body(response);
            }

            Optional<Achievement> achievementOpt = achievementRepository.findByCode(code);
            if (achievementOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "成就不存在");
                return ResponseEntity.badRequest().body(response);
            }

            Achievement achievement = achievementOpt.get();

            if (userAchievementRepository.existsByUserIdAndAchievementId(userId, achievement.getId())) {
                response.put("success", false);
                response.put("message", "成就已解锁");
                return ResponseEntity.ok(response);
            }

            UserAchievement userAchievement = UserAchievement.builder()
                .userId(userId)
                .achievementId(achievement.getId())
                .build();

            userAchievementRepository.save(userAchievement);

            response.put("success", true);
            response.put("message", "成就解锁: " + achievement.getName());
            response.put("data", Map.of(
                "code", achievement.getCode(),
                "name", achievement.getName(),
                "points", achievement.getPoints()
            ));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("解锁成就失败", e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}
