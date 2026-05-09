package com.example.coursetutor.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseTest {

    @Test
    @DisplayName("ok creates success response with data")
    void ok_createsSuccessResponse() {
        ApiResponse<String> response = ApiResponse.ok("hello");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).isEqualTo("hello");
        assertThat(response.getMessage()).isNull();
    }

    @Test
    @DisplayName("ok with message creates success response")
    void okWithMessage() {
        ApiResponse<Map<String, Object>> response = ApiResponse.ok(Map.of("id", 1), "Created");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Created");
    }

    @Test
    @DisplayName("error creates failure response")
    void error_createsFailureResponse() {
        ApiResponse<String> response = ApiResponse.error("Not found");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getData()).isNull();
        assertThat(response.getMessage()).isEqualTo("Not found");
    }

    @Test
    @DisplayName("error with data includes both message and data")
    void errorWithData() {
        ApiResponse<Map<String, Object>> response = ApiResponse.error("Validation failed", Map.of("field", "required"));

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Validation failed");
        assertThat(response.getData()).containsEntry("field", "required");
    }
}
