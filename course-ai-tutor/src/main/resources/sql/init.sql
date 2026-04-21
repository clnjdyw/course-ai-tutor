-- 课程辅导 AI 智能体系统 - 数据库初始化脚本
-- 适用于 PostgreSQL

-- 创建扩展（向量支持）
CREATE EXTENSION IF NOT EXISTS vector;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    nickname VARCHAR(50),
    profile TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    level VARCHAR(20),
    knowledge_graph TEXT,
    syllabus TEXT,
    instructor_id BIGINT,
    content_path VARCHAR(500),
    duration_hours INTEGER,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 学习计划表
CREATE TABLE IF NOT EXISTS study_plans (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT,
    goal TEXT NOT NULL,
    schedule TEXT,
    resources TEXT,
    progress INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 对话历史表
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    messages TEXT,
    context TEXT,
    topic VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT,
    action_type VARCHAR(50),
    result TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_learning_records_user_id ON learning_records(user_id);

-- 插入测试数据
INSERT INTO users (username, password, email, nickname) VALUES
('test_user', 'password123', 'test@example.com', '测试用户'),
('student1', 'password123', 'student1@example.com', '学生 1');

INSERT INTO courses (title, description, category, level, published) VALUES
('Java 编程入门', '从零开始学习 Java 编程', 'PROGRAMMING', 'BEGINNER', TRUE),
('Spring Boot 实战', 'Spring Boot 框架实战教程', 'FRAMEWORK', 'INTERMEDIATE', TRUE),
('人工智能基础', '人工智能入门课程', 'AI', 'BEGINNER', TRUE);
