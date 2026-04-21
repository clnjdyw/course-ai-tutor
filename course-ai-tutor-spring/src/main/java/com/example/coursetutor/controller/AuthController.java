package com.example.coursetutor.controller;

import com.example.coursetutor.entity.User;
import com.example.coursetutor.repository.UserRepository;
import com.example.coursetutor.util.JwtUtil;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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

            response.put("success", true);
            response.put("token", token);
            response.put("user", userData);
            response.put("message", "登录成功");

            log.info("登录成功：userId={}, username={}", user.getId(), user.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("登录失败：", e);
            response.put("success", false);
            response.put("message", "登录失败：" + e.getMessage());
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
                response.put("message", "用户名已存在");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
                response.put("success", false);
                response.put("message", "邮箱已被注册");
                return ResponseEntity.badRequest().body(response);
            }

            String encodedPassword = passwordEncoder.encode(request.getPassword());
            String role = request.getRole() != null ? request.getRole() : "student";

            User newUser = User.builder()
                .username(request.getUsername())
                .password(encodedPassword)
                .email(request.getEmail())
                .nickname(request.getUsername())
                .level(1)
                .experience(0)
                .status("active")
                .role(role)
                .build();

            userRepository.save(newUser);

            response.put("success", true);
            response.put("message", "注册成功");

            log.info("注册成功：username={}", request.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("注册失败：", e);
            response.put("success", false);
            response.put("message", "注册失败：" + e.getMessage());
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

            response.put("success", true);
            response.put("user", userData);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("获取用户信息失败：", e);
            response.put("success", false);
            response.put("message", "获取用户信息失败：" + e.getMessage());
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
            response.put("message", "更新失败：" + e.getMessage());
            return ResponseEntity.status(500).body(response);
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
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        private String role;
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
