-- Course AI Tutor MySQL 数据库初始化脚本
-- 数据库: course_ai_tutor
-- 字符集: utf8mb4

-- 创建数据库
CREATE DATABASE IF NOT EXISTS course_ai_tutor
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE course_ai_tutor;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    nickname VARCHAR(50),
    bio TEXT,
    avatar_url VARCHAR(200),
    level INT NOT NULL DEFAULT 1,
    experience INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    instructor_id BIGINT,
    cover_url VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学习计划表
CREATE TABLE IF NOT EXISTS study_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    goal TEXT,
    schedule TEXT,
    resources TEXT,
    progress DOUBLE NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 对话历史表
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    messages TEXT NOT NULL COMMENT 'JSON格式的消息列表',
    topic VARCHAR(200),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_agent_type (agent_type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    course_id BIGINT,
    action_type VARCHAR(50) NOT NULL COMMENT '学习动作类型: study, practice, review',
    result TEXT COMMENT 'JSON格式的学习结果',
    duration INT COMMENT '学习时长(分钟)',
    score DOUBLE COMMENT '得分',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_course_id (course_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 练习题表
CREATE TABLE IF NOT EXISTS exercises (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INT NOT NULL DEFAULT 1,
    type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice' COMMENT '题目类型',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course_id (course_id),
    INDEX idx_difficulty (difficulty),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户答题记录表
CREATE TABLE IF NOT EXISTS user_exercises (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    exercise_id BIGINT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    score DOUBLE,
    completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_exercise_id (exercise_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 成就定义表
CREATE TABLE IF NOT EXISTS achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    points INT NOT NULL DEFAULT 0,
    icon VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户成就解锁表
CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_achievement_id (achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户情绪记录表
CREATE TABLE IF NOT EXISTS user_moods (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mood_type VARCHAR(20) NOT NULL,
    yesterday_accuracy DOUBLE NOT NULL DEFAULT 70.0,
    today_count INT NOT NULL DEFAULT 0,
    streak_days INT NOT NULL DEFAULT 1,
    user_message TEXT,
    bot_response TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_mood_type (mood_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入预置成就数据
INSERT IGNORE INTO achievements (code, name, description, category, points, icon) VALUES
('first_step', '第一步', '完成第一次学习', 'beginner', 10, '🎯'),
('knowledge_seeker', '求知者', '累计学习10小时', 'learning', 50, '📚'),
('streak_master', '连续达人', '连续学习7天', 'streak', 100, '🔥'),
('first_answer', '初出茅庐', '第一次回答问题', 'practice', 20, '💡'),
('perfect_score', '满分达人', '获得一次满分', 'practice', 80, '💯'),
('speed_learner', '速学小能手', '一天内完成5个学习记录', 'learning', 30, '⚡'),
('night_owl', '夜猫子', '深夜12点后仍在学习', 'special', 25, '🦉'),
('early_bird', '早起鸟', '连续3天早上7点前学习', 'special', 25, '🐦'),
('helpful_peer', '热心同学', '帮助其他同学解答问题', 'social', 40, '🤝'),
('course_master', '课程达人', '完成3门不同类别的课程', 'learning', 60, '📖'),
('persistent', '坚持不懈', '连续学习30天', 'streak', 200, '🏆'),
('top_scorer', '学霸', '平均正确率达到90%以上', 'practice', 150, '🥇'),
('explorer', '探索者', '尝试所有类型的智能体', 'special', 50, '🗺️'),
('founder', '创始成员', '第一个注册用户', 'special', 500, '🌟');

-- 插入默认系统设置
INSERT IGNORE INTO system_settings (key_name, value, description) VALUES
('app.name', 'Course AI Tutor', '应用名称'),
('app.version', '1.0.0', '应用版本'),
('agent.model', 'Qwen/Qwen2.5-Coder-32B-Instruct', '默认AI模型'),
('learning.daily_target_minutes', '60', '每日学习目标(分钟)'),
('learning.streak_threshold_hours', '0.5', '连续学习判定阈值(小时)');
