# DEPRECATED

This Node.js backend has been **replaced** by the Spring Boot 3.2 equivalent in `../course-ai-tutor-spring`.

## Migration Status

All 27 API route groups have been migrated to Spring Boot with 1:1 compatibility:

| Route | Status | Spring Controller |
|-------|--------|------------------|
| `/api/auth` | Migrated | `AuthController` |
| `/api/learning` | Migrated | `LearningController` |
| `/api/agent` | Migrated | `AgentController` |
| `/api/admin` | Migrated | `AdminController` |
| `/api/knowledge` | Migrated | `KnowledgeController` |
| `/api/notes` | Migrated | `NotesController` |
| `/api/wrong-questions` | Migrated | `WrongQuestionsController` |
| `/api/reminders` | Migrated | `RemindersController` |
| `/api/progress` | Migrated | `ProgressController` |
| `/api/achievements` | Migrated | `AchievementController` |
| `/api/knowledge-bases` | Migrated | `KnowledgeBasesController` |
| `/api/teacher` | Migrated | `TeacherController` |
| `/api/upload` | Migrated | `UploadController` |
| `/api/speech` | Migrated | `SpeechController` |
| `/api/ocr` | Migrated | `OcrController` |
| `/api/knowledge-extract` | Migrated | `KnowledgeExtractController` |
| `/api/knowledge-advanced` | Migrated | `KnowledgeAdvancedController` |
| `/api/feedbacks` | Migrated | `FeedbacksController` |
| `/api/reviews` | Migrated | `ReviewsController` |
| `/api/notifications` | Migrated | `NotificationsController` |
| `/api/community` | Migrated | `CommunityController` |
| `/api/export` | Migrated | `ExportController` |
| `/api/exercises` | Migrated | `ExercisesController` |
| `/api/learning-paths` | Migrated | `LearningPathsController` |
| `/api/analytics` | Migrated | `AnalyticsController` |

Additional Spring-only endpoints:
- `/api/learning/history` — Learning history
- `/api/tools` — AI tool endpoints
- `/api/v2/**` — Orchestrator v2 API
- `/api/request/stream` — SSE streaming

## What to do

1. **Do not add new features to this codebase**
2. Use `../course-ai-tutor-spring` as the primary backend
3. Frontend proxy should point to `localhost:8081` (Spring default port)
4. This directory can be safely deleted once the Spring backend is verified in production

## Archive date: 2026-05-05
