# План поэтапной миграции схемы БД

## Обзор

Этот документ описывает поэтапное расширение схемы БД проекта `agent` для интеграции образовательной платформы с системой заданий из `freecode.academy` и добавлением новых типов для мультипредметной платформы (информатика, математика).

---

## Этап 0: Текущее состояние

### Agent (PostgreSQL)
- **User** - пользователи с JWT аутентификацией
- **Token** - токены авторизации
- **MindLog** - система памяти AI агента (11 типов)
- **Task** + **TaskWorkLog** - система задач
- **Knowledge Base** - граф знаний (KBConcept, KBFact, KBLabel, KBConstraint, KBConflict, etc.)
- **EXReflex** + **EXReaction** - система рефлексов и реакций

### Freecode.academy (MySQL)
- **CodeChallenge** - задания по программированию
- **CodeChallengeBlock** - блоки заданий
- **CodeChallengeCompletion** - прохождение заданий
- **LearnStrategy** + **LearnStrategyStage** - треки обучения (не показаны в выборке, но упомянуты в плане)

---

## Этап 1: Базовая структура образовательной платформы

### 1.1 Добавить enum для предметов и типов заданий

```prisma
// Предметы обучения
enum Subject {
  Informatics   // Информатика (ОГЭ)
  Mathematics   // Математика (ОГЭ)
  Physics       // Физика (будущее расширение)
  Chemistry     // Химия (будущее расширение)
}

// Типы заданий по информатике (ОГЭ)
enum InformaticsChallengeType {
  NumberSystem      // Задание 1: системы счисления
  TruthTable        // Задание 2: таблицы истинности
  ShortestPath      // Задание 3: поиск кратчайшего пути
  FileSystem        // Задание 4: файловая система
  Encoding          // Задание 5: кодирование информации
  Algorithm         // Задания 6-13: алгоритмы
  PythonCode        // Задание 14: программирование на Python
  Executor          // Задание 15: исполнители
  Spreadsheet       // Задание 16: электронные таблицы
}

// Типы заданий по математике (ОГЭ)
enum MathematicsChallengeType {
  Algebra           // Алгебраические задачи
  Geometry          // Геометрия
  Trigonometry      // Тригонометрия
  Probability       // Теория вероятностей
  Statistics        // Статистика
  GraphPlotting     // Построение графиков функций
  Equations         // Уравнения и неравенства
  Sequences         // Последовательности и прогрессии
  TextProblem       // Текстовые задачи
}

// Уровень сложности
enum DifficultyLevel {
  Beginner          // Начальный (1-2 балла)
  Elementary        // Базовый (3-4 балла)
  Intermediate      // Средний (5-6 баллов)
  Advanced          // Продвинутый (7-8 баллов)
  Expert            // Экспертный (9-10 баллов)
}

// Статус прохождения задания
enum ChallengeCompletionStatus {
  NotStarted        // Не начато
  InProgress        // В процессе
  Completed         // Завершено успешно
  Failed            // Провалено
  Abandoned         // Заброшено
}
```

### 1.2 Создать модель Challenge (универсальное задание)

```prisma
model Challenge {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  
  // Базовая информация
  name            String   @db.VarChar(500)
  description     String?  @db.Text
  instructions    String?  @db.Text
  
  // Предмет и тип
  subject         Subject
  // Тип задания хранится как строка для гибкости
  // Для информатики: значения из InformaticsChallengeType
  // Для математики: значения из MathematicsChallengeType
  challengeType   String   @db.VarChar(100)
  
  // Сложность
  difficulty      DifficultyLevel @default(Elementary)
  estimatedTime   Int?     // Примерное время выполнения (минуты)
  maxScore        Int      @default(10) // Максимальный балл
  
  // Контент задания (JSON для гибкости под разные типы)
  content         Json?    // Специфичный контент под тип задания
  seed            Json?    // Стартовое состояние (для интерактивных заданий)
  solution        Json?    // Эталонное решение
  hints           Json?    // Подсказки (массив объектов с уровнями)
  
  // Метаданные
  tags            String[] // Теги для поиска
  isPublished     Boolean  @default(false)
  isOfficial      Boolean  @default(false) // Официальное задание ФИПИ
  externalId      String?  @db.VarChar(100) // ID из внешней системы (ФИПИ)
  
  // Пошаговая проверка
  steps           ChallengeStep[]
  
  // Автор
  createdById     String   @db.VarChar(36)
  CreatedBy       User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  
  // Связи
  Completions     ChallengeCompletion[]
  TrackChallenges TrackChallenge[]
  
  @@index([subject])
  @@index([challengeType])
  @@index([difficulty])
  @@index([isPublished])
  @@index([createdById])
}
```

### 1.3 Создать модель ChallengeStep (пошаговая проверка)

```prisma
model ChallengeStep {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  
  order           Int      // Порядковый номер шага
  title           String   @db.VarChar(500)
  description     String   @db.Text
  
  // Проверка шага
  validation      Json     // Правила проверки (зависят от типа задания)
  maxScore        Int      @default(1) // Максимальный балл за шаг
  
  // Подсказки для этого шага
  hints           Json?    // Массив подсказок разного уровня
  
  challengeId     String   @db.VarChar(36)
  Challenge       Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  
  StepCompletions StepCompletion[]
  
  @@unique([challengeId, order])
  @@index([challengeId])
}
```

### 1.4 Создать модель ChallengeCompletion (прохождение задания)

```prisma
model ChallengeCompletion {
  id              String                    @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime                  @default(now()) @db.Timestamp(3)
  updatedAt       DateTime                  @default(now()) @updatedAt @db.Timestamp(3)
  startedAt       DateTime                  @default(now()) @db.Timestamp(3)
  completedAt     DateTime?                 @db.Timestamp(3)
  
  // Статус
  status          ChallengeCompletionStatus @default(InProgress)
  
  // Решение пользователя
  solution        Json?    // Финальное решение
  attempts        Int      @default(0) // Количество попыток
  
  // Прогресс по шагам
  currentStep     Int      @default(0) // Текущий шаг (0 = не начато)
  
  // Баллы
  score           Int      @default(0) // Набранные баллы
  maxScore        Int      // Максимально возможные баллы
  
  // Время
  timeSpent       Int?     // Время в секундах
  
  // Использованные подсказки
  hintsUsed       Json?    // Массив использованных подсказок
  
  challengeId     String   @db.VarChar(36)
  Challenge       Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  
  userId          String   @db.VarChar(36)
  User            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  StepCompletions StepCompletion[]
  
  @@unique([challengeId, userId]) // Один пользователь - одно прохождение
  @@index([challengeId])
  @@index([userId])
  @@index([status])
}
```

### 1.5 Создать модель StepCompletion (прохождение шага)

```prisma
model StepCompletion {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  
  // Ответ пользователя
  answer          Json     // Ответ на этот шаг
  isCorrect       Boolean  @default(false)
  score           Int      @default(0) // Баллы за шаг
  
  // Попытки
  attempts        Int      @default(1)
  
  // Обратная связь
  feedback        String?  @db.Text // Автоматическая обратная связь
  
  stepId          String   @db.VarChar(36)
  Step            ChallengeStep @relation(fields: [stepId], references: [id], onDelete: Cascade)
  
  completionId    String   @db.VarChar(36)
  Completion      ChallengeCompletion @relation(fields: [completionId], references: [id], onDelete: Cascade)
  
  @@index([stepId])
  @@index([completionId])
}
```

---

## Этап 2: Система треков обучения

### 2.1 Создать модель Track (трек обучения)

```prisma
model Track {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  
  // Базовая информация
  name            String   @db.VarChar(500)
  description     String?  @db.Text
  subject         Subject  // Предмет трека
  
  // Метаданные
  order           Int      // Порядок отображения
  isPublished     Boolean  @default(false)
  estimatedHours  Int?     // Примерное время прохождения (часы)
  
  // Автор
  createdById     String   @db.VarChar(36)
  CreatedBy       User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  
  // Связи
  Stages          TrackStage[]
  UserTracks      UserTrack[]
  
  @@index([subject])
  @@index([isPublished])
  @@index([createdById])
}
```

### 2.2 Создать модель TrackStage (этап трека)

```prisma
model TrackStage {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  
  name            String   @db.VarChar(500)
  description     String?  @db.Text
  order           Int      // Порядок в треке
  
  trackId         String   @db.VarChar(36)
  Track           Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  
  Challenges      TrackChallenge[]
  
  @@unique([trackId, order])
  @@index([trackId])
}
```

### 2.3 Создать модель TrackChallenge (задание в этапе)

```prisma
model TrackChallenge {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  
  order           Int      // Порядок в этапе
  isRequired      Boolean  @default(true) // Обязательное или опциональное
  
  stageId         String   @db.VarChar(36)
  Stage           TrackStage @relation(fields: [stageId], references: [id], onDelete: Cascade)
  
  challengeId     String   @db.VarChar(36)
  Challenge       Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  
  @@unique([stageId, challengeId])
  @@index([stageId])
  @@index([challengeId])
}
```

### 2.4 Создать модель UserTrack (прогресс пользователя по треку)

```prisma
model UserTrack {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  startedAt       DateTime @default(now()) @db.Timestamp(3)
  completedAt     DateTime? @db.Timestamp(3)
  
  // Прогресс
  currentStage    Int      @default(0) // Текущий этап
  progress        Float    @default(0) // Прогресс 0-100%
  
  trackId         String   @db.VarChar(36)
  Track           Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  
  userId          String   @db.VarChar(36)
  User            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([trackId, userId])
  @@index([trackId])
  @@index([userId])
}
```

---

## Этап 3: Расширение модели User

### 3.1 Добавить поля для образовательного прогресса

```prisma
model User {
  // ... существующие поля
  
  // === ОБРАЗОВАТЕЛЬНЫЙ ПРОГРЕСС ===
  
  // Информатика (ОГЭ)
  informaticsLevel    Int?     @default(0)  // Уровень 0-100
  informaticsRating   Int?     @default(0)  // Рейтинг
  informaticsScore    Int?     @default(0)  // Общий балл
  
  // Математика (ОГЭ)
  mathematicsLevel    Int?     @default(0)  // Уровень 0-100
  mathematicsRating   Int?     @default(0)  // Рейтинг
  mathematicsScore    Int?     @default(0)  // Общий балл
  
  // Общая статистика
  totalChallenges     Int      @default(0)  // Всего заданий пройдено
  totalScore          Int      @default(0)  // Общий балл
  streak              Int      @default(0)  // Серия дней подряд
  lastActivityAt      DateTime? @db.Timestamp(3)
  
  // Связи с образовательной системой
  ChallengesCreated   Challenge[]
  ChallengeCompletions ChallengeCompletion[]
  TracksCreated       Track[]
  UserTracks          UserTrack[]
  
  // ... остальные существующие связи
}
```

---

## Этап 4: Интеграция с AI Agent

### 4.1 Добавить новые типы MindLog для образования

```prisma
enum MindLogType {
  // ... существующие типы
  
  // === ОБРАЗОВАТЕЛЬНЫЕ ТИПЫ ===
  
  // Начало работы над заданием
  ChallengeStarted
  
  // Прогресс по заданию (промежуточные результаты)
  ChallengeProgress
  
  // Завершение задания
  ChallengeCompleted
  
  // Запрос подсказки
  HintRequested
  
  // Ошибка в решении
  SolutionError
  
  // Достижение (milestone)
  Achievement
}
```

### 4.2 Создать модель Achievement (достижения)

```prisma
enum AchievementType {
  FirstChallenge    // Первое задание
  FirstPerfect      // Первое идеальное решение
  Streak7           // 7 дней подряд
  Streak30          // 30 дней подряд
  Master10          // 10 заданий одного типа
  SpeedRunner       // Быстрое решение
  NoHints           // Без подсказок
  Helper            // Помощь другим
}

model Achievement {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  
  type            AchievementType
  name            String   @db.VarChar(500)
  description     String?  @db.Text
  icon            String?  @db.VarChar(100) // Emoji или URL иконки
  
  UserAchievements UserAchievement[]
}

model UserAchievement {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  
  achievementId   String   @db.VarChar(36)
  Achievement     Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  
  userId          String   @db.VarChar(36)
  User            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([achievementId, userId])
  @@index([achievementId])
  @@index([userId])
}
```

---

## Этап 5: Система менторства и коллаборации

### 5.1 Создать модель MentorRelation (связь ментор-ученик)

```prisma
enum MentorRelationStatus {
  Pending       // Ожидает подтверждения
  Active        // Активная
  Paused        // На паузе
  Completed     // Завершена
}

model MentorRelation {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  
  status          MentorRelationStatus @default(Pending)
  
  // Предмет менторства
  subject         Subject
  
  // Заметки
  notes           String?  @db.Text
  
  mentorId        String   @db.VarChar(36)
  Mentor          User     @relation("MentorRelations", fields: [mentorId], references: [id], onDelete: Cascade)
  
  studentId       String   @db.VarChar(36)
  Student         User     @relation("StudentRelations", fields: [studentId], references: [id], onDelete: Cascade)
  
  @@unique([mentorId, studentId, subject])
  @@index([mentorId])
  @@index([studentId])
}
```

### 5.2 Обновить модель User для менторства

```prisma
model User {
  // ... существующие поля
  
  // Менторство
  isMentor            Boolean  @default(false)
  mentorSubjects      String[] // Предметы, по которым может менторить
  
  MentorRelations     MentorRelation[] @relation("MentorRelations")
  StudentRelations    MentorRelation[] @relation("StudentRelations")
  UserAchievements    UserAchievement[]
  
  // ... остальные поля
}
```

---

## Этап 6: Аналитика и статистика

### 6.1 Создать модель UserStatistics (детальная статистика)

```prisma
model UserStatistics {
  id              String   @id @default(cuid()) @db.VarChar(36)
  createdAt       DateTime @default(now()) @db.Timestamp(3)
  updatedAt       DateTime @default(now()) @updatedAt @db.Timestamp(3)
  
  // Период статистики
  date            DateTime @db.Date
  
  // Предмет
  subject         Subject
  
  // Метрики
  challengesStarted   Int @default(0)
  challengesCompleted Int @default(0)
  totalScore          Int @default(0)
  timeSpent           Int @default(0) // Секунды
  hintsUsed           Int @default(0)
  averageAttempts     Float @default(0)
  
  userId          String   @db.VarChar(36)
  User            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, date, subject])
  @@index([userId])
  @@index([date])
}
```

### 6.2 Обновить модель User для статистики

```prisma
model User {
  // ... существующие поля
  
  Statistics      UserStatistics[]
  
  // ... остальные поля
}
```

---

## Этап 7: Миграции Prisma

### 7.1 Порядок применения миграций

1. **Миграция 1**: Базовые enum и Challenge модели
   ```bash
   npm run prisma:migrate:create --name add_challenge_system
   ```

2. **Миграция 2**: Треки и этапы
   ```bash
   npm run prisma:migrate:create --name add_track_system
   ```

3. **Миграция 3**: Расширение User модели
   ```bash
   npm run prisma:migrate:create --name extend_user_education
   ```

4. **Миграция 4**: Достижения и менторство
   ```bash
   npm run prisma:migrate:create --name add_achievements_mentorship
   ```

5. **Миграция 5**: Аналитика
   ```bash
   npm run prisma:migrate:create --name add_analytics
   ```

### 7.2 Команды для применения

```bash
# Форматирование схемы
npm run prisma:format

# Создание миграции
npm run prisma:migrate:create --name migration_name

# Применение миграций
npm run prisma:deploy

# Генерация Prisma Client
npm run generate:prisma

# Генерация TypeScript типов для Pothos
npm run generate:types
```

---

## Этап 8: Seed данные

### 8.1 Создать seed файлы

```
/agent/prisma/seeds/
├── challenges/
│   ├── informatics/
│   │   ├── 01-number-systems.ts
│   │   ├── 02-truth-tables.ts
│   │   ├── 03-shortest-path.ts
│   │   ├── 04-file-system.ts
│   │   ├── 05-encoding.ts
│   │   ├── 06-13-algorithms.ts
│   │   ├── 14-python-code.ts
│   │   └── 15-executors.ts
│   └── mathematics/
│       ├── algebra.ts
│       ├── geometry.ts
│       ├── trigonometry.ts
│       └── probability.ts
├── tracks/
│   ├── informatics-basic.ts
│   ├── informatics-advanced.ts
│   ├── mathematics-basic.ts
│   └── mathematics-advanced.ts
└── achievements.ts
```

### 8.2 Обновить главный seed файл

```typescript
// /agent/prisma/seed.ts
import { seedInformaticsChallenges } from './seeds/challenges/informatics';
import { seedMathematicsChallenges } from './seeds/challenges/mathematics';
import { seedTracks } from './seeds/tracks';
import { seedAchievements } from './seeds/achievements';

async function main() {
  console.log('🌱 Seeding database...');
  
  // Достижения
  await seedAchievements(prisma);
  
  // Задания по информатике
  await seedInformaticsChallenges(prisma);
  
  // Задания по математике
  await seedMathematicsChallenges(prisma);
  
  // Треки обучения
  await seedTracks(prisma);
  
  console.log('✅ Seeding completed!');
}
```

---

## Этап 9: Совместимость с существующими системами

### 9.1 Интеграция с Knowledge Base

- Факты о прогрессе пользователя сохраняются в `KBFact`
- Концепты для тем и навыков создаются в `KBConcept`
- Решения заданий могут быть источником для `KBProposal`

### 9.2 Интеграция с MindLog

- Все действия пользователя логируются через `MindLog`
- Типы: `ChallengeStarted`, `ChallengeProgress`, `ChallengeCompleted`, `HintRequested`

### 9.3 Интеграция с EXReflex

- Создать рефлексы для автоматических подсказок
- Реакции на типичные ошибки пользователей
- Адаптивная сложность заданий

---

## Этап 10: Множественные методы решения

### 10.1 Добавить поддержку альтернативных решений

```prisma
// Режим валидации
enum ValidationMode {
  Strict          // Только один способ решения
  Flexible        // Несколько способов решения
  OpenEnded       // Любое корректное решение
  AIValidation    // Проверка через AI
}

// Тип валидации шага
enum ValidationType {
  Exact           // Точное совпадение
  Numeric         // Числовое с погрешностью
  TestCases       // Набор тестов
  Pattern         // Соответствие паттерну
  AICheck         // Проверка через AI
  PeerReview      // Проверка другими учениками
}

model Challenge {
  // ... существующие поля
  
  // Поддержка множественных решений
  validationMode  ValidationMode @default(Strict)
  allowedMethods  String[]  // ["heron", "base_height", "coordinates"]
  
  // Решения (массив с описанием каждого метода)
  solutions       Json?
}

model ChallengeStep {
  // ... существующие поля
  
  // Привязка к методу решения
  solutionMethod  String?  @db.VarChar(100) // null = общий шаг
  isOptional      Boolean  @default(false)
  validationType  ValidationType @default(Exact)
  
  // Альтернативные варианты для этого шага
  alternativeSteps Json?
}

model ChallengeCompletion {
  // ... существующие поля
  
  // Выбранный метод решения
  selectedMethod  String?  @db.VarChar(100)
}
```

### 10.2 Примеры структуры для разных типов заданий

#### Пример 1: Геометрия - несколько формул

```json
{
  "challenge": {
    "name": "Площадь треугольника со сторонами 5, 6, 7",
    "subject": "Mathematics",
    "challengeType": "Geometry",
    "validationMode": "Flexible",
    "allowedMethods": ["heron", "base_height", "coordinates"],
    "solutions": [
      {
        "method": "heron",
        "name": "Формула Герона",
        "difficulty": "Intermediate",
        "steps": [
          {
            "order": 1,
            "title": "Вычислите полупериметр",
            "validation": {
              "type": "Numeric",
              "expected": 9,
              "tolerance": 0.01
            }
          },
          {
            "order": 2,
            "title": "Примените формулу Герона",
            "validation": {
              "type": "Numeric",
              "expected": 14.7,
              "tolerance": 0.1
            }
          }
        ]
      },
      {
        "method": "base_height",
        "name": "Через основание и высоту",
        "difficulty": "Elementary",
        "steps": [
          {
            "order": 1,
            "title": "Найдите высоту к основанию",
            "validation": {
              "type": "Numeric",
              "expected": 4.9,
              "tolerance": 0.1
            }
          },
          {
            "order": 2,
            "title": "Вычислите площадь S = (a × h) / 2",
            "validation": {
              "type": "Numeric",
              "expected": 14.7,
              "tolerance": 0.1
            }
          }
        ]
      }
    ]
  }
}
```

#### Пример 2: Программирование - любой корректный код

```json
{
  "challenge": {
    "name": "Сумма элементов массива",
    "subject": "Informatics",
    "challengeType": "PythonCode",
    "validationMode": "OpenEnded",
    "content": {
      "description": "Напишите функцию sum_array(arr), которая возвращает сумму всех элементов массива",
      "template": "def sum_array(arr):\n    # Ваш код здесь\n    pass"
    },
    "validation": {
      "type": "TestCases",
      "tests": [
        { "input": [[1, 2, 3]], "expected": 6 },
        { "input": [[5, 5]], "expected": 10 },
        { "input": [[]], "expected": 0 },
        { "input": [[-1, 1, -2, 2]], "expected": 0 },
        { "input": [[100]], "expected": 100 }
      ]
    }
  }
}
```

#### Пример 3: Творческое задание - AI валидация

```json
{
  "challenge": {
    "name": "Объясните принцип работы интернета",
    "subject": "Informatics",
    "challengeType": "Theory",
    "validationMode": "AIValidation",
    "steps": [
      {
        "order": 1,
        "title": "Опишите роль протоколов",
        "validationType": "AICheck",
        "validation": {
          "criteria": [
            "Упоминает TCP/IP",
            "Объясняет передачу пакетов",
            "Описывает маршрутизацию"
          ],
          "minCriteriaMet": 2,
          "aiPrompt": "Оцени ответ ученика о протоколах интернета. Проверь наличие ключевых концепций."
        }
      }
    ]
  }
}
```

### 10.3 Валидатор с поддержкой множественных методов

```typescript
// /agent/server/validators/ChallengeValidator.ts

export class ChallengeValidator {
  async validateStep(
    challenge: Challenge,
    step: ChallengeStep,
    userAnswer: any,
    selectedMethod?: string
  ): Promise<ValidationResult> {
    
    // Проверка метода решения
    if (selectedMethod && step.solutionMethod) {
      if (step.solutionMethod !== selectedMethod) {
        return { skip: true }; // Этот шаг не для выбранного метода
      }
    }
    
    // Выбор типа валидации
    switch (step.validationType) {
      case 'Exact':
        return this.validateExact(step, userAnswer);
      
      case 'Numeric':
        return this.validateNumeric(step, userAnswer);
      
      case 'TestCases':
        return this.validateTestCases(step, userAnswer);
      
      case 'Pattern':
        return this.validatePattern(step, userAnswer);
      
      case 'AICheck':
        return this.validateWithAI(step, userAnswer);
      
      default:
        return this.validateDefault(step, userAnswer);
    }
  }
  
  private validateNumeric(
    step: ChallengeStep,
    userAnswer: number
  ): ValidationResult {
    const { expected, tolerance } = step.validation;
    const isValid = Math.abs(userAnswer - expected) <= tolerance;
    
    return {
      isValid,
      score: isValid ? step.maxScore : 0,
      feedback: isValid 
        ? '✓ Правильно!' 
        : `Ожидалось ${expected} ± ${tolerance}, получено ${userAnswer}`
    };
  }
  
  private async validateTestCases(
    step: ChallengeStep,
    userCode: string
  ): Promise<ValidationResult> {
    const tests = step.validation.tests;
    const results = [];
    
    for (const test of tests) {
      const result = await this.executeCode(userCode, test.input);
      results.push({
        passed: result === test.expected,
        input: test.input,
        expected: test.expected,
        actual: result
      });
    }
    
    const passedCount = results.filter(r => r.passed).length;
    const isValid = passedCount === tests.length;
    
    return {
      isValid,
      score: (passedCount / tests.length) * step.maxScore,
      feedback: this.formatTestResults(results),
      details: results
    };
  }
  
  private async validateWithAI(
    step: ChallengeStep,
    userAnswer: string
  ): Promise<ValidationResult> {
    const { criteria, minCriteriaMet, aiPrompt } = step.validation;
    
    const aiResponse = await this.aiService.evaluate({
      prompt: aiPrompt,
      answer: userAnswer,
      criteria
    });
    
    return {
      isValid: aiResponse.criteriaMet >= minCriteriaMet,
      score: (aiResponse.criteriaMet / criteria.length) * step.maxScore,
      feedback: aiResponse.feedback,
      aiAnalysis: aiResponse.analysis
    };
  }
}
```

---

## Этап 11: Расширяемость

### 11.1 Добавление новых предметов

Для добавления нового предмета (например, физики):

1. Добавить значение в `Subject` enum
2. Создать новый enum для типов заданий (например, `PhysicsChallengeType`)
3. Добавить поля в модель `User` для статистики
4. Создать seed данные для нового предмета

```prisma
enum Subject {
  Informatics
  Mathematics
  Physics       // Новый предмет
  Chemistry
}

enum PhysicsChallengeType {
  Mechanics
  Thermodynamics
  Electromagnetism
  Optics
  QuantumPhysics
}

model User {
  // ... существующие поля
  
  // Физика (ОГЭ)
  physicsLevel    Int?     @default(0)
  physicsRating   Int?     @default(0)
  physicsScore    Int?     @default(0)
}
```

### 11.2 Добавление новых типов заданий

Для добавления нового типа задания:

1. Добавить значение в соответствующий enum типов
2. Создать валидатор для нового типа
3. Создать UI компонент для редактора
4. Добавить seed примеры

### 11.3 Добавление новых типов валидации

```typescript
// Пример: валидация химических формул
class ChemicalFormulaValidator {
  validate(userFormula: string, expectedFormula: string): ValidationResult {
    const parsed = this.parseFormula(userFormula);
    const expected = this.parseFormula(expectedFormula);
    
    return {
      isValid: this.compareFormulas(parsed, expected),
      feedback: this.generateFeedback(parsed, expected)
    };
  }
}
```

---

## Этап 12: UI компоненты для редакторов

### 12.1 Структура компонентов

```
/agent/src/components/challenges/
├── editors/
│   ├── PythonEditor/           # Monaco Editor для Python
│   ├── TableEditor/            # Таблицы истинности
│   ├── GraphBuilder/           # Графы и пути
│   ├── NumberSystemConverter/  # Системы счисления
│   ├── ExecutorBuilder/        # Исполнители
│   ├── GeometryCanvas/         # Геометрические построения
│   ├── EquationEditor/         # Математические формулы (LaTeX)
│   └── SpreadsheetEditor/      # Электронные таблицы
├── validation/
│   ├── StepProgress/           # Индикатор прогресса
│   ├── HintSystem/             # Система подсказок
│   ├── StepValidation/         # Результат проверки
│   └── MethodSelector/         # Выбор метода решения
└── pages/
    ├── ChallengePage/          # Страница задания
    ├── ChallengeList/          # Список заданий
    └── TrackPage/              # Страница трека
```

### 12.2 Пример компонента выбора метода

```typescript
// /agent/src/components/challenges/validation/MethodSelector.tsx

interface Method {
  id: string;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedTime: number;
}

export const MethodSelector: React.FC<{
  methods: Method[];
  onSelect: (methodId: string) => void;
}> = ({ methods, onSelect }) => {
  return (
    <div className="method-selector">
      <h3>Выберите способ решения:</h3>
      <div className="methods-grid">
        {methods.map(method => (
          <MethodCard
            key={method.id}
            method={method}
            onClick={() => onSelect(method.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## Этап 13: Импорт данных из freecode.academy

### 13.1 Создать скрипт миграции

```typescript
// /agent/scripts/migrate-from-freecode.ts

import { PrismaClient as FreecodeClient } from '@freecode/prisma';
import { PrismaClient as AgentClient } from '@agent/prisma';

async function migrateCodeChallenges() {
  const freecode = new FreecodeClient({
    datasources: { db: { url: process.env.FREECODE_DATABASE_URL } }
  });
  
  const agent = new AgentClient();
  
  // Получить все задания из freecode.academy
  const oldChallenges = await freecode.codeChallenge.findMany({
    include: {
      CodeChallengeBlock: true,
      CodeChallengeCompletions: true
    }
  });
  
  for (const oldChallenge of oldChallenges) {
    // Конвертировать в новый формат
    const newChallenge = await agent.challenge.create({
      data: {
        name: oldChallenge.name || 'Untitled',
        description: oldChallenge.description,
        instructions: oldChallenge.instructions,
        subject: 'Informatics',
        challengeType: mapChallengeType(oldChallenge.challengeType),
        difficulty: mapDifficulty(oldChallenge.rank),
        content: {
          tests: oldChallenge.tests,
          solutions: oldChallenge.solutions,
          files: oldChallenge.files
        },
        validationMode: 'OpenEnded',
        isPublished: !oldChallenge.isPrivate,
        externalId: oldChallenge.externalKey,
        createdById: await mapUserId(oldChallenge.CreatedBy)
      }
    });
    
    console.log(`✓ Migrated: ${newChallenge.name}`);
  }
}

function mapChallengeType(oldType: number): string {
  const mapping = {
    0: 'PythonCode',
    1: 'Algorithm',
    // ... другие типы
  };
  return mapping[oldType] || 'PythonCode';
}
```

### 13.2 Команда для запуска миграции

```bash
npm run migrate:from-freecode
```

---

## Приоритеты реализации

### 🔴 Критично (Этап 1-3)
- Базовая структура Challenge
- Система прохождения заданий
- Расширение User модели
- Первая миграция

### 🟡 Важно (Этап 4-7)
- Треки обучения
- Интеграция с AI Agent
- Достижения
- Менторство
- Множественные методы решения

### 🟢 Желательно (Этап 8-13)
- Детальная аналитика
- Seed данные
- Расширенная интеграция
- UI компоненты
- Импорт из freecode.academy
- Документация

---

## Заметки

### Преимущества архитектуры
- ✅ Мультипредметность из коробки
- ✅ Гибкая структура для разных типов заданий
- ✅ Пошаговая проверка с подсказками
- ✅ Множественные методы решения
- ✅ Интеграция с AI системой
- ✅ Система достижений и геймификации
- ✅ Менторство и коллаборация
- ✅ Поддержка творческих заданий через AI

### Различия с freecode.academy
- PostgreSQL вместо MySQL
- Pothos вместо Nexus
- Мультипредметность (информатика + математика + ...)
- Интеграция с AI Agent
- Более гибкая система типов заданий
- Поддержка множественных методов решения
- AI-валидация для открытых заданий

### Совместимость
- Можно импортировать данные из freecode.academy
- Сохранена логика пошаговой проверки
- Расширена система подсказок
- Добавлена поддержка альтернативных решений

### Технологический стек
- **Backend**: Node.js, Express, Apollo Server, Pothos GraphQL
- **Database**: PostgreSQL, Prisma 6
- **Frontend**: Next.js 16, React 18, TypeScript 5.7
- **AI**: OpenRouter, n8n workflows
- **Code Execution**: Isolated sandbox для Python/JavaScript
- **Styling**: styled-components, TailwindCSS, shadcn/ui
