# ThinkSteps.academy — План реализации

> **Цель:** Одна платформа вместо трёх (Антитренинги + CloudText + Chattern)

---

## Что берём от каждой платформы

| Источник | Плюсы, которые берём |
|----------|---------------------|
| **Антитренинги** | Курсы, модули, автоматизация продаж, платежи, рассылки |
| **CloudText** | Проверка ДЗ с комментариями, авто-баллы, детальная аналитика |
| **Chattern** | Видеосвязь, интерактивная доска, тетрадная камера |
| **Уникальное** | AI-агенты для автопроверки, единая теория, совместная работа |

---

---

## Текущее состояние (что уже есть)

### ✅ Полностью реализовано

| Модуль | Сущности | Описание |
|--------|----------|----------|
| **Пользователи** | `User`, `Token` | Авторизация, профили, статистика |
| **Менторство** | `MentorRelation` | Связь ментор ↔ ученик |
| **Challenges** | `Challenge`, `ChallengeStep` | Задания с пошаговой валидацией |
| **Прогресс** | `ChallengeCompletion`, `StepCompletion` | Попытки решения |
| **Треки** | `Track`, `TrackStage`, `TrackChallenge` | Учебные траектории |
| **Статистика** | `UserStatistics`, `Achievement` | Аналитика, достижения |
| **Медиа** | `MediaEmbed`, `MediaEmbedPlacement` | Embed видео |
| **Knowledge Base** | `KBConcept`, `KBFact`, и др. | Граф знаний агента |
| **Рефлексы** | `EXReflex`, `EXReaction` | Система обучения агента |

### ⚠️ Частично реализовано

- **Валидация заданий** — только `executor_find_b`, нужны другие типы
- **GraphQL API** — только для Challenge, нужно расширить

### ❌ Не реализовано (из EDU Core)

- Единая теория (TheoryTopic / TheoryBlock)
- Система ДЗ с проверкой (Assignment / Submission с файлами)
- Совместная доска (Board)
- Object Storage для медиа (сейчас только embed)
- Онлайн-уроки (WebRTC)
- Платежи и доступ
- Чаты и уведомления

---

## Архитектурное решение

### Принцип: эволюция, не революция

Не ломаем Challenge-систему, а **расширяем**:

```
ТЕКУЩАЯ:
Track → TrackStage → Challenge → ChallengeStep

ЦЕЛЕВАЯ (EDU Core):
Course → Module → Unit → Blocks
                    ↓
              [Challenge | Assignment | Lesson | ...]
```

**Unit** — универсальный атом обучения, который может содержать:
- `Challenge` (интерактивное задание)
- `Assignment` (ДЗ с проверкой)
- `Lesson` (урок с теорией и видео)

---

## План реализации — 4 модуля

---

### Модуль 1: Курсы + Продажи (от Антитренинги) — 4 недели

**Что реализуем:**
- Курсы → Модули → Уроки (уже есть Track → TrackStage → Challenge)
- Платежи (YooKassa, Stripe)
- Автоматический доступ после оплаты
- Email-рассылки и уведомления
- Лендинги курсов

**Новые модели:**
```prisma
model Payment {
  id         String   @id @default(cuid())
  userId     String
  amount     Int
  currency   String   @default("RUB")
  status     PaymentStatus
  provider   String   // yookassa | stripe
  externalId String?
  courseId   String?
  createdAt  DateTime @default(now())
}

model CourseAccess {
  id        String    @id @default(cuid())
  userId    String
  courseId  String
  expiresAt DateTime?
  paymentId String?
}

model EmailTemplate {
  id      String @id @default(cuid())
  name    String
  subject String
  body    String @db.Text
  trigger String // payment_success | course_started | reminder
}
```

**Задачи:**
- [ ] Интеграция YooKassa webhooks
- [ ] Модель CourseAccess + middleware проверки
- [ ] Email-сервис (Resend / Nodemailer)
- [ ] Telegram-бот для уведомлений
- [ ] UI: страница оплаты, личный кабинет

---

### Модуль 2: Проверка ДЗ + Аналитика (от CloudText) — 4 недели

**Что реализуем:**
- Приём ДЗ (текст, фото, PDF, аудио)
- Inline-комментарии к фрагментам
- Голосовые комментарии
- Авто-баллы по критериям
- Детальная статистика прогресса

**Новые модели:**
```prisma
model Assignment {
  id        String   @id @default(cuid())
  unitId    String
  title     String
  description String? @db.Text
  
  mode      AssignmentMode  // Auto | Manual | Hybrid
  rubric    Json?           // Критерии оценивания
  maxScore  Int    @default(10)
  deadline  DateTime?
  
  Submissions Submission[]
}

model Submission {
  id           String   @id @default(cuid())
  assignmentId String
  userId       String
  
  status    SubmissionStatus
  content   String?  @db.Text
  files     Json?    // [{url, type, name}]
  
  score        Int?
  feedback     String? @db.Text
  rubricScores Json?   // {criterion: score}
  
  Comments  SubmissionComment[]
  createdAt DateTime @default(now())
}

model SubmissionComment {
  id           String   @id @default(cuid())
  submissionId String
  authorId     String
  
  type      CommentType  // Text | Voice | Inline
  content   String?  @db.Text
  audioUrl  String?
  
  // Для inline-комментариев
  anchorType  String?  // text | image
  anchorStart Int?
  anchorEnd   Int?
  
  createdAt DateTime @default(now())
}

enum AssignmentMode { Auto Manual Hybrid }
enum SubmissionStatus { Draft Submitted InReview Reviewed NeedsRevision }
enum CommentType { Text Voice Inline }
```

**Задачи:**
- [ ] Upload файлов в S3 (MinIO)
- [ ] PDF/Image viewer с аннотациями
- [ ] Аудио-комментарии (запись в браузере)
- [ ] Rubric-based scoring UI
- [ ] Dashboard аналитики для преподавателя

---

### Модуль 3: Живые уроки + Доска + Камера (от Chattern) — 6 недель

**Что реализуем:**
- Видеозвонки в браузере (WebRTC)
- Интерактивная доска (рисование, текст, изображения)
- Тетрадная камера (смартфон как камера)
- Запись уроков
- Совместная работа в реальном времени

**Новые модели:**
```prisma
model LiveLesson {
  id          String   @id @default(cuid())
  unitId      String?
  title       String
  
  scheduledAt DateTime
  startedAt   DateTime?
  endedAt     DateTime?
  
  roomId      String   @unique
  recordingUrl String?
  
  Participants LessonParticipant[]
  Board        Board?
}

model LessonParticipant {
  id        String   @id @default(cuid())
  lessonId  String
  userId    String
  role      ParticipantRole  // Host | Student
  joinedAt  DateTime?
  leftAt    DateTime?
}

model Board {
  id        String   @id @default(cuid())
  lessonId  String?  @unique
  submissionId String? @unique
  
  stateJSON Json     // tldraw state
  version   Int      @default(0)
}

enum ParticipantRole { Host Student }
```

**Технологии:**
- **WebRTC SFU:** mediasoup или LiveKit
- **Доска:** tldraw (open-source, React)
- **Real-time sync:** WebSocket + Yjs (CRDT)
- **Тетрадная камера:** отдельный WebRTC stream со смартфона

**Задачи:**
- [ ] WebRTC сервер (mediasoup)
- [ ] Интеграция tldraw
- [ ] Real-time sync через WebSocket
- [ ] Запись в mp4 (FFmpeg)
- [ ] Мобильное приложение для камеры (PWA)

---

### Модуль 4: AI-агенты (уникальное) — 3 недели

**Что реализуем:**
- Универсальный API для вызова агентов
- Автопроверка ДЗ
- Подсказки ученику
- Анализ доски
- Генерация заданий

**API контракт:**
```typescript
// POST /api/agent/invoke
interface AgentRequest {
  agent_type: string;  // "homework_checker" | "hint_generator" | "board_analyzer"
  task: { id: string; prompt: string };
  input: { answer?: string; files?: string[]; boardState?: object };
  rules?: object;
  context?: object;
}

interface AgentResponse {
  status: "success" | "fail" | "partial";
  score?: number;
  feedback?: string;
  artifacts?: object;
}
```

**Точки интеграции:**
- `Submission` → автопроверка при отправке
- `ChallengeStep` → валидация ответа (уже есть)
- `Board` → анализ решения на доске
- UI → подсказки по запросу

**Задачи:**
- [ ] API endpoint `/api/agent/invoke`
- [ ] Интеграция с существующими валидаторами
- [ ] Обёртка для OpenAI / Claude
- [ ] Очередь задач (Bull/Redis)
- [ ] Логирование в EXReaction

---

## Сводка по модулям

| Модуль | Источник | Недели | Приоритет |
|--------|----------|--------|-----------|
| **1. Курсы + Продажи** | Антитренинги | 4 | 🔴 High |
| **2. Проверка ДЗ** | CloudText | 4 | 🔴 High |
| **3. Живые уроки** | Chattern | 6 | 🟡 Medium |
| **4. AI-агенты** | Уникальное | 3 | 🟡 Medium |

**Итого до полного MVP:** ~17 недель (~4 месяца)

---

## Порядок реализации (обновлённый)

> **Приоритет:** сначала для себя (работа с учениками), потом продажи

### Этап 1: Проверка ДЗ (4 недели) 🔴
1. **Модуль 2** — Assignment, Submission, комментарии

*Результат:* Приём и проверка домашних заданий как в CloudText

### Этап 2: Живые уроки (6 недель) 🟡
2. **Модуль 3** — WebRTC + доска + камера

*Результат:* Онлайн-уроки как в Chattern

### Этап 3: Интеллект (3 недели) 🟡
3. **Модуль 4** — AI-агенты

*Результат:* Автопроверка и подсказки

### Этап 4: Монетизация (4 недели) 🟢
4. **Модуль 1** — платежи и доступ к курсам

*Результат:* Продажа курсов как в Антитренинги

---

## Детальный план реализации

---

### 📦 Модуль 1: Курсы + Продажи (4 недели)

#### 1.1 База данных (Prisma)
- [ ] Добавить `enum PaymentStatus` (Pending, Processing, Completed, Failed, Refunded)
- [ ] Добавить `enum NotificationChannel` (Email, Telegram, Push)
- [ ] Добавить модель `Payment`
- [ ] Добавить модель `CourseAccess`
- [ ] Добавить модель `Notification`
- [ ] Добавить поля в `Track`: `price`, `currency`, `isForSale`
- [ ] Создать и применить миграцию

#### 1.2 Backend (GraphQL + API)
- [ ] GraphQL типы: `Payment`, `CourseAccess`, `Notification`
- [ ] Query: `myPayments`, `myCourseAccess`
- [ ] Mutation: `createPayment`, `markNotificationRead`
- [ ] REST endpoint: `POST /api/webhooks/yookassa`
- [ ] REST endpoint: `POST /api/webhooks/stripe` (опционально)
- [ ] Middleware проверки доступа к курсу

#### 1.3 Интеграции
- [ ] YooKassa SDK: создание платежа
- [ ] YooKassa Webhook: обработка статусов
- [ ] Email-сервис (Resend или Nodemailer)
- [ ] Telegram-бот для уведомлений (опционально)

#### 1.4 Frontend
- [ ] Страница оплаты курса `/courses/[id]/checkout`
- [ ] Личный кабинет: мои курсы `/dashboard`
- [ ] Компонент `PaymentButton`
- [ ] Компонент `CourseAccessBadge`
- [ ] Уведомления в UI

---

### 📝 Модуль 2: Проверка ДЗ (4 недели)

#### 2.1 База данных (Prisma)
- [ ] Добавить `enum AssignmentMode` (Auto, Manual, Hybrid)
- [ ] Добавить `enum SubmissionStatus` (Draft, Submitted, InReview, Reviewed, NeedsRevision)
- [ ] Добавить `enum CommentType` (Text, Voice, Inline)
- [ ] Добавить модель `Assignment`
- [ ] Добавить модель `Submission`
- [ ] Добавить модель `SubmissionComment`
- [ ] Добавить модель `FileAsset` (для S3)
- [ ] Создать и применить миграцию

#### 2.2 Backend (GraphQL + API)
- [ ] GraphQL типы: `Assignment`, `Submission`, `SubmissionComment`
- [ ] Query: `assignment(id)`, `submissions(assignmentId)`, `mySubmissions`
- [ ] Mutation: `createSubmission`, `updateSubmission`, `submitForReview`
- [ ] Mutation: `addComment`, `scoreSubmission`
- [ ] REST endpoint: `POST /api/upload` (S3 upload)
- [ ] REST endpoint: `GET /api/files/:id` (signed URL)

#### 2.3 Инфраструктура
- [ ] Настроить MinIO (dev) или S3 (prod)
- [ ] Upload сервис с presigned URLs
- [ ] Генерация thumbnails для изображений

#### 2.4 Frontend
- [ ] Страница задания `/assignments/[id]`
- [ ] Компонент `SubmissionForm` (текст + файлы)
- [ ] Компонент `FileUploader`
- [ ] Компонент `PDFViewer` с аннотациями
- [ ] Компонент `ImageAnnotator`
- [ ] Компонент `VoiceRecorder` (аудио-комментарии)
- [ ] Компонент `RubricScoring` (оценка по критериям)
- [ ] Dashboard преподавателя: список работ на проверку

---

### 🎥 Модуль 3: Живые уроки (6 недель)

#### 3.1 База данных (Prisma)
- [ ] Добавить `enum ParticipantRole` (Host, Student)
- [ ] Добавить модель `LiveLesson`
- [ ] Добавить модель `LessonParticipant`
- [ ] Добавить модель `Board`
- [ ] Создать и применить миграцию

#### 3.2 Backend
- [ ] GraphQL типы: `LiveLesson`, `LessonParticipant`, `Board`
- [ ] Query: `liveLesson(id)`, `upcomingLessons`
- [ ] Mutation: `createLiveLesson`, `joinLesson`, `leaveLesson`
- [ ] Mutation: `updateBoard`, `saveBoardState`
- [ ] WebSocket server для real-time sync

#### 3.3 WebRTC инфраструктура
- [ ] Выбор SFU: mediasoup vs LiveKit
- [ ] Настройка WebRTC сервера
- [ ] Сигнальный сервер (WebSocket)
- [ ] TURN/STUN серверы

#### 3.4 Frontend
- [ ] Страница урока `/lessons/[id]/live`
- [ ] Компонент `VideoCall` (WebRTC)
- [ ] Компонент `Whiteboard` (tldraw)
- [ ] Компонент `ParticipantsList`
- [ ] Компонент `ChatPanel`
- [ ] Компонент `ScreenShare`
- [ ] Компонент `NotebookCamera` (PWA для смартфона)

#### 3.5 Запись
- [ ] Запись видео в mp4 (FFmpeg)
- [ ] Сохранение записи в S3
- [ ] Привязка записи к уроку

---

### 🤖 Модуль 4: AI-агенты (3 недели)

#### 4.1 Backend
- [ ] REST endpoint: `POST /api/agent/invoke`
- [ ] Типы запроса/ответа (AgentRequest, AgentResponse)
- [ ] Обёртка для OpenAI API
- [ ] Обёртка для Claude API
- [ ] Очередь задач (Bull + Redis)
- [ ] Логирование в `EXReaction`

#### 4.2 Интеграции
- [ ] Интеграция с `Submission` (автопроверка при отправке)
- [ ] Интеграция с `ChallengeStep` (уже есть валидаторы)
- [ ] Интеграция с `Board` (анализ решения на доске)

#### 4.3 Frontend
- [ ] Компонент `AIHintButton` (подсказки)
- [ ] Компонент `AIFeedback` (отображение результата)
- [ ] Индикатор загрузки AI

---

## Изменения в schema.prisma

### Добавить enum'ы:
```prisma
enum PaymentStatus { Pending Processing Completed Failed Refunded }
enum NotificationChannel { Email Telegram Push }
enum AssignmentMode { Auto Manual Hybrid }
enum SubmissionStatus { Draft Submitted InReview Reviewed NeedsRevision }
enum CommentType { Text Voice Inline }
enum ParticipantRole { Host Student }
enum FileStatus { Uploaded Processing Ready Error }
```

### Добавить модели:
```
Модуль 1: Payment, CourseAccess, Notification
Модуль 2: Assignment, Submission, SubmissionComment, FileAsset
Модуль 3: LiveLesson, LessonParticipant, Board
```

### Изменить существующие:
```prisma
model Track {
  // добавить:
  price      Int?
  currency   String?  @default("RUB")
  isForSale  Boolean  @default(false)
  
  // связи:
  Accesses   CourseAccess[]
  Payments   Payment[]
}

model User {
  // добавить связи:
  Payments        Payment[]
  CourseAccesses  CourseAccess[]
  Notifications   Notification[]
  Submissions     Submission[]
  SubmissionComments SubmissionComment[]
  LessonParticipations LessonParticipant[]
  LiveLessonsCreated   LiveLesson[]
}
```

---

## Следующий шаг

Начать с **Модуля 2: Проверка ДЗ** — добавить модели Assignment, Submission, SubmissionComment, FileAsset в schema.prisma.

```bash
npm run prisma:migrate:create -- --name add_assignment_models
```
