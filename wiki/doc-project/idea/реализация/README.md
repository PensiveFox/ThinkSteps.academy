# Реализация: задания (план + спецификации)

Главный файл-план проекта: `../план-миграции.md`.

Реализацию делаем строго по шагам из плана (этапы БД → GraphQL → UI → валидаторы → seed → интеграции).
А детали по каждому заданию (структура `content`, формат `answer`, правила `validation`, требования к UI/API) храним здесь, в папке `реализация/`.

Эта папка — рабочие спецификации для реализации заданий в `/agent`:

- Каждый файл описывает **одно задание** как `Challenge`:
  - структура `content` (Json)
  - формат ответа пользователя
  - правила валидации
  - требования к UI
  - требования к API
  - seed-данные

## Структура

- `README.md` — правила/шаблон
- `tasks/` — описания задач

## Куда что кладём (структура реализации в коде)

### База данных (Prisma)

- `agent/prisma/schema.prisma`
  - модели (`Challenge`, `ChallengeStep`, `ChallengeCompletion`, `StepCompletion`, `Track*`, `MediaEmbed*` и т.д.)
- `agent/prisma/migrations/`
  - миграции, которые создаёт `npm run prisma:migrate:create`
- `agent/prisma/seed.ts`
  - общий seed (минимум: админ/системные сущности + первые задания)
  - запускается через `npm run prisma:seed`

### Backend (GraphQL API + логика проверки)

- GraphQL схема (Pothos): `agent/server/schema/types/*`
  - каждый домен = отдельная папка, по примеру `Task/`, `User/`
  - для заданий создаём:
    - `agent/server/schema/types/Challenge/`
      - `index.ts` (типы PrismaObject + enum’ы)
      - `inputs.ts` (input types)
      - `resolvers/*` (queries/mutations)
  - подключение всех типов: `agent/server/schema/types/index.ts`

- Permissions (graphql-shield):
  - `agent/server/graphqlServer/permissions/`
  - если мутация требует авторизацию — добавляем правило `isAuthenticated` в ruleTree

- Валидация заданий (серверная логика):
  - создаём папку: `agent/server/validators/`
  - например:
    - `agent/server/validators/validateStep.ts` (диспетчер по `challengeType`/`validation.type`)
    - `agent/server/validators/executor/ExecutorValidator.ts`

### Frontend (UI)

- Страницы/роуты:
  - `agent/src/pages/...` (если проект использует pages-router)
  - или `agent/src/app/...` (если используется app-router)
  - для начала делаем минимальную страницу прохождения задания (просмотр + ввод ответа + кнопка “Проверить”)

- Компоненты редакторов/виджетов:
  - `agent/src/components/...`
  - отдельные UI под типы заданий (Executor, TruthTable, PythonCode и т.д.)

## Как спецификация из `tasks/` превращается в код

Для каждого файла в `реализация/tasks/*.md` делаем 4 изменения в коде:

1) **Seed**
- добавляем создание `Challenge` + `ChallengeStep` в `agent/prisma/seed.ts`

2) **Валидатор**
- реализуем проверку в `agent/server/validators/...`

3) **GraphQL API**
- добавляем query/mutation в `agent/server/schema/types/Challenge/resolvers/...`

4) **UI**
- добавляем минимальный экран для решения и вывода `feedback`

## Шаблон описания задания

1) **Источник**
- ссылка на исходный markdown в `idea/темы/...`

2) **Challenge**
- `subject`
- `challengeType`
- `title/name`
- `description/instructions`
- `content` (Json)

3) **Ответ пользователя (answer)**
- формат JSON, который отправляем в `submitChallengeStep`

4) **Валидация**
- какие `ChallengeStep` нужны
- `validationType` и `validation` (Json)
- что сохраняем в `StepCompletion.feedback`

5) **UI**
- какие поля/виджеты
- как показываем шаги/ошибки

6) **API**
- какие query/mutation используются

7) **Seed**
- какой seed-файл создаём
- какие значения/примеры
