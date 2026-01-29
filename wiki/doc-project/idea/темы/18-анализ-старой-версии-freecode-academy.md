# Анализ старой версии проекта freecode.academy

## Общая информация о проекте

**Название:** freecode.academy  
**Версия:** 1.6.0  
**Автор:** @Fi1osof  
**Лицензия:** MIT  
**Описание:** Source project for freecode.academy

**Репозиторий:** https://github.com/freecode-academy/freecode.academy

## Технический стек

### Frontend
- **Next.js** 12.1.4 - React framework
- **React** 18.2.0 + **React DOM** 18.2.0
- **TypeScript** 5.6.2
- **styled-components** 6.0.0-rc.6 - CSS-in-JS
- **Material-UI** 1.0.0-beta.43 - UI компоненты
- **Apollo Client** 3.9.6 - GraphQL клиент
- **Monaco Editor** 0.20.0 - редактор кода (как в VS Code)
- **react-monaco-editor** 0.34.0

### Backend
- **Express** 4.17.1 - веб-сервер
- **Apollo Server** 4.12.2 - GraphQL сервер
- **Nexus** 1.3.0 - построение GraphQL схемы
- **Prisma** 4.16.2 - ORM
- **GraphQL** 16.8.1
- **graphql-ws** 5.16.2 - WebSocket для subscriptions

### Database
- **MySQL** - основная БД
- **Prisma Client** 3.15.2

### Дополнительные инструменты
- **Babel** - транспиляция JSX/JavaScript
- **@freecodecamp/loop-protect** 2.2.1 - защита от бесконечных циклов
- **OpenAI** 4.86.1 - интеграция с AI
- **JWT** (jsonwebtoken) - аутентификация
- **bcryptjs** - хеширование паролей

### Dev Tools
- **ESLint** - линтинг
- **Prettier** - форматирование
- **Jest** - тестирование
- **Storybook** 6.4.0 - UI компоненты
- **ts-node-dev** - hot reload для TypeScript

## Структура проекта

```
freecode.academy/
├── pages/                    # Next.js страницы (роутинг)
│   ├── learn/               # Обучающие страницы
│   │   ├── exercises/       # Упражнения
│   │   └── sections/        # Разделы курсов
│   ├── learnstrategies/     # Стратегии развития
│   ├── technologies/        # Технологии
│   ├── people/              # Пользователи
│   ├── projects/            # Проекты
│   ├── tasks/               # Задачи
│   └── timers/              # Таймеры
│
├── src/                     # Исходный код
│   ├── components/          # React компоненты (80 файлов)
│   ├── pages/               # Логика страниц (428 файлов)
│   │   ├── learn/
│   │   │   ├── CodeChallenge/        # Страница задания
│   │   │   │   ├── View/             # Отображение
│   │   │   │   ├── Edit/             # Редактирование
│   │   │   │   ├── hooks/            # React хуки
│   │   │   │   └── components/       # Компоненты
│   │   │   └── CodeChallengeBlocks/  # Блоки заданий
│   │   └── MainPage/
│   ├── gql/                 # GraphQL (60 файлов)
│   │   ├── src/             # GraphQL запросы
│   │   └── generated/       # Сгенерированные типы
│   ├── hooks/               # React хуки (12 файлов)
│   ├── uikit/               # UI компоненты (61 файл)
│   └── theme/               # Темы оформления
│
├── server/                  # Backend (150 файлов)
│   ├── nexus/              # GraphQL схема (109 файлов)
│   ├── graphqlServer/      # Apollo Server конфигурация
│   ├── openaiClient/       # OpenAI интеграция (20 файлов)
│   ├── prismaClient/       # Prisma клиент
│   ├── middleware/         # Express middleware
│   └── modules/            # Бизнес-логика
│
├── prisma/                 # Database
│   ├── schema.prisma       # Схема БД (82KB, 1750 строк)
│   ├── migrations/         # Миграции (27 файлов)
│   └── seed.ts             # Начальные данные
│
└── packages/               # Монорепо пакеты
    ├── @prisma-cms/react-hooks
    └── @prisma-cms/component
```

## База данных (Prisma Schema)

### Основные модели

#### User (Пользователь)
```prisma
model User {
  id                String   @id @default(cuid())
  username          String?  @unique
  email             String?  @unique
  password          String?
  fullname          String?
  image             String?
  active            Boolean?
  sudo              Boolean?
  isMentor          Boolean  @default(false)
  rating            Int      @default(0)  // Рейтинг 0-1000
  type              userType @default(Human)  // Human | AI
  
  // Связи
  CodeChallenges              CodeChallenge[]
  CodeChallengeCompletions    CodeChallengeCompletion[]
  LearnStrategies             LearnStrategy[]
  UserLearnStrategies         UserLearnStrategy[]
  // ... и много других связей
}
```

#### CodeChallenge (Задание)
```prisma
model CodeChallenge {
  id                       String    @id @default(cuid())
  externalKey              String?   @unique
  name                     String?
  description              String?   // Описание задания
  instructions             String?   // Инструкции
  challengeType            Int?      // Тип задания
  helpCategory             String?
  videoUrl                 String?   // Видео
  forumTopicId             Int?
  required                 Json?     // Требования
  files                    Json?     // Файлы с кодом
  tests                    Json?     // Тесты для проверки
  solutions                Json?     // Решения
  head                     Json?
  tail                     Json?
  challengeSeed            Json?     // Стартовый код
  
  CreatedBy                String
  User                     User      @relation(...)
  Topic                    Topic?    // Раздел курса
  
  CodeChallengeCompletions CodeChallengeCompletion[]
}
```

#### CodeChallengeBlock (Блок заданий)
```prisma
model CodeChallengeBlock {
  id                       String    @id @default(cuid())
  externalKey              String?
  name                     String?
  description              String?
  order                    Int?      // Порядок
  time                     String?   // Время на выполнение
  
  Parent                   String?   // Родительский блок
  CreatedBy                String
  
  // Иерархия блоков
  CodeChallengeBlock       CodeChallengeBlock?
  other_CodeChallengeBlock CodeChallengeBlock[]
}
```

#### CodeChallengeCompletion (Прохождение задания)
```prisma
model CodeChallengeCompletion {
  id                String         @id @default(cuid())
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  completedDate     DateTime?      // Дата завершения
  solution          String?        // Решение пользователя
  githubLink        String?
  challengeType     Int?
  challengeFiles    Json?
  
  CodeChallenge     String?
  CreatedBy         String
  
  CodeChallenge_... CodeChallenge?
  User              User
}
```

#### LearnStrategy (Стратегия развития)
```prisma
model LearnStrategy {
  id                  String    @id @default(cuid())
  name                String?
  description         String?
  intro               String?   // Введение
  content             String?   // Контент
  
  CreatedBy           String
  User                User
  
  LearnStrategyStages LearnStrategyStage[]  // Этапы
  UserLearnStrategies UserLearnStrategy[]   // Пользователи
}
```

#### LearnStrategyStage (Этап стратегии)
```prisma
model LearnStrategyStage {
  id              String         @id @default(cuid())
  name            String?
  description     String?
  order           Int?           // Порядок этапа
  
  LearnStrategy   String?
  Technology      String?        // Связь с технологией
  
  LearnStrategy_... LearnStrategy?
  Technology_...    Technology?
}

```

#### Technology (Технология)
```prisma
model Technology {
  id              String    @id @default(cuid())
  name            String    @unique
  description     String?
  contentText     String?
  site_url        String?
  
  // Часы на освоение уровней
  level1hours     Int?
  level2hours     Int?
  level3hours     Int?
  level4hours     Int?
  level5hours     Int?
  
  CreatedBy       String
  User            User
  
  TechnologyLessons   TechnologyLesson[]
  UserTechnologies    UserTechnology[]
  LearnStrategyStages LearnStrategyStage[]
}
```

#### UserTechnology (Технология пользователя)
```prisma
model UserTechnology {
  id              String      @id @default(cuid())
  level           Int?        // Уровень владения (1-5)
  Technology      String?
  CreatedBy       String
  
  Technology_...  Technology?
  User            User
}
```

### Дополнительные модели

- **Topic** - темы/разделы курсов
- **Resource** - ресурсы (статьи, видео)
- **Comment** - комментарии
- **Task** - задачи
- **Project** - проекты
- **Team** - команды
- **ChatRoom**, **ChatMessage** - чаты
- **Timer** - таймеры работы
- **Token** - токены аутентификации
- **File** - файлы
- **AiAgent** - AI агенты
- **MindLog** - логи "памяти" AI
- **Activity** - активность пользователей

## Ключевые компоненты

### CodeChallenge Page (Страница задания)

**Файл:** `src/pages/learn/CodeChallenge/index.tsx`

**Структура:**
```tsx
<CodeChallengePage>
  <DesktopLayout>
    <SidePanel>
      <ChallengeTitle />
      <ChallengeDescription 
        description={...}
        instructions={...}
      />
      <ExecuteChallengeButton />
    </SidePanel>
    
    <MainPanel>
      <MonacoEditor 
        code={challengeSeed}
        onChange={...}
      />
      <TestResults />
    </MainPanel>
  </DesktopLayout>
</CodeChallengePage>
```

### ChallengeDescription Component

**Файл:** `src/pages/learn/CodeChallenge/View/SidePanel/ChallengeDescription/index.tsx`

```tsx
export const ChallengeDescription = ({
  description,      // Описание задания
  instructions,     // Инструкции
  currentUser,
  codeChallengeCompletion,
}) => {
  return (
    <ChallengeDescriptionStyled
      blur={!!(currentUser && !codeChallengeCompletion)}
    >
      {description && <PrismFormatted text={description} />}
      {instructions && (
        <>
          <hr />
          <PrismFormatted text={instructions} />
        </>
      )}
    </ChallengeDescriptionStyled>
  )
}
```

**Особенности:**
- Использует `PrismFormatted` для подсветки синтаксиса
- Blur эффект если задание не завершено
- Разделение description и instructions

### Execute Challenge Hook

**Файл:** `src/pages/learn/CodeChallenge/hooks/useExecuteChallenge/`

**Функционал:**
- Выполнение кода пользователя
- Запуск тестов
- Проверка решения
- Защита от бесконечных циклов (`@freecodecamp/loop-protect`)
- Babel транспиляция JSX

### Monaco Editor Integration

**Используется:** `react-monaco-editor` + `monaco-editor`

**Возможности:**
- Подсветка синтаксиса
- Автодополнение
- Проверка ошибок в реальном времени
- Поддержка множества языков

## Особенности архитектуры

### 1. Монорепо структура

```json
"workspaces": [
  "packages/@prisma-cms/react-hooks",
  "packages/@prisma-cms/component"
]
```

### 2. GraphQL Code Generation

```bash
yarn generate:types  # Генерация TypeScript типов из GraphQL схемы
```

**Используется:**
- `@graphql-codegen/cli`
- `@graphql-codegen/typescript`
- `@graphql-codegen/typescript-operations`
- `@graphql-codegen/typescript-react-apollo`

### 3. Prisma Workflow

```bash
# Изменить схему
yarn prisma:format

# Применить к БД
yarn prisma:db:push

# Создать миграцию
yarn prisma:migrate:create --name migration_name

# Применить миграции
yarn prisma:deploy
```

### 4. Development Workflow

```bash
# Разработка
yarn dev  # Next.js + Express + hot reload

# Сборка
yarn build  # Next.js + TypeScript server

# Запуск
yarn start  # Production mode
```

### 5. Testing

```bash
yarn lint          # ESLint
yarn types         # TypeScript проверка
yarn test          # Jest unit tests
yarn test:api      # API тесты с реальным сервером
```

## Ключевые фичи платформы

### 1. Система заданий (CodeChallenge)

**Структура задания:**
- **description** - теоретическое описание
- **instructions** - инструкции к заданию
- **challengeSeed** - стартовый код
- **tests** - автоматические тесты
- **solutions** - эталонные решения

**Типы заданий:**
- JavaScript/React
- HTML/CSS
- TypeScript
- И другие

### 2. Стратегии развития (LearnStrategy)

**Концепция:**
- Готовые треки обучения
- Этапы (LearnStrategyStage)
- Связь с технологиями
- Пользователи выбирают стратегии

**Пример:**
```
Front-end Web Developer Junior
├── HTML
├── CSS
├── TypeScript
├── React
└── ...
```

### 3. Система прогресса

**CodeChallengeCompletion:**
- Отслеживание завершённых заданий
- Сохранение решений
- Дата завершения
- GitHub ссылки

**UserTechnology:**
- Уровень владения технологией (1-5)
- Связь с пользователем

### 4. Социальные функции

- **Comments** - комментарии к заданиям
- **ChatRooms** - чаты
- **Teams** - команды
- **Projects** - проекты пользователей
- **MentorMentee** - система менторства

### 5. AI Integration

**OpenAI Client:**
- 20 файлов интеграции
- AI агенты (AiAgent model)
- MindLog - логи "памяти" AI

### 6. Таймеры работы

**Timer model:**
- Отслеживание времени работы
- Связь с пользователем
- Аналитика продуктивности

## Что можно взять для ThinkSteps.academy

### ✅ Архитектурные решения

#### 1. Структура задания
```typescript
interface Challenge {
  description: string      // Теория
  instructions: string     // Инструкции
  seed: any               // Стартовое состояние
  tests: Test[]           // Автотесты
  solutions: Solution[]   // Эталонные решения
}
```

#### 2. Система прогресса
```typescript
interface Completion {
  userId: string
  challengeId: string
  completedDate: Date
  solution: any
  attempts: number
}
```

#### 3. Стратегии развития
```typescript
interface LearnStrategy {
  name: string
  stages: Stage[]
}

interface Stage {
  order: number
  technology: Technology
  challenges: Challenge[]
}
```

### ✅ Технические решения

#### 1. Monaco Editor
- Отличный редактор кода
- Можно адаптировать для Python заданий

#### 2. GraphQL + Prisma
- Типобезопасность
- Автогенерация типов
- Удобная работа с БД

#### 3. Next.js SSR
- SEO-friendly
- Быстрая загрузка
- API routes

#### 4. Защита от бесконечных циклов
```typescript
import loopProtect from '@freecodecamp/loop-protect'
```

### ✅ UX паттерны

#### 1. Двухпанельный layout
```
┌─────────────┬──────────────────┐
│  Теория     │  Практика        │
│  +          │  +               │
│  Инструкции │  Редактор/Ввод   │
│             │  +               │
│             │  Проверка        │
└─────────────┴──────────────────┘
```

#### 2. Blur эффект для незавершённых заданий
- Мотивирует завершить

#### 3. PrismFormatted
- Подсветка синтаксиса в описаниях

### ❌ Что НЕ подходит для ОГЭ

#### 1. Только редактор кода
- Для ОГЭ нужны разные типы интерфейсов

#### 2. Одна проверка на задание
- Нужна пошаговая проверка

#### 3. Фокус на программировании
- ОГЭ шире: таблицы, графы, логика

## Сравнение с требованиями ThinkSteps.academy

| Аспект | freecode.academy | ThinkSteps.academy (нужно) |
|--------|------------------|---------------------------|
| **Типы заданий** | Только код | Таблицы, графы, диаграммы, код |
| **Проверка** | Автотесты кода | Пошаговая проверка алгоритма |
| **Редактор** | Monaco Editor | Разные интерфейсы под тип задания |
| **Стратегии** | Технологии | Типы заданий ОГЭ |
| **Прогресс** | Завершённые задания | Прогресс по шагам |
| **Подсказки** | Нет | Умные подсказки на каждом шаге |
| **Мобильная версия** | Адаптивная | Mobile-first |
| **AI** | OpenAI интеграция | Можно использовать |

## Рекомендации по адаптации

### 1. Использовать базовую архитектуру

**Взять:**
- Next.js + TypeScript
- GraphQL + Prisma
- Структуру User/Challenge/Completion

**Адаптировать:**
- Модель Challenge под разные типы заданий ОГЭ
- Добавить пошаговую проверку

### 2. Расширить систему проверки

**Текущая (freecode.academy):**
```typescript
tests: Test[]  // Массив тестов
```

**Нужная (ThinkSteps.academy):**
```typescript
steps: Step[]  // Массив шагов
  step: {
    order: number
    checks: Check[]
    hints: Hint[]
  }
```

### 3. Создать разные типы интерфейсов

**freecode.academy:**
- MonacoEditor для всех заданий

**ThinkSteps.academy:**
- MonacoEditor для Python
- TableEditor для таблиц
- GraphBuilder для графов
- ExpressionBuilder для исполнителей

### 4. Адаптировать стратегии развития

**freecode.academy:**
```
LearnStrategy → Technology → Challenge
```

**ThinkSteps.academy:**
```
Track → TaskType → Challenge → Steps
```

## Выводы

### Сильные стороны проекта

1. ✅ **Продуманная архитектура** - монорепо, TypeScript, GraphQL
2. ✅ **Система стратегий развития** - готовые треки обучения
3. ✅ **Prisma ORM** - удобная работа с БД
4. ✅ **Monaco Editor** - профессиональный редактор кода
5. ✅ **AI интеграция** - OpenAI уже встроен
6. ✅ **Система прогресса** - отслеживание завершённых заданий

### Что нужно доработать для ОГЭ

1. 🔄 **Пошаговая проверка** - не только финальный результат
2. 🔄 **Разные типы заданий** - не только код
3. 🔄 **Умные подсказки** - на каждом шаге
4. 🔄 **Визуализация процесса** - показать ход мышления
5. 🔄 **Mobile-first UX** - оптимизация под телефоны

### Готовая база для старта

Проект freecode.academy - это **отличная база** для ThinkSteps.academy:
- Готовая инфраструктура
- Проверенные технологии
- Система пользователей и прогресса
- Можно форкнуть и адаптировать

**Следующие шаги:**
1. Форкнуть репозиторий
2. Адаптировать модели БД под ОГЭ
3. Создать компоненты для разных типов заданий
4. Реализовать пошаговую проверку
5. Добавить треки подготовки к ОГЭ

---

## Список задач для реализации ThinkSteps.academy

### Этап 1: Подготовка и изучение базы

- [ ] Форкнуть репозиторий freecode.academy
- [ ] Изучить структуру проекта и запустить локально
- [ ] Проанализировать текущую схему БД (Prisma)
- [ ] Изучить GraphQL API и типы
- [ ] Документировать ключевые компоненты для переиспользования

### Этап 2: Адаптация архитектуры под ОГЭ

#### 2.1 База данных
- [ ] Расширить модель `CodeChallenge` для разных типов заданий ОГЭ
- [ ] Создать модель `ChallengeStep` для пошаговой проверки
- [ ] Создать модель `Hint` для умных подсказок
- [ ] Создать модель `TaskType` (таблицы, графы, диаграммы, код, исполнители)
- [ ] Адаптировать `LearnStrategy` → `OGETrack` (треки подготовки к ОГЭ)
- [ ] Создать миграции для новых моделей

#### 2.2 GraphQL схема
- [ ] Обновить Nexus схему под новые модели
- [ ] Создать queries для пошаговой проверки
- [ ] Создать mutations для сохранения прогресса по шагам
- [ ] Добавить subscriptions для real-time обновлений
- [ ] Сгенерировать TypeScript типы

### Этап 3: Компоненты интерфейса

#### 3.1 Редакторы для разных типов заданий
- [ ] `MonacoEditor` - адаптировать для Python (уже есть)
- [ ] `TableEditor` - создать компонент для работы с таблицами
- [ ] `GraphBuilder` - создать компонент для построения графов
- [ ] `DiagramEditor` - создать компонент для диаграмм
- [ ] `ExpressionBuilder` - создать компонент для исполнителей
- [ ] `NumberSystemConverter` - создать компонент для систем счисления

#### 3.2 Система пошаговой проверки
- [ ] Создать компонент `StepProgress` - индикатор прогресса по шагам
- [ ] Создать компонент `StepChecker` - проверка текущего шага
- [ ] Создать компонент `HintSystem` - система умных подсказок
- [ ] Создать компонент `StepValidation` - визуализация ошибок
- [ ] Интегрировать пошаговую проверку в `CodeChallengePage`

#### 3.3 Адаптация существующих компонентов
- [ ] Переработать `ChallengeDescription` под разные типы заданий
- [ ] Адаптировать двухпанельный layout под mobile-first
- [ ] Создать адаптивную версию для планшетов и телефонов
- [ ] Добавить визуализацию процесса решения

### Этап 4: Логика проверки заданий

#### 4.1 Система валидации
- [ ] Создать `StepValidator` - базовый класс для проверки шагов
- [ ] Реализовать `PythonCodeValidator` - проверка Python кода
- [ ] Реализовать `TableValidator` - проверка таблиц истинности
- [ ] Реализовать `GraphValidator` - проверка графов
- [ ] Реализовать `AlgorithmValidator` - проверка алгоритмов исполнителей
- [ ] Реализовать `NumberSystemValidator` - проверка систем счисления

#### 4.2 Система подсказок
- [ ] Создать `HintEngine` - движок для генерации подсказок
- [ ] Реализовать контекстные подсказки на основе ошибок
- [ ] Интегрировать AI (OpenAI) для умных подсказок
- [ ] Создать систему прогрессивных подсказок (от общих к конкретным)

### Этап 5: Контент и треки ОГЭ

#### 5.1 Типы заданий ОГЭ
- [ ] Создать структуру для задания №1 (системы счисления)
- [ ] Создать структуру для задания №2 (таблицы истинности)
- [ ] Создать структуру для задания №3 (поиск кратчайшего пути)
- [ ] Создать структуру для задания №4 (файловая система)
- [ ] Создать структуру для задания №5 (кодирование)
- [ ] Создать структуру для заданий №6-13 (алгоритмы, Python)
- [ ] Создать структуру для задания №15 (исполнители)

#### 5.2 Треки подготовки
- [ ] Создать трек "Базовый уровень ОГЭ"
- [ ] Создать трек "Продвинутый уровень ОГЭ"
- [ ] Создать трек "Алгоритмы и программирование"
- [ ] Создать трек "Логика и таблицы истинности"
- [ ] Создать трек "Графы и поиск путей"

### Этап 6: AI интеграция

- [ ] Изучить существующую интеграцию OpenAI в freecode.academy
- [ ] Адаптировать `AiAgent` под задачи ОГЭ
- [ ] Создать промпты для генерации подсказок
- [ ] Реализовать AI-ассистента для объяснения решений
- [ ] Добавить AI-генерацию похожих заданий

### Этап 7: UX и визуализация

#### 7.1 Mobile-first оптимизация
- [ ] Переработать layout под вертикальную ориентацию
- [ ] Оптимизировать редакторы для сенсорных экранов
- [ ] Создать адаптивную навигацию
- [ ] Оптимизировать производительность на мобильных устройствах

#### 7.2 Визуализация процесса
- [ ] Создать компонент для визуализации хода мышления
- [ ] Добавить анимации переходов между шагами
- [ ] Создать визуализацию прогресса по треку
- [ ] Добавить награды и достижения

### Этап 8: Тестирование и отладка

- [ ] Написать unit-тесты для валидаторов
- [ ] Написать integration-тесты для API
- [ ] Написать E2E тесты для критических сценариев
- [ ] Провести тестирование на разных устройствах
- [ ] Оптимизировать производительность

### Этап 9: Деплой и запуск

- [ ] Настроить CI/CD pipeline
- [ ] Настроить production БД
- [ ] Настроить мониторинг и логирование
- [ ] Создать seed данные с примерами заданий
- [ ] Запустить beta-версию для тестирования
- [ ] Собрать обратную связь и итерировать

### Этап 10: Контент и масштабирование

- [ ] Создать минимум 10 заданий каждого типа
- [ ] Добавить видео-объяснения к сложным темам
- [ ] Создать систему рейтинга сложности заданий
- [ ] Добавить социальные функции (комментарии, обсуждения)
- [ ] Реализовать систему менторства
