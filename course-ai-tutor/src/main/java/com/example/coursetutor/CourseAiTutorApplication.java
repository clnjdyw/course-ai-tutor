package com.example.coursetutor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

/**
 * 课程辅导 AI 智能体系统 - 主启动类
 * 
 * @author Course AI Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableConfigurationProperties
public class CourseAiTutorApplication {

    public static void main(String[] args) {
        SpringApplication.run(CourseAiTutorApplication.class, args);
        System.out.println("========================================");
        System.out.println("    课程辅导 AI 智能体系统启动成功！");
        System.out.println("    访问地址：http://localhost:8080/api");
        System.out.println("    H2 控制台：http://localhost:8080/api/h2-console");
        System.out.println("========================================");
    }
}
