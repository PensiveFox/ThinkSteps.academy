# Инструкция по настройке и запуску проекта

## Текущий статус

✅ Проект настроен и готов к запуску!

- ✅ Зависимости установлены (`node_modules`)
- ✅ База данных настроена (PostgreSQL)
- ✅ Миграции применены (4 миграции)
- ✅ Seed данные загружены
- ✅ GraphQL домен Challenge реализован

## Быстрый старт

### 1. Запуск dev-сервера (без n8n)

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`
GraphQL API доступен на `http://localhost:4000/api`

### 2. Запуск dev-сервера (с n8n)

```bash
npm run dev:n8n
```

Требует настройки переменных окружения для n8n:
- `N8N_ENCRYPTION_KEY` - ключ шифрования (обязательно)
- `SUDO_PASSWORD` - пароль для admin пользователя (для seed)

### 3. Проверка работы Challenge API

После запуска сервера можно проверить GraphQL API:

**GraphQL Playground:** `http://localhost:4000/api`

**Пример запроса:**
```graphql
query {
  challenges(where: { isPublished: true }) {
    id
    name
    challengeType
    difficulty
    description
  }
}
```

**Открыть страницу задания:**
`http://localhost:3000/challenges/[challenge-id]`

## Полезные команды

### Prisma

```bash
# Статус миграций
npm run prisma:migrate:status

# Создать новую миграцию
npm run prisma:migrate:create

# Применить миграции (production)
npm run prisma:deploy

# Заполнить БД seed данными
npm run prisma:seed

# Открыть Prisma Studio (GUI для БД)
npm run prisma:studio

# Сгенерировать Prisma Client
npm run generate:prisma
```

### GraphQL

```bash
# Сгенерировать GraphQL типы и хуки
npm run generate:types

# Сгенерировать всё (Prisma + GraphQL)
npm run generate
```

### Разработка

```bash
# Проверка типов TypeScript
npm run types

# Проверка типов в watch режиме
npm run types:watch

# Линтинг
npm run lint

# Форматирование кода
npm run format
```

## Структура проекта

```
/agent
├── server/
│   ├── schema/types/Challenge/    # GraphQL типы для Challenge
│   │   ├── enums.ts               # Enum'ы (Subject, DifficultyLevel, etc)
│   │   ├── inputs.ts              # Input типы
│   │   ├── index.ts               # Object типы
│   │   └── resolvers/             # Query/Mutation резолверы
│   │       ├── challenge.ts       # query challenge(id)
│   │       ├── challenges.ts      # query challenges(where, orderBy)
│   │       ├── startChallenge.ts  # mutation startChallenge
│   │       └── submitChallengeStep.ts # mutation submitChallengeStep
│   └── validators/
│       ├── validateStep.ts        # Dispatcher валидации
│       └── executor/
│           └── validateExecutorFindB.ts # Валидатор для executor_find_b
├── src/
│   ├── pages/challenges/[id].tsx  # UI страница задания
│   └── gql/src/Challenge.graphql  # GraphQL операции
├── prisma/
│   ├── schema.prisma              # Prisma схема
│   ├── seed.ts                    # Seed данные
│   └── migrations/                # Миграции БД
└── .env                           # Переменные окружения
```

## Реализованные фичи

### Challenge System (Vertical Slice)

✅ **Backend:**
- GraphQL типы: `Challenge`, `ChallengeStep`, `ChallengeCompletion`, `StepCompletion`
- Query: `challenge(id)`, `challenges(where, orderBy, skip, take)`
- Mutation: `startChallenge(challengeId)`, `submitChallengeStep(input)`
- Валидатор: `executor_find_b` (симуляция программы Исполнителя)

✅ **Frontend:**
- Страница задания: `/challenges/[id]`
- GraphQL хуки: `useChallengeQuery`, `useStartChallengeMutation`, `useSubmitChallengeStepMutation`
- UI для ввода ответа и отображения feedback

✅ **Database:**
- Модели: `Challenge`, `ChallengeStep`, `ChallengeCompletion`, `StepCompletion`
- Seed данные: задание "Исполнитель «Вычислитель»: найти b"

## Следующие шаги

1. **Запустить dev-сервер** и проверить работу API
2. **Открыть страницу задания** и протестировать UI
3. **Добавить больше заданий** через seed или админ-панель
4. **Реализовать дополнительные типы валидации** (CodeOutput, CodeTests, etc)

## Troubleshooting

### Ошибка подключения к БД

Проверьте `DATABASE_URL` в `.env`:
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/agent_db
```

### Ошибка "N8N_ENCRYPTION_KEY is required"

Если запускаете с n8n (`npm run dev:n8n`), добавьте в `.env`:
```bash
N8N_ENCRYPTION_KEY=$(openssl rand -hex 16)
```

### Seed не создаёт Challenge

Убедитесь, что в `.env` установлен `SUDO_PASSWORD`:
```bash
SUDO_PASSWORD=your-password
```

Затем запустите:
```bash
npm run prisma:seed
```
