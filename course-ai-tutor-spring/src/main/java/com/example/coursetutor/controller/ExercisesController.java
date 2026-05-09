package com.example.coursetutor.controller;

import com.example.coursetutor.dto.ApiResponse;
import com.example.coursetutor.entity.*;
import com.example.coursetutor.repository.*;
import com.example.coursetutor.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExercisesController {

    private final ExerciseRepository exerciseRepository;
    private final UserExerciseRepository userExerciseRepository;
    private final ExerciseTemplateRepository exerciseTemplateRepository;

    @GetMapping("/random")
    public ApiResponse<List<Exercise>> getRandomExercises(@RequestParam(defaultValue = "10") int count) {
        if (count > 50) count = 50;
        List<Exercise> all = exerciseRepository.findAll();
        Collections.shuffle(all);
        return ApiResponse.ok(all.subList(0, Math.min(count, all.size())));
    }

    @PostMapping("/templates")
    public ApiResponse<?> createTemplate(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();

        ExerciseTemplate template = ExerciseTemplate.builder()
                .userId(userId)
                .name((String) body.get("name"))
                .difficultyDistribution((String) body.get("difficultyDistribution"))
                .questionTypeRatio((String) body.get("questionTypeRatio"))
                .knowledgePointIds((String) body.get("knowledgePointIds"))
                .questionCount(getInt(body, "questionCount", 10))
                .build();

        ExerciseTemplate saved = exerciseTemplateRepository.save(template);
        return ApiResponse.ok(Map.of("id", saved.getId()), "模板创建成功");
    }

    @GetMapping("/templates")
    public ApiResponse<List<ExerciseTemplate>> getTemplates() {
        Long userId = SecurityUtil.requireUserId();
        return ApiResponse.ok(exerciseTemplateRepository.findByUserId(userId));
    }

    @GetMapping("/templates/{id}")
    public ApiResponse<?> getTemplate(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return exerciseTemplateRepository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .map(ApiResponse::ok)
                .orElse(ApiResponse.error("模板不存在"));
    }

    @PutMapping("/templates/{id}")
    public ApiResponse<?> updateTemplate(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        return exerciseTemplateRepository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .map(t -> {
                    if (body.containsKey("name")) t.setName((String) body.get("name"));
                    if (body.containsKey("difficultyDistribution")) t.setDifficultyDistribution((String) body.get("difficultyDistribution"));
                    if (body.containsKey("questionTypeRatio")) t.setQuestionTypeRatio((String) body.get("questionTypeRatio"));
                    if (body.containsKey("knowledgePointIds")) t.setKnowledgePointIds((String) body.get("knowledgePointIds"));
                    if (body.containsKey("questionCount")) t.setQuestionCount((Integer) body.get("questionCount"));
                    exerciseTemplateRepository.save(t);
                    return ApiResponse.ok("模板更新成功");
                })
                .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    @DeleteMapping("/templates/{id}")
    public ApiResponse<?> deleteTemplate(@PathVariable Long id) {
        Long userId = SecurityUtil.requireUserId();
        return exerciseTemplateRepository.findById(id)
                .filter(t -> t.getUserId().equals(userId))
                .map(t -> {
                    exerciseTemplateRepository.delete(t);
                    return ApiResponse.ok("模板已删除");
                })
                .orElse(ApiResponse.error("模板不存在或无权限"));
    }

    @PostMapping("/generate-from-template")
    public ApiResponse<?> generateFromTemplate(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        Long templateId = getLong(body, "templateId");
        // Simplified: return exercises based on template
        return exerciseTemplateRepository.findById(templateId)
                .filter(t -> t.getUserId().equals(userId))
                .map(template -> {
                    List<Exercise> exercises = exerciseRepository.findAll()
                            .subList(0, Math.min(template.getQuestionCount(), exerciseRepository.findAll().size()));
                    return ApiResponse.ok(Map.of("exercises", exercises, "template", template));
                })
                .orElse(ApiResponse.error("模板不存在"));
    }

    @PostMapping("/submit")
    public ApiResponse<?> submitExercise(@RequestBody Map<String, Object> body) {
        Long userId = SecurityUtil.requireUserId();
        Long exerciseId = getLong(body, "exerciseId");
        String userAnswer = (String) body.get("userAnswer");

        return exerciseRepository.findById(exerciseId).map(exercise -> {
            boolean isCorrect = exercise.getAnswer().equalsIgnoreCase(userAnswer);
            double score = isCorrect ? 100.0 : 0.0;

            UserExercise ue = UserExercise.builder()
                    .userId(userId)
                    .exerciseId(exerciseId)
                    .userAnswer(userAnswer)
                    .isCorrect(isCorrect)
                    .score(score)
                    .build();
            userExerciseRepository.save(ue);

            return ApiResponse.ok(Map.of(
                    "isCorrect", isCorrect,
                    "score", score,
                    "correctAnswer", exercise.getAnswer(),
                    "explanation", exercise.getExplanation()
            ));
        }).orElse(ApiResponse.error("题目不存在"));
    }

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).longValue() : null;
    }

    private Integer getInt(Map<String, Object> map, String key, int defaultValue) {
        Object val = map.get(key);
        return val instanceof Number ? ((Number) val).intValue() : defaultValue;
    }
}
