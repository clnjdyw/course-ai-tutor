package com.example.coursetutor.service;

import com.example.coursetutor.entity.LearningReminder;
import com.example.coursetutor.entity.ReviewSchedule;
import com.example.coursetutor.repository.LearningReminderRepository;
import com.example.coursetutor.repository.ReviewScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled reminder service for review notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderSchedulerService {

    private final LearningReminderRepository learningReminderRepository;
    private final ReviewScheduleRepository reviewScheduleRepository;
    private final JavaMailSender mailSender;

    /**
     * Check for due review reminders every minute
     */
    @Scheduled(cron = "0 * * * * *")
    public void checkReviewReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<ReviewSchedule> dueReviews = reviewScheduleRepository.findByReviewTimeBeforeAndStatus(now, "pending");

        for (ReviewSchedule review : dueReviews) {
            sendReviewReminder(review);
            review.setStatus("sent");
            reviewScheduleRepository.save(review);
        }
    }

    /**
     * Check for due learning reminders every minute
     */
    @Scheduled(cron = "0 * * * * *")
    public void checkLearningReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<LearningReminder> dueReminders = learningReminderRepository.findByReminderTimeBeforeAndStatus(now, "pending");

        for (LearningReminder reminder : dueReminders) {
            sendLearningReminder(reminder);
            reminder.setStatus("sent");
            learningReminderRepository.save(reminder);
        }
    }

    private void sendReviewReminder(ReviewSchedule review) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("user@example.com"); // In production, get user email
            message.setSubject("Review Reminder: " + review.getKnowledgePointId());
            message.setText("It's time to review knowledge point #" + review.getKnowledgePointId() +
                    ". Your next review is scheduled for " + review.getReviewTime());
            mailSender.send(message);
            log.info("Sent review reminder for user {} knowledge point {}", review.getUserId(), review.getKnowledgePointId());
        } catch (Exception e) {
            log.error("Failed to send review reminder: {}", e.getMessage());
        }
    }

    private void sendLearningReminder(LearningReminder reminder) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("user@example.com"); // In production, get user email
            message.setSubject("Learning Reminder: " + reminder.getReminderType());
            message.setText("Reminder: " + reminder.getContent());
            mailSender.send(message);
            log.info("Sent learning reminder for user {}: {}", reminder.getUserId(), reminder.getContent());
        } catch (Exception e) {
            log.error("Failed to send learning reminder: {}", e.getMessage());
        }
    }
}
