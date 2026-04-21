package com.example.coursetutor.agent.collaboration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Consumer;

/**
 * Agent 消息总线 - 实现 Agent 间消息传递
 */
@Slf4j
@Component
public class AgentMessageBus {
    
    /** 订阅者 Map: agentName -> handlers */
    private final Map<String, List<Consumer<AgentMessage>>> subscribers = new ConcurrentHashMap<>();
    
    /** 消息队列 */
    private final BlockingQueue<AgentMessage> messageQueue = new LinkedBlockingQueue<>(10000);
    
    /** 消息处理器线程池 */
    private final ExecutorService messageProcessor = Executors.newFixedThreadPool(4);
    
    /** 待处理响应 Map: messageId -> CompletableFuture */
    private final Map<String, CompletableFuture<AgentMessage>> pendingResponses = new ConcurrentHashMap<>();
    
    /** 消息计数器 */
    private final AtomicLong messageCount = new AtomicLong(0);
    
    /** 消息历史 (最近100条) */
    private final Queue<AgentMessage> messageHistory = new LinkedList<>();
    
    private volatile boolean running = true;
    
    @PostConstruct
    public void init() {
        // 启动消息处理线程
        for (int i = 0; i < 4; i++) {
            messageProcessor.submit(this::processMessages);
        }
        log.info("AgentMessageBus 初始化完成");
    }
    
    /**
     * 订阅消息
     */
    public void subscribe(String agentName, Consumer<AgentMessage> handler) {
        subscribers.computeIfAbsent(agentName, k -> new CopyOnWriteArrayList<>())
                .add(handler);
        log.debug("Agent {} 订阅消息成功", agentName);
    }
    
    /**
     * 取消订阅
     */
    public void unsubscribe(String agentName) {
        subscribers.remove(agentName);
        log.debug("Agent {} 取消订阅", agentName);
    }
    
    /**
     * 发布消息
     */
    public void publish(AgentMessage message) {
        messageCount.incrementAndGet();
        
        // 记录历史
        synchronized (messageHistory) {
            messageHistory.offer(message);
            while (messageHistory.size() > 100) {
                messageHistory.poll();
            }
        }
        
        // 加入队列
        if (!messageQueue.offer(message)) {
            log.warn("消息队列已满，消息被丢弃: {}", message.getMessageId());
        }
        
        log.debug("消息已发布: {} -> {} (type: {})", 
                message.getSourceAgent(), message.getTargetAgent(), message.getType());
    }
    
    /**
     * 发送消息并等待响应
     */
    public CompletableFuture<AgentMessage> sendAndWait(AgentMessage message, long timeoutMs) {
        CompletableFuture<AgentMessage> future = new CompletableFuture<>();
        pendingResponses.put(message.getResponseId(), future);
        
        // 设置超时
        CompletableFuture.delayedExecutor(timeoutMs, TimeUnit.MILLISECONDS)
                .execute(() -> {
                    CompletableFuture<AgentMessage> removed = pendingResponses.remove(message.getResponseId());
                    if (removed != null && !removed.isDone()) {
                        removed.completeExceptionally(new TimeoutException("等待响应超时"));
                    }
                });
        
        // 发送消息
        publish(message);
        
        return future;
    }
    
    /**
     * 处理消息
     */
    private void processMessages() {
        while (running) {
            try {
                AgentMessage message = messageQueue.poll(1, TimeUnit.SECONDS);
                if (message == null) continue;
                
                processMessage(message);
                
            } catch (InterruptedException e) {
                log.info("消息处理线程被中断");
                break;
            } catch (Exception e) {
                log.error("处理消息时出错", e);
            }
        }
    }
    
    /**
     * 处理单条消息
     */
    private void processMessage(AgentMessage message) {
        // 检查是否有待处理的响应
        String responseId = message.getResponseId();
        if (pendingResponses.containsKey(responseId)) {
            CompletableFuture<AgentMessage> future = pendingResponses.remove(responseId);
            future.complete(message);
            return;
        }
        
        // 分发给订阅者
        String targetAgent = message.getTargetAgent();
        List<Consumer<AgentMessage>> handlers = new ArrayList<>();
        
        if (targetAgent != null) {
            // 单播
            List<Consumer<AgentMessage>> agentHandlers = subscribers.get(targetAgent);
            if (agentHandlers != null) {
                handlers.addAll(agentHandlers);
            }
        } else {
            // 广播给所有订阅者（除了发送者）
            subscribers.forEach((agentName, agentHandlers) -> {
                if (!agentName.equals(message.getSourceAgent())) {
                    handlers.addAll(agentHandlers);
                }
            });
        }
        
        // 异步执行处理器
        for (Consumer<AgentMessage> handler : handlers) {
            try {
                handler.accept(message);
            } catch (Exception e) {
                log.error("消息处理出错: handler={}, message={}", handler, message.getMessageId(), e);
            }
        }
    }
    
    /**
     * 获取消息历史
     */
    public List<AgentMessage> getHistory(int limit) {
        synchronized (messageHistory) {
            return new ArrayList<>(messageHistory)
                    .subList(Math.max(0, messageHistory.size() - limit), messageHistory.size());
        }
    }
    
    /**
     * 获取消息统计
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMessages", messageCount.get());
        stats.put("pendingResponses", pendingResponses.size());
        stats.put("subscribers", subscribers.keySet());
        stats.put("queueSize", messageQueue.size());
        return stats;
    }
    
    /**
     * 关闭
     */
    public void shutdown() {
        running = false;
        messageProcessor.shutdown();
        try {
            if (!messageProcessor.awaitTermination(5, TimeUnit.SECONDS)) {
                messageProcessor.shutdownNow();
            }
        } catch (InterruptedException e) {
            messageProcessor.shutdownNow();
        }
        log.info("AgentMessageBus 已关闭");
    }
}
