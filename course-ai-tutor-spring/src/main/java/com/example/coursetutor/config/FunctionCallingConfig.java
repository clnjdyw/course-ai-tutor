package com.example.coursetutor.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Function;

/**
 * Spring AI Function Calling configuration
 * Registers all tools as functions for AI agents
 */
@Configuration
public class FunctionCallingConfig {

    // Tools are registered via @Tool annotation on service classes.
    // Spring AI auto-discovers @Tool-annotated methods when using
    // ChatClient with function callbacks.
    //
    // Usage in agents:
    //   chatClient.prompt()
    //       .user(prompt)
    //       .functions("getUserProfile", "searchKnowledgeBase", ...)
    //       .call()
    //       .content();
}
