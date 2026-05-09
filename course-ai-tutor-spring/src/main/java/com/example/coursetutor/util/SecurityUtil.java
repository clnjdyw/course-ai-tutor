package com.example.coursetutor.util;

import com.example.coursetutor.config.JwtAuthenticationFilter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility for extracting the current authenticated user ID from the SecurityContext.
 */
public class SecurityUtil {

    private SecurityUtil() {}

    /**
     * Returns the current authenticated user ID, or null if not authenticated.
     */
    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Long) {
            return (Long) auth.getPrincipal();
        }
        return null;
    }

    /**
     * Returns the current authenticated user ID, or throws if not authenticated.
     */
    public static Long requireUserId() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }
        return userId;
    }
}
