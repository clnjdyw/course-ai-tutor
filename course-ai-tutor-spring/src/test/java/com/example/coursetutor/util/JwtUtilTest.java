package com.example.coursetutor.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "test_secret_key_for_jwt_at_least_32_characters_long");
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", 3600000L); // 1 hour
    }

    @Test
    @DisplayName("generateToken creates valid token")
    void generateToken_createsValidToken() {
        String token = jwtUtil.generateToken(1L, "testuser", "USER");

        assertThat(token).isNotNull();
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("generated token contains correct user ID")
    void token_containsCorrectUserId() {
        String token = jwtUtil.generateToken(42L, "testuser", "USER");

        Long userId = jwtUtil.getUserIdFromToken(token);
        assertThat(userId).isEqualTo(42L);
    }

    @Test
    @DisplayName("generated token contains correct username")
    void token_containsCorrectUsername() {
        String token = jwtUtil.generateToken(1L, "alice", "USER");

        String username = jwtUtil.getUsernameFromToken(token);
        assertThat(username).isEqualTo("alice");
    }

    @Test
    @DisplayName("generated token contains correct role")
    void token_containsCorrectRole() {
        String token = jwtUtil.generateToken(1L, "admin", "ADMIN");

        String role = jwtUtil.getRoleFromToken(token);
        assertThat(role).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("valid token is considered valid")
    void validToken_isValid() {
        String token = jwtUtil.generateToken(1L, "user", "USER");

        assertThat(jwtUtil.isTokenValid(token)).isTrue();
    }

    @Test
    @DisplayName("tampered token is considered invalid")
    void tamperedToken_isInvalid() {
        String token = jwtUtil.generateToken(1L, "user", "USER");
        String tampered = token + "tampered";

        assertThat(jwtUtil.isTokenValid(tampered)).isFalse();
    }
}
