# Prisma Schema Domains Overview

## 📁 Domain Files Structure
- `schema.prisma` - Main schema (generator + datasource only)
- `auth.prisma` - User, UserStatus
- `tokens.prisma` - Token, TokenType
- `mindlogs.prisma` - MindLog, MindLogType
- `tasks.prisma` - Task, TaskWorkLog, TaskStatus
- `kb.prisma` - Knowledge Base (10 models + enums)
- `ex.prisma` - EX Reflex system (EXReflex, EXReaction)
- `learning.prisma` - Challenges, Steps, Completions
- `tracks.prisma` - Tracks, Stages, TrackChallenges
- `achievements.prisma` - Achievement, UserAchievement
- `mentoring.prisma` - MentorRelation
- `statistics.prisma` - UserStatistics
- `media.prisma` - MediaEmbed, MediaEmbedPlacement
- `skills.prisma` - Skills, Challenges, Progress, Auto-assignment

## 🔗 Key Relations
- Track → TrackChallenge → Challenge (many-to-many)
- Challenge → ChallengeStep (one-to-many)
- ChallengeCompletion → StepCompletion (one-to-many)
- User ↔ All domains via relations
- **NEW:** Skill → Challenge → ChallengeStep (learning flow)
- **NEW:** SkillProgress ↔ User ↔ Skill (adaptive learning)

## 🧠 NEW: Skills Learning Engine
- **`skills.prisma`** - Adaptive learning models
  - `Skill` - Навыки с порогом мастерства + **order** для управления порядком
  - `Challenge` - Задания с уровнями сложности
  - `ChallengeStep` - Шаги заданий
  - `SkillProgress` - Прогресс пользователя (confidence, mastery)
  - `StudentChallenge` - Назначенные задания
  - `StrategyConfig` - **NEW:** Конфигурация стратегии обучения
- **`src/learning/learningEngine.ts`** - Core logic
  - `evaluateStudent()` - Авто-оценка и назначение через **стратегию**
  - `completeChallenge()` - Обновление прогресса с **reviewDelayDays**
  - `findNextSkill()` - Поиск навыков с учётом **order**
  - **NEW:** Убираем хардкод, используем JSON конфигурацию
- **`src/learning/scheduler.ts`** - Автопилот
  - Cron-задачи для авто-назначения
  - Ежедневный запуск в 3:00 + каждые 6 часов
- **`prisma/seed-skills.ts`** - **NEW:** Seed для навыков и стратегии

### 🔄 Управляемые параметры:
- **evaluationOrder** - JSON массив порядка оценки ["review", "weak", "new"]
- **minConfidence** - Порог уверенности (по умолчанию 80)
- **reviewDelayDays** - Дней до повторения (по умолчанию 3)
- **skill.order** - Порядок навыков для новых заданий

## 🛠️ NEW: Admin Control APIs
- **`src/admin/strategyAPI.ts`** - Admin функции управления
  - `getStrategy()` - GET /admin/strategy
  - `updateStrategy()` - PATCH /admin/strategy (evaluationOrder, minConfidence, reviewDelayDays)
  - `updateSkillsOrder()` - PATCH /admin/skills/order (drag & drop)
  - `getSkills()` - GET /admin/skills (для drag & drop)
  - `getEngineLogs()` - GET /admin/logs (логирование решений)
- **`src/admin/routes.ts`** - Express роуты для админки
- **`EngineLog`** - **NEW:** Модель логирования решений движка
  - `userId`, `action`, `meta` (JSON с деталями)
  - Индексы для быстрых запросов

### 🧠 Enhanced Learning Engine:
- **Защита от дублирования** - проверка активных заданий
- **Детальное логирование** - каждое решение с причиной
- **Управляемые параметры** - через админ API
- **Drag & Drop** - reorder навыков в реальном времени

## 🧠 NEW: Hierarchical Strategy Architecture

### 📊 Architecture Overview:
```
                 ┌────────────────────┐
                 │  Learning Engine   │
                 │ evaluateStudent()  │
                 └─────────┬──────────┘
                           │
               выбирает стратегию
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  Student.strategyId   Teacher.strategy   Global strategy
        │                  │                  │
        └────────────── fallback chain ───────┘
                           │
                    StrategyConfig
          (evaluationOrder, thresholds, delay)
                           │
                           ▼
                Skill → Challenge → Step
```

### 🎯 Key Features:
- **Engine всегда один** - чистое ядро без UI зависимостей
- **Стратегия = конфиг** - просто параметры, не логика
- **Иерархия выбора** - Student → Teacher → Global fallback

### 📦 Database Schema:
- **`StrategyConfig`** с `teacherId` (null = global)
- **`User.strategyId`** - прямая стратегия студента
- **`User.teacherId`** - привязка к учителю
- **Relations:** Teacher ↔ Strategies ↔ Users

### 🔄 Enhanced Learning Engine:
- `getStrategyForUser()` - иерархический выбор стратегии
- Детальное логирование с `strategyId`
- Fallback chain: Student → Teacher → Global

### 🛠️ Enhanced Admin APIs:
- `getAllStrategies()` - все стратегии с отношениями
- `createStrategy()` - создать стратегию для учителя
- `assignUserStrategy()` - назначить стратегию студенту
- `assignUserTeacher()` - назначить учителя

### 🌱 New Seed: `seed-hierarchical.ts`
- Глобальная стратегия по умолчанию
- Учитель с экспериментальной стратегией
- Студенты с разными уровнями привязки
- Демонстрация иерархии

### 🎯 Usage Examples:
```typescript
// Student 1: Teacher strategy (weak → review → new)
await evaluateStudent('student1-id') 

// Student 2: Direct strategy (custom)
await evaluateStudent('student2-id')

// New student: Global strategy (review → weak → new)
await evaluateStudent('new-student-id')
```

## 🧠 NEW: Skill State Machine

### 🎯 State Layer Architecture:
- **Confidence** - метрика "Насколько хорошо?"
- **State** - фаза "В какой фазе?"
- **Engine** - решение "Что делать дальше?"

### 📊 Skill States:
```
NEW → LEARNING → STABLE → MASTERED
      ↓         ↑
   WEAKENING ←──┘ (overdue + low confidence)
```

### 🔄 State Transitions:
- **NEW** - ещё не начинали (attempts = 0)
- **LEARNING** - в процессе (confidence < stableThreshold)
- **STABLE** - закреплено (confidence ≥ stableThreshold)
- **WEAKENING** - пора спасать (overdue && confidence < stableThreshold)
- **MASTERED** - можно почти забыть (confidence ≥ masteredThreshold)

### 🛠️ Enhanced Strategy Config:
```typescript
// State machine thresholds (управляемые с фронта)
stableThreshold: 80      // Порог стабильности
masteredThreshold: 95    // Порог мастерства
weakeningThreshold: 70   // Порог ослабления
reviewDelayDays: 3       // Дней до повторения
```

### 🧠 Enhanced Learning Engine:
- `resolveState()` - вычисляет состояние на основе стратегии
- `findWeakSkill()` - ищет LEARNING + WEAKENING состояния
- `findReviewSkill()` - ищет только WEAKENING
- State обновляется после каждого `completeChallenge()`

### 🎛️ Frontend Control:
```typescript
// Управление порогами состояний
await patch('/admin/strategy', {
  stableThreshold: 75,      // Снизить порог стабильности
  masteredThreshold: 90,    // Снизить порог мастерства
  weakeningThreshold: 65,   // Более раннее обнаружение
  reviewDelayDays: 5        // Увеличить интервал
})
```

### 🔥 Benefits:
- **Smart decisions** - движок понимает фазы, не только цифры
- **Configurable** - пороги настраиваются без кода
- **Predictable** - чёткая логика переходов
- **Extensible** - можно добавить decay, forgetting curve

## ✅ Status
- Schema split: Complete
- Prisma format: ✅
- Prisma generate: ✅
- Schema folder mode: Active
- Skills Learning Engine: ✅ Enhanced with configurable strategy
- **Next:** Run migrations and seed

### 🚀 Quick Start Commands:
```bash
# Apply new migrations
npx prisma migrate dev --name add_skill_order
npx prisma migrate dev --name add_strategy_config

# Seed skills and strategy
npx ts-node prisma/seed-skills.ts

# Test the learning engine
# import { evaluateStudent } from './src/learning/learningEngine'
# await evaluateStudent('user-id')
```

## 🔄 Migration & Deployment

### 📋 Migration Checklist:
- [x] Schema split into domain files
- [x] Combined schema generated
- [x] Relations fixed and validated
- [x] Prisma client generated
- [ ] Run database migrations
- [ ] Seed initial data
- [ ] Test learning engine
- [ ] Deploy to production

### 🚀 Production Deployment:
```bash
# Backup current database
pg_dump thinksteps_db > backup_$(date +%Y%m%d).sql

# Apply migrations
npx prisma migrate deploy

# Generate production client
npx prisma generate

# Seed production data (if needed)
npx ts-node prisma/seed-production.ts
```

## 🧪 Testing & Validation

### 📊 Test Scenarios:
1. **Basic Learning Flow**
   - Create user → evaluateStudent → assign challenge → complete → update progress
   
2. **Strategy Hierarchy**
   - Global strategy → Teacher strategy → Student strategy fallback
   
3. **State Machine**
   - NEW → LEARNING → STABLE → WEAKENING → MASTERED transitions
   
4. **Admin Controls**
   - Update strategy thresholds → reorder skills → assign teachers

### 🔍 Validation Commands:
```typescript
// Test state transitions
import { completeChallenge, evaluateStudent } from './src/learning/learningEngine'

// Test learning flow
const userId = 'test-user'
await evaluateStudent(userId)
await completeChallenge(userId, 'skill-1', true)
await evaluateStudent(userId) // Should assign next challenge

// Test strategy hierarchy
const strategies = await getAllStrategies()
console.log('Strategy hierarchy:', strategies)
```

## 📈 Monitoring & Analytics

### 📊 Key Metrics:
- **Challenge completion rate** - % of assigned challenges completed
- **Skill progression speed** - time from NEW → MASTERED
- **State distribution** - how many users in each state
- **Strategy effectiveness** - compare different strategies

### 🔍 Monitoring Queries:
```sql
-- Challenge completion rate
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as completion_rate,
  DATE_TRUNC('day', assigned_at) as date
FROM StudentChallenge 
GROUP BY DATE_TRUNC('day', assigned_at);

-- State distribution
SELECT 
  state,
  COUNT(*) as users_count,
  AVG(confidence) as avg_confidence
FROM SkillProgress 
GROUP BY state;

-- Strategy effectiveness
SELECT 
  s.name as strategy_name,
  COUNT(sc.id) as challenges_assigned,
  COUNT(CASE WHEN sc.status = 'completed' THEN 1 END) as challenges_completed,
  AVG(sp.confidence) as avg_confidence
FROM StrategyConfig s
LEFT JOIN User u ON u.strategyId = s.id OR (u.teacherId = s.teacherId AND u.strategyId IS NULL)
LEFT JOIN StudentChallenge sc ON sc.userId = u.id
LEFT JOIN SkillProgress sp ON sp.userId = u.id
GROUP BY s.id, s.name;
```

## 🛠️ Troubleshooting

### 🔧 Common Issues:

#### 1. Prisma Client Errors
```bash
# Regenerate client
npx prisma generate

# Check schema validity
npx prisma validate

# Format schema
npx prisma format
```

#### 2. Migration Conflicts
```bash
# Reset and re-migrate (development only)
npx prisma migrate reset --force
npx prisma migrate dev --name initial_setup
```

#### 3. Learning Engine Not Working
```typescript
// Check strategy exists
const strategy = await getStrategyForUser(userId)
if (!strategy) {
  console.log('No strategy found for user:', userId)
}

// Check engine logs
const logs = await prisma.engineLog.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 10
})
```

## 📚 API Documentation

### 🔗 Learning Engine Endpoints:

#### POST /api/learning/evaluate
```typescript
// Evaluate student and assign next challenge
{
  "userId": "string"
}
```

#### POST /api/learning/complete
```typescript
// Complete challenge and update progress
{
  "userId": "string",
  "skillId": "string", 
  "isCorrect": "boolean"
}
```

#### GET /api/learning/progress/:userId
```typescript
// Get user's current progress
{
  "skillProgress": [...],
  "activeChallenges": [...],
  "recommendations": [...]
}
```

### 🔗 Admin Endpoints:

#### GET /api/admin/strategy
- Get all strategies with hierarchy

#### PATCH /api/admin/strategy/:id
- Update strategy configuration

#### PATCH /api/admin/skills/order
- Reorder skills

#### POST /api/admin/users/:userId/teacher
- Assign teacher to user

## 🎯 Future Enhancements

### 🚀 Planned Features:
1. **Adaptive difficulty** - Dynamic challenge difficulty based on performance
2. **Forgetting curve** - Time-based confidence decay
3. **Peer learning** - Student collaboration features
4. **Analytics dashboard** - Real-time learning analytics
5. **Mobile app** - Native mobile learning experience

### 🔮 Research Areas:
- Spaced repetition algorithms
- Machine learning for personalization
- Gamification elements
- Social learning mechanics

---

## 📞 Support & Contact

### 🆘 Getting Help:
- Check troubleshooting section above
- Review engine logs for debugging
- Test with sample data first
- Monitor database performance

### 📝 Contributing:
- Follow domain-driven design principles
- Add comprehensive tests
- Update documentation
- Use TypeScript strict mode

---

*Last updated: $(date)*
*Schema version: v2.0 with Skills Learning Engine*
