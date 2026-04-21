package com.example.coursetutor.agent;

import com.example.coursetutor.dto.ChatRequest;
import com.example.coursetutor.dto.ChatResponse;
import com.example.coursetutor.entity.User;
import com.example.coursetutor.entity.UserMoodEntity;
import com.example.coursetutor.repository.UserMoodRepository;
import com.example.coursetutor.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 陪伴智能体 - 聊天交流，情绪反馈
 */
@Slf4j
@Service
public class CompanionAgent extends BaseAgent {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserMoodRepository userMoodRepository;

    @Value("${app.agent.companion.system-prompt:}")
    private String systemPrompt;

    // 用户当前情绪状态缓存（用于快速访问）
    private final Map<Long, MoodSnapshot> moodCache = new HashMap<>();

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
        MoodSnapshot mood = analyzeUserMood(request.getUserId());

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

        // 更新情绪记录并持久化到数据库
        saveUserMood(request.getUserId(), request.getMessage(), response, mood);

        return ChatResponse.builder()
            .success(true)
            .message(response)
            .mood(mood.toUserMoodEntity())
            .agentType("companion")
            .build();
    }

    /**
     * 分析用户情绪
     */
    private MoodSnapshot analyzeUserMood(Long userId) {
        // 从数据库获取用户最新的情绪记录
        Optional<UserMoodEntity> latestMood = userMoodRepository.findTopByUserIdOrderByCreatedAtDesc(userId);

        MoodSnapshot snapshot;
        if (latestMood.isPresent()) {
            UserMoodEntity entity = latestMood.get();
            snapshot = MoodSnapshot.fromEntity(entity);
        } else {
            // 如果没有历史记录，创建新的快照
            snapshot = new MoodSnapshot();
            snapshot.setYesterdayAccuracy(70.0);
            snapshot.setTodayCount(0);
            snapshot.setStreakDays(1);
            snapshot.setMoodType(MoodType.NORMAL);
        }

        // 模拟数据更新（实际应该从学习统计中获取）
        snapshot.setYesterdayAccuracy(75.0 + (userId % 25));
        snapshot.setTodayCount((int)(userId % 20));
        snapshot.setStreakDays((int)(userId % 30));

        // 根据答题情况判断情绪
        if (snapshot.getYesterdayAccuracy() > 80) {
            snapshot.setMoodType(MoodType.HAPPY);
        } else if (snapshot.getYesterdayAccuracy() > 50) {
            snapshot.setMoodType(MoodType.NORMAL);
        } else {
            snapshot.setMoodType(MoodType.SAD);
        }

        // 更新缓存
        moodCache.put(userId, snapshot);
        return snapshot;
    }

    /**
     * 保存用户情绪记录到数据库
     */
    private void saveUserMood(Long userId, String userMessage, String botResponse, MoodSnapshot mood) {
        // 分析用户消息的情感倾向
        MoodType detectedMood = detectMoodFromMessage(userMessage, mood.getMoodType());
        mood.setMoodType(detectedMood);

        // 创建实体并保存到数据库
        UserMoodEntity entity = UserMoodEntity.builder()
            .userId(userId)
            .moodType(detectedMood.name())
            .yesterdayAccuracy(mood.getYesterdayAccuracy())
            .todayCount(mood.getTodayCount())
            .streakDays(mood.getStreakDays())
            .userMessage(userMessage)
            .botResponse(botResponse)
            .build();

        userMoodRepository.save(entity);

        // 清理过期数据（保留最近30天）
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        userMoodRepository.deleteByUserIdAndCreatedAtBefore(userId, cutoffDate);

        log.info("已保存用户情绪记录：userId={}, moodType={}", userId, detectedMood);
    }

    /**
     * 从用户消息中检测情绪
     */
    private MoodType detectMoodFromMessage(String userMessage, MoodType currentMood) {
        if (userMessage == null || userMessage.isEmpty()) {
            return currentMood;
        }

        // 积极情绪关键词
        if (userMessage.contains("开心") || userMessage.contains("高兴") ||
            userMessage.contains("谢谢") || userMessage.contains("明白了") ||
            userMessage.contains("哈哈") || userMessage.contains("棒") ||
            userMessage.contains("喜欢")) {
            return MoodType.HAPPY;
        }

        // 消极情绪关键词
        if (userMessage.contains("难过") || userMessage.contains("不懂") ||
            userMessage.contains("困难") || userMessage.contains("累") ||
            userMessage.contains("烦") || userMessage.contains("不会") ||
            userMessage.contains("糟糕")) {
            return MoodType.SAD;
        }

        // 兴奋情绪关键词
        if (userMessage.contains("太棒了") || userMessage.contains("哇") ||
            userMessage.contains("厉害") || userMessage.contains("完美")) {
            return MoodType.EXCITED;
        }

        // 疲惫情绪关键词
        if (userMessage.contains("困") || userMessage.contains("想休息") ||
            userMessage.contains("累了") || userMessage.contains("不想学")) {
            return MoodType.TIRED;
        }

        return currentMood;
    }

    /**
     * 获取用户最近的情绪历史
     */
    public List<UserMoodEntity> getMoodHistory(Long userId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return userMoodRepository.findByUserIdAndRecentDays(userId, startDate);
    }

    /**
     * 获取用户当前情绪状态
     */
    public MoodSnapshot getCurrentMood(Long userId) {
        return moodCache.getOrDefault(userId, new MoodSnapshot());
    }

    /**
     * 情绪快照（用于内存缓存和 API 响应）
     */
    public static class MoodSnapshot {
        private MoodType moodType = MoodType.NORMAL;
        private double yesterdayAccuracy = 70.0;
        private int todayCount = 0;
        private int streakDays = 1;

        public static MoodSnapshot fromEntity(UserMoodEntity entity) {
            MoodSnapshot snapshot = new MoodSnapshot();
            snapshot.moodType = MoodType.valueOf(entity.getMoodType());
            snapshot.yesterdayAccuracy = entity.getYesterdayAccuracy();
            snapshot.todayCount = entity.getTodayCount();
            snapshot.streakDays = entity.getStreakDays();
            return snapshot;
        }

        public UserMoodEntity toUserMoodEntity() {
            return UserMoodEntity.builder()
                .moodType(this.moodType.name())
                .yesterdayAccuracy(this.yesterdayAccuracy)
                .todayCount(this.todayCount)
                .streakDays(this.streakDays)
                .build();
        }

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
