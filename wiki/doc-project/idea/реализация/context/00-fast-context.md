# Быстрый контекст по реализации заданий (вертикальный срез)

Цель этого файла: хранить краткую карту проекта и найденные точки входа, чтобы не перечитывать весь репозиторий каждый раз.

## 1) Где что лежит в коде (/agent)

### Prisma (БД)

- `agent/prisma/schema.prisma`
  - есть модели системы заданий:
    - `Challenge`
    - `ChallengeStep`
    - `ChallengeCompletion`
    - `StepCompletion`
  - важные поля:
    - `Challenge.challengeType: String`, `Challenge.subject: Subject`, `Challenge.content: Json?`
    - `ChallengeStep.validation: Json` и `ChallengeStep.validationType: ValidationType`
    - `ChallengeCompletion` имеет `@@unique([challengeId, userId])`

- Seed:
  - `agent/prisma/seed.ts`
  - сейчас сидит только на `admin` и AI-agent user (seed заданий ещё не добавлен).

- Скрипты (см. `agent/package.json`):
  - `npm run prisma:migrate:create` (это `prisma migrate dev`, меняет БД)
  - `npm run prisma:deploy` (deploy миграций)
  - `npm run generate` = `generate:prisma` + `generate:types`

### GraphQL Backend (Pothos)

- Pothos builder:
  - `agent/server/schema/builder.ts`
  - добавлены scalar’ы: `DateTime`, `Json`

- Сборка схемы:
  - `agent/server/schema/index.ts` импортирует `./types` и делает `builder.toSchema()`.

- Домены типов:
  - `agent/server/schema/types/*` (как пример паттерна — домен `Task/`)
  - точка экспорта: `agent/server/schema/types/index.ts`

- Permissions:
  - `agent/server/graphqlServer/permissions/index.ts`
    - сейчас `ruleTree` пустой (ничего не защищено через shield), но…
  - правило `isAuthenticated` уже есть:
    - `agent/server/graphqlServer/permissions/rules/isAuthenticated.ts`
    - проверяет `!!ctx.currentUser`

- Context:
  - `agent/server/context/index.ts` — достаёт `Authorization: Bearer <token>` и поднимает `ctx.currentUser`

### Frontend (Next.js pages-router)

- Роутинг через `src/pages/*` (есть `src/pages/tasks/*`, `signin`, `signup`, и т.д.)

- Apollo Client:
  - `src/gql/apolloClient/*`
  - токен берётся из `localStorage` и добавляется в `authorization` header

- Генерация gql-хуков:
  - источники операций: все `**/*.graphql` внутри `agent/src/**`
  - папка с запросами/мутациями: `agent/src/gql/src/*.graphql` (пример: `Task.graphql`)
  - генерация: `npm run generate:types`

- Паттерн страниц:
  - страница-обёртка в `src/pages/...` обычно просто реэкспортит компонент из `src/components/pages/...`
  - `getInitialProps` часто делает prefetch через `apolloClient.query(...)`

## 2) Что уже сделано в docs

- `idea/реализация/tasks/09-executor-вычислитель-find-b.md`
  - описан `Challenge` типа Executor (subtype `find_b`)
  - формат `content`, формат `answer`, правила `validation`, UI/API, seed
  - добавлены: алгоритм, псевдокод валидатора, тест-кейсы

## 3) Что сейчас отсутствует (и нужно сделать для вертикального среза)

### Backend

- Нет домена `Challenge` в `agent/server/schema/types`:
  - нужно добавить `Challenge`, `ChallengeStep`, `ChallengeCompletion`, `StepCompletion`
  - нужно добавить Query:
    - `challenge(id)`
  - нужно добавить Mutations:
    - `startChallenge(challengeId)`
    - `submitChallengeStep(challengeId, stepOrder, answer)`

- Нет валидаторов:
  - нет `server/validators/...`
  - нужен диспетчер `validateStep` (по `ChallengeStep.validation.type`)
  - нужен валидатор `executor_find_b`

### Seed

- В `agent/prisma/seed.ts` нужно добавить создание:
  - одного `Challenge`
  - одного `ChallengeStep` (order=1)

### Frontend

- Нужна минимальная страница решения `Challenge`:
  - загрузка `challenge(id)`
  - input `b`
  - submit `submitChallengeStep`
  - отображение `feedback`

## 4) Принятые договорённости для первого валидатора (executor_find_b)

- `answer.b`:
  - number
  - integer
  - natural (`>= 1`)

- Симуляция:
  - выполнить команды по символам строки `program` слева направо
  - если команда отсутствует/некорректна — ошибка контента
  - сравнить результат с `target`

## 5) Следующий шаг

Начинаем реализацию вертикального среза в коде:

1) Prisma migrate + generate (команды запускать осознанно, т.к. меняют БД)
2) Добавить GraphQL домен `Challenge`
3) Добавить `validateStep` + `executor_find_b`
4) Добавить seed задания 09
5) Добавить минимальную UI-страницу решения

## 6) Что можно взять из `/freecode.academy` для `/agent`

Цель: переиспользовать готовые паттерны (UX/рантайм/редактор/раннер тестов), но адаптировать под новую модель (`Challenge*`), Pothos и текущий Next.js 16.

### UI и паттерн страницы задания

- `freecode.academy/src/pages/learn/CodeChallenge/index.tsx`
  - полезно: разбор `router.query.slug`, `getInitialProps` с prefetch запроса в Apollo cache.
  - аналог в `/agent`: можно сделать страницу `src/pages/challenges/[id].tsx` (или похожий роут) + prefetch `challenge(id)`.

- `freecode.academy/src/pages/learn/CodeChallenge/Context/index.ts`
  - полезно: структура контекста страницы (challenge + состояние редактора/логера + результаты тестов).
  - аналог в `/agent`: контекст можно упростить для первого типа задания (Executor), но общий паттерн пригодится для Python/JS заданий.

### Monaco Editor

- `freecode.academy/src/hooks/useMonacoEditor/MonacoEditor/index.tsx`
  - полезно: работа с `@monaco-editor/loader`, синхронизация внешнего `source` и model, `onDidChangeContent`.
  - альтернативно (в старом UI):
    - `freecode.academy/src/pages/learn/CodeChallenge/View/Editor/index.tsx`
      - hotkeys (Ctrl+Enter), темы, view-zones/overlay для описания/вывода.
  - аналог в `/agent`: можно перенести `useMonacoEditor`/компонент, но под styled-components/ваши UI-kit компоненты.

### Раннер тестов / выполнение кода (для будущих code-challenges)

- `freecode.academy/src/pages/learn/CodeChallenge/hooks/useExecuteChallenge/index.tsx`
  - полезно:
    - lifecycle: создать completion (если нет) → запустить “выполнение” → собрать результаты → обновить completion → очистить local cache.
  - что не переносить 1-в-1:
    - там сильная завязка на `@prisma-cms/context` и старую структуру `CodeChallengeCompletion`.

- `freecode.academy/src/pages/learn/CodeChallenge/hooks/useExecuteChallenge/executeChallenge/index.ts`
  - полезно:
    - модель выполнения тестов через `AsyncGenerator` (yield по мере прохождения тестов)
    - запуск в iframe или в window
    - базовый формат `TestResult`.

### Сборка/транспиляция пользовательского кода (preview/test build)

- `freecode.academy/src/pages/learn/CodeChallenge/hooks/useExecuteChallenge/executeChallenge/buildFunctions/buildJSChallenge.ts`
  - полезно: как собирается итоговый `build` (head + contents + tail) + sourcemap.

- `freecode.academy/src/pages/learn/CodeChallenge/utils/transformers.ts`
  - полезно: pipeline трансформеров (replace NBSP → Babel transform → compose HTML).
  - важно: loop-protection там закомментирован (исторически был через `@freecodecamp/loop-protect`). Если понадобится — можно вернуть идею, но подобрать совместимый пакет/плагин под `/agent`.

### Серверная логика (Nexus processors) — как референс

Это не переносим напрямую (у нас Pothos + другая схема), но можно брать как референс сценариев:

- `freecode.academy/server/nexus/types/CodeChallenge/index.ts`
  - полезно: какие поля обычно нужны на странице задания (instructions/tests/files/solutions и т.п.).

- `freecode.academy/server/nexus/types/CodeChallengeCompletion/resolvers/createCodeChallengeCompletionProcessor.ts`
  - полезно: идея “создать completion один раз” + проверка существования.
  - в `/agent` это ляжет в `startChallenge(challengeId)` с `@@unique([challengeId, userId])`.

- `freecode.academy/server/nexus/types/CodeChallengeCompletion/resolvers/updateCodeChallengeCompletionProcessor.ts`
  - полезно: “обновить completion при success” + трекинг времени/таймера (у нас можно отложить на потом).
