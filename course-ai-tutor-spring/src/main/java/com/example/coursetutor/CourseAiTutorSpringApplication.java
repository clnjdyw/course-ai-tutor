package com.example.coursetutor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CourseAiTutorSpringApplication {

    public static void main(String[] args) {
        SpringApplication.run(CourseAiTutorSpringApplication.class, args);
        System.out.println("========================================");
        System.out.println("   🚀 课程辅导 AI 智能体系统启动成功！");
        System.out.println("========================================");
        System.out.println("   服务地址：http://localhost:8082");
        System.out.println("   API 文档：http://localhost:8082/api/agent/list");
        System.out.println("   H2 控制台：http://localhost:8082/h2-console");
        System.out.println("========================================");
    }
}
