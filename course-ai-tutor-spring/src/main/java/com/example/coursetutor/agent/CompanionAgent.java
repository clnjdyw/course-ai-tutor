package com.example.coursetutor.agent;

import com.example.coursetutor.dto.ChatRequest;
import com.example.coursetutor.dto.ChatResponse;
import com.example.coursetutor.entity.User;
import com.example.coursetutor.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 陪伴智能体 - 聊天交流，情绪反馈
 */
@Slf4j
@Service
public class CompanionAgent extends BaseAgent {
    
    @Autowired
    private UserRepository userRepository;
    
    @Value("${app.agent.companion.system-prompt:}")
    private String systemPrompt;
    
    // 用户情绪状态缓存
    private final Map<Long, UserMood> userMoodCache = new HashMap<>();
    
    @Override
    public String getAgentName() {
        return "Companion";
    }
    
    @Override
    public String getAgentDescription() {
        return "陪伴智能体，负责聊天交流和情绪反馈";
    }
    
    @Override
    public AgentType getAgentType() {
        return AgentType.COMPANION;
    }
    
    /**
     * 聊天交流
     */
    public ChatResponse chat(ChatRequest request) {
        log.info("聊天交流：userId={}, message={}", request.getUserId(), request.getMessage());
        
        // 获取用户信息
        User user = userRepository.findById(request.getUserId()).orElse(null);
        
        // 分析用户情绪和答题情况
        UserMood mood = analyzeUserMood(request.getUserId());
        
        // 构建包含情绪上下文的提示
        String userPrompt = """
            当前时间：%s
            用户信息：
            - 用户名：%s
            - 等级：LV.%d
            - 经验值：%d
            
            用户最近状态：
            - 情绪状态：%s
            - 昨日答题正确率：%.1f%%
            - 今日答题数：%d
            - 连续学习天数：%d
            
            用户消息：%s
            
            请根据用户的状态和消息，给出合适的回复。
            要求：
            1. 语气友好、温暖、积极
            2. 根据用户情绪调整回复风格
            3. 适当使用 emoji 表情
            4. 如果用户情绪低落，给予鼓励
            5. 如果用户进步明显，给予表扬
            6. 保持对话自然流畅
            """.formatted(
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy 年 MM 月 dd 日 EEEE")),
                user != null ? user.getUsername() : "同学",
                user != null ? user.getLevel() : 1,
                user != null ? user.getExperience() : 0,
                mood.getDescription(),
                mood.getYesterdayAccuracy(),
                mood.getTodayCount(),
                mood.getStreakDays(),
                request.getMessage()
            );
        
        String response = callWithPrompt(systemPrompt, userPrompt);
        
        // 更新情绪缓存
        updateUserMood(request.getUserId(), request.getMessage(), response);
        
        return ChatResponse.builder()
            .success(true)
            .message(response)
            .mood(mood)
            .agentType("companion")
            .build();
    }
    
    /**
     * 分析用户情绪
     */
    private UserMood analyzeUserMood(Long userId) {
        // 这里应该从数据库获取用户的答题记录和学习数据
        // 简化实现：返回示例数据
        
        UserMood mood = userMoodCache.getOrDefault(userId, new UserMood());
        
        // 模拟数据
        mood.setYesterdayAccuracy(75.0 + (userId % 25));
        mood.setTodayCount((int)(userId % 20));
        mood.setStreakDays((int)(userId % 30));
        
        // 根据答题情况判断情绪
        if (mood.getYesterdayAccuracy() > 80) {
            mood.setMoodType(MoodType.HAPPY);
        } else if (mood.getYesterdayAccuracy() > 50) {
            mood.setMoodType(MoodType.NORMAL);
        } else {
            mood.setMoodType(MoodType.SAD);
        }
        
        userMoodCache.put(userId, mood);
        return mood;
    }
    
    /**
     * 更新用户情绪
     */
    private void updateUserMood(Long userId, String userMessage, String botResponse) {
        // 分析用户消息的情感倾向
        // 简化实现：关键词匹配
        
        UserMood mood = userMoodCache.getOrDefault(userId, new UserMood());
        
        if (userMessage.contains("开心") || userMessage.contains("高兴") || 
            userMessage.contains("谢谢") || userMessage.contains("明白了")) {
            mood.setMoodType(MoodType.HAPPY);
        } else if (userMessage.contains("难过") || userMessage.contains("不懂") || 
                   userMessage.contains("困难") || userMessage.contains("累")) {
            mood.setMoodType(MoodType.SAD);
        }
        
        userMoodCache.put(userId, mood);
    }
    
    /**
     * 用户情绪状态
     */
    public static class UserMood {
        private MoodType moodType = MoodType.NORMAL;
        private double yesterdayAccuracy = 70.0;
        private int todayCount = 0;
        private int streakDays = 1;
        
        public String getDescription() {
            return switch (moodType) {
                case HAPPY -> "😊 开心";
                case SAD -> "😔 需要鼓励";
                case EXCITED -> "🤩 兴奋";
                case TIRED -> "😴 需要休息";
                default -> "🙂 平静";
            };
        }
        
        // Getters and Setters
        public MoodType getMoodType() { return moodType; }
        public void setMoodType(MoodType moodType) { this.moodType = moodType; }
        public double getYesterdayAccuracy() { return yesterdayAccuracy; }
        public void setYesterdayAccuracy(double accuracy) { this.yesterdayAccuracy = accuracy; }
        public int getTodayCount() { return todayCount; }
        public void setTodayCount(int count) { this.todayCount = count; }
        public int getStreakDays() { return streakDays; }
        public void setStreakDays(int days) { this.streakDays = days; }
    }
    
    public enum MoodType {
        HAPPY("开心"),
        NORMAL("平静"),
        SAD("低落"),
        EXCITED("兴奋"),
        TIRED("疲惫");
        
        private final String description;
        
        MoodType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
