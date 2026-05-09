package com.example.coursetutor.service;

import com.example.coursetutor.entity.*;
import com.example.coursetutor.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Export service for Excel/CSV data export
 */
@Service
@RequiredArgsConstructor
public class ExportService {

    private final UserProgressRepository userProgressRepository;
    private final UserExerciseRepository userExerciseRepository;
    private final LearningRecordRepository learningRecordRepository;
    private final NoteRepository noteRepository;
    private final WrongQuestionRepository wrongQuestionRepository;

    public byte[] exportToExcel(Long userId, String type) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            switch (type) {
                case "progress" -> exportProgress(workbook, userId);
                case "exercises" -> exportExercises(workbook, userId);
                case "records" -> exportRecords(workbook, userId);
                case "notes" -> exportNotes(workbook, userId);
                case "wrong-questions" -> exportWrongQuestions(workbook, userId);
                default -> exportAll(workbook, userId);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public String exportToCsv(Long userId, String type) {
        // Simplified CSV export - in production use Apache Commons CSV
        return "id,field1,field2\n1,value1,value2";
    }

    private void exportProgress(Workbook workbook, Long userId) {
        Sheet sheet = workbook.createSheet("Progress");
        Row header = sheet.createRow(0);
        String[] headers = {"ID", "Knowledge Point", "Mastery", "Review Count", "Last Reviewed"};
        for (int i = 0; i < headers.length; i++) {
            header.createCell(i).setCellValue(headers[i]);
        }

        List<UserProgress> progress = userProgressRepository.findByUserId(userId);
        for (int i = 0; i < progress.size(); i++) {
            UserProgress p = progress.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(p.getId());
            row.createCell(1).setCellValue(p.getKnowledgePointId());
            row.createCell(2).setCellValue(p.getMasteryLevel());
            row.createCell(3).setCellValue(p.getReviewCount());
            row.createCell(4).setCellValue(p.getLastReviewed() != null ? p.getLastReviewed().toString() : "");
        }
    }

    private void exportExercises(Workbook workbook, Long userId) {
        Sheet sheet = workbook.createSheet("Exercises");
        Row header = sheet.createRow(0);
        String[] headers = {"ID", "Exercise ID", "User Answer", "Is Correct", "Score"};
        for (int i = 0; i < headers.length; i++) {
            header.createCell(i).setCellValue(headers[i]);
        }

        List<UserExercise> exercises = userExerciseRepository.findByUserId(userId);
        for (int i = 0; i < exercises.size(); i++) {
            UserExercise e = exercises.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(e.getId());
            row.createCell(1).setCellValue(e.getExerciseId());
            row.createCell(2).setCellValue(e.getUserAnswer() != null ? e.getUserAnswer() : "");
            row.createCell(3).setCellValue(Boolean.TRUE.equals(e.getIsCorrect()) ? "Yes" : "No");
            row.createCell(4).setCellValue(e.getScore());
        }
    }

    private void exportRecords(Workbook workbook, Long userId) {
        Sheet sheet = workbook.createSheet("Learning Records");
        Row header = sheet.createRow(0);
        String[] headers = {"ID", "Action Type", "Result", "Duration", "Score", "Created At"};
        for (int i = 0; i < headers.length; i++) {
            header.createCell(i).setCellValue(headers[i]);
        }

        List<LearningRecord> records = learningRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (int i = 0; i < records.size(); i++) {
            LearningRecord r = records.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(r.getId());
            row.createCell(1).setCellValue(r.getActionType());
            row.createCell(2).setCellValue(r.getResult() != null ? r.getResult() : "");
            row.createCell(3).setCellValue(r.getDuration() != null ? r.getDuration() : 0);
            row.createCell(4).setCellValue(r.getScore() != null ? r.getScore() : 0);
            row.createCell(5).setCellValue(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        }
    }

    private void exportNotes(Workbook workbook, Long userId) {
        Sheet sheet = workbook.createSheet("Notes");
        Row header = sheet.createRow(0);
        String[] headers = {"ID", "Title", "Content", "Public", "Views", "Likes", "Created At"};
        for (int i = 0; i < headers.length; i++) {
            header.createCell(i).setCellValue(headers[i]);
        }

        List<Note> notes = noteRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        for (int i = 0; i < notes.size(); i++) {
            Note n = notes.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(n.getId());
            row.createCell(1).setCellValue(n.getTitle() != null ? n.getTitle() : "");
            row.createCell(2).setCellValue(n.getContent() != null ? n.getContent().substring(0, Math.min(100, n.getContent().length())) : "");
            row.createCell(3).setCellValue(Boolean.TRUE.equals(n.getIsPublic()) ? "Yes" : "No");
            row.createCell(4).setCellValue(n.getViews() != null ? n.getViews() : 0);
            row.createCell(5).setCellValue(n.getLikes() != null ? n.getLikes() : 0);
            row.createCell(6).setCellValue(n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
        }
    }

    private void exportWrongQuestions(Workbook workbook, Long userId) {
        Sheet sheet = workbook.createSheet("Wrong Questions");
        Row header = sheet.createRow(0);
        String[] headers = {"ID", "Question", "Correct Answer", "User Answer", "Mastered", "Created At"};
        for (int i = 0; i < headers.length; i++) {
            header.createCell(i).setCellValue(headers[i]);
        }

        List<WrongQuestion> questions = wrongQuestionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (int i = 0; i < questions.size(); i++) {
            WrongQuestion q = questions.get(i);
            Row row = sheet.createRow(i + 1);
            row.createCell(0).setCellValue(q.getId());
            row.createCell(1).setCellValue(q.getErrorAnalysis() != null ? q.getErrorAnalysis().substring(0, Math.min(100, q.getErrorAnalysis().length())) : "");
            row.createCell(2).setCellValue(q.getCorrectAnswer() != null ? q.getCorrectAnswer() : "");
            row.createCell(3).setCellValue(q.getUserAnswer() != null ? q.getUserAnswer() : "");
            row.createCell(4).setCellValue(Boolean.TRUE.equals(q.getMastered()) ? "Yes" : "No");
            row.createCell(5).setCellValue(q.getCreatedAt() != null ? q.getCreatedAt().toString() : "");
        }
    }

    private void exportAll(Workbook workbook, Long userId) {
        exportProgress(workbook, userId);
        exportExercises(workbook, userId);
        exportRecords(workbook, userId);
        exportNotes(workbook, userId);
        exportWrongQuestions(workbook, userId);
    }
}
