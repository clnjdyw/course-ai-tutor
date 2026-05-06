package com.example.coursetutor.controller;

import com.example.coursetutor.entity.User;
import com.example.coursetutor.repository.UserRepository;
import com.example.coursetutor.util.JwtUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 认证控制器 - 处理用户登录和注册
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        log.info("收到登录请求：username={}", request.getUsername());

        Map<String, Object> response = new HashMap<>();

        try {
            Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "用户名或密码错误");
                return ResponseEntity.status(401).body(response);
            }

            User user = userOpt.get();

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                response.put("success", false);
                response.put("message", "用户名或密码错误");
                return ResponseEntity.status(401).body(response);
            }

            String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
            String refreshToken = jwtUtil.generateRefreshToken(user.getId());

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole());
            userData.put("level", user.getLevel());
            userData.put("experience", user.getExperience());
            userData.put("nickname", user.getNickname());
            userData.put("avatarUrl", user.getAvatarUrl());
            userData.put("bio", user.getBio());
            userData.put("subjectPreferences", parseJsonSafely(user.getSubjectPreferences()));
            userData.put("learningGoal", user.getLearningGoal());

            response.put("success", true);
            response.put("token", token);
            response.put("refreshToken", refreshToken);
            response.put("user", userData);
            response.put("message", "登录成功");

            log.info("登录成功：userId={}, username={}", user.getId(), user.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("登录失败：", e);
            response.put("success", false);
            response.put("message", "登录失败：用户名或密码错误");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 刷新 Access Token
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(
            @RequestBody RefreshTokenRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String refreshToken = request.getRefreshToken();

            if (refreshToken == null || refreshToken.isBlank()) {
                response.put("success", false);
                response.put("message", "未提供refresh token");
                return ResponseEntity.badRequest().body(response);
            }

            if (!jwtUtil.isRefreshTokenValid(refreshToken)) {
                response.put("success", false);
                response.put("message", "无效的或已过期的refresh token");
                return ResponseEntity.status(401).body(response);
            }

            Long userId = jwtUtil.getUserIdFromToken(refreshToken);
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "用户不存在");
                return ResponseEntity.status(404).body(response);
            }

            User user = userOpt.get();
            String newAccessToken = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

            response.put("success", true);
            response.put("token", newAccessToken);
            response.put("message", "刷新成功");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("刷新token失败：", e);
            response.put("success", false);
            response.put("message", "刷新token失败");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        log.info("收到注册请求：username={}, email={}", request.getUsername(), request.getEmail());

        Map<String, Object> response = new HashMap<>();

        try {
            if (userRepository.existsByUsername(request.getUsername())) {
                response.put("success", false);
                response.put("message", "注册失败：用户名或邮箱已存在");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
                response.put("success", false);
                response.put("message", "注册失败：用户名或邮箱已存在");
                return ResponseEntity.badRequest().body(response);
            }

            String encodedPassword = passwordEncoder.encode(request.getPassword());
            // 只允许 student/teacher 自注册，防止客户端伪造 admin 角色
            String role = "teacher".equals(request.getRole()) ? "teacher" : "student";

            String prefsJson = null;
            if (request.getSubjectPreferences() != null && !request.getSubjectPreferences().isEmpty()) {
                try {
                    prefsJson = objectMapper.writeValueAsString(request.getSubjectPreferences());
                } catch (JsonProcessingException e) {
                    log.warn("subjectPreferences 序列化失败，忽略该字段");
                }
            }

            User newUser = User.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .email(request.getEmail())
                .nickname(request.getUsername())
                .level(1)
                .experience(0)
                .status("active")
                .role(role)
                .subjectPreferences(prefsJson)
                .learningGoal(request.getLearningGoal())
                .build();

            userRepository.save(newUser);

            response.put("success", true);
            response.put("message", "注册成功");

            log.info("注册成功：username={}", request.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("注册失败：", e);
            response.put("success", false);
            response.put("message", "注册失败，请稍后重试");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("success", false);
                response.put("message", "未提供有效的token");
                return ResponseEntity.status(401).body(response);
            }

            String token = authHeader.substring(7);

            if (!jwtUtil.isTokenValid(token)) {
                response.put("success", false);
                response.put("message", "无效的token");
                return ResponseEntity.status(401).body(response);
            }

            Long userId = jwtUtil.getUserIdFromToken(token);
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "用户不存在");
                return ResponseEntity.status(404).body(response);
            }

            User user = userOpt.get();

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole());
            userData.put("level", user.getLevel());
            userData.put("experience", user.getExperience());
            userData.put("nickname", user.getNickname());
            userData.put("avatarUrl", user.getAvatarUrl());
            userData.put("bio", user.getBio());
            userData.put("subjectPreferences", parseJsonSafely(user.getSubjectPreferences()));
            userData.put("learningGoal", user.getLearningGoal());

            response.put("success", true);
            response.put("user", userData);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("获取用户信息失败：", e);
            response.put("success", false);
            response.put("message", "获取用户信息失败");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 更新用户信息
     */
    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateCurrentUser(
            @RequestHeader(value = "Authorization") String authHeader,
            @RequestBody UpdateUserRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String token = authHeader.substring(7);
            if (!jwtUtil.isTokenValid(token)) {
                response.put("success", false);
                response.put("message", "无效的token");
                return ResponseEntity.status(401).body(response);
            }

            Long userId = jwtUtil.getUserIdFromToken(token);
            Optional<User> userOpt = userRepository.findById(userId);

            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "用户不存在");
                return ResponseEntity.status(404).body(response);
            }

            User user = userOpt.get();

            if (request.getNickname() != null) user.setNickname(request.getNickname());
            if (request.getEmail() != null) user.setEmail(request.getEmail());
            if (request.getPhone() != null) user.setPhone(request.getPhone());
            if (request.getBio() != null) user.setBio(request.getBio());
            if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

            userRepository.save(user);

            response.put("success", true);
            response.put("message", "更新成功");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("更新用户信息失败：", e);
            response.put("success", false);
            response.put("message", "更新失败，请稍后重试");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 注册后初始化学科偏好和学习目标
     */
    @PostMapping("/profile/init")
    public ResponseEntity<Map<String, Object>> initProfile(
            Authentication authentication,
            @RequestBody ProfileInitRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long userId = (Long) authentication.getPrincipal();
            User user = userRepository.findById(userId).orElseThrow();

            if (request.getSubjectPreferences() != null) {
                user.setSubjectPreferences(objectMapper.writeValueAsString(request.getSubjectPreferences()));
            }
            if (request.getLearningGoal() != null) {
                user.setLearningGoal(request.getLearningGoal());
            }
            userRepository.save(user);

            response.put("success", true);
            response.put("message", "初始化成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("profile/init 失败：", e);
            response.put("success", false);
            response.put("message", "初始化失败，请稍后重试");
            return ResponseEntity.status(500).body(response);
        }
    }

    private Object parseJsonSafely(String json) {
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, List.class);
        } catch (JsonProcessingException e) {
            return json;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshTokenRequest {
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        private String role;
        private List<String> subjectPreferences;
        private String learningGoal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileInitRequest {
        private List<String> subjectPreferences;
        private String learningGoal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserRequest {
        private String nickname;
        private String email;
        private String phone;
        private String bio;
        private String avatarUrl;
    }
}
