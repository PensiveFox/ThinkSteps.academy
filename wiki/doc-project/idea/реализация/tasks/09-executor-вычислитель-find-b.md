# Задание: Исполнитель «Вычислитель» — найти b

Источник: `../темы/09-примеры-исполнителей-вычислитель.md`

## 1) Challenge

- `subject`: `Informatics`
- `challengeType`: `Executor`
- `name`: `Исполнитель «Вычислитель»: найти b`

### Instructions (суть)
Даны команды исполнителя и программа. Известно, что программа переводит число `start` в `target`. Найдите `b`.

### `content` (Json)

```json
{
  "subtype": "find_b",
  "executor": {
    "name": "Вычислитель",
    "commands": {
      "1": { "op": "mul", "k": 4 },
      "2": { "op": "sub", "var": "b" }
    }
  },
  "unknowns": {
    "b": { "type": "natural" }
  },
  "program": "21122",
  "start": 4,
  "target": 28
}
```

## 2) Ответ пользователя (answer)

```json
{ "b": 2 }
```

## 3) Валидация

### Модель
- Один `ChallengeStep`.
- `validationType`: `Numeric` или `Exact` (проще — `Exact` для числа).

Рекомендуемая форма шага в БД:
- `order`: `1`
- `title`: `Найдите b`
- `description`: краткое условие (можно вынести в `Challenge.instructions`, но дублировать в шаге не запрещено)
- `validationType`: `Exact`
- `maxScore`: `1`

### `ChallengeStep.validation` (вариант)

```json
{
  "type": "executor_find_b",
  "expectedVar": "b",
  "program": "21122",
  "start": 4,
  "target": 28,
  "commands": {
    "1": { "op": "mul", "k": 4 },
    "2": { "op": "sub", "var": "b" }
  },
  "constraints": {
    "b": { "type": "natural" }
  }
}
```

### Правило
- Взять `b` из `answer`.
- Проверить ограничения (`b` — натуральное).
- Симулировать программу:
  - применить команды по цифрам строки слева направо
- Проверить `result === target`.

Ожидаемый формат `answer`:
- `answer.b` — число.

Ошибки (примеры):
- если `answer.b` отсутствует/не число: `feedback = "Введите b числом"`
- если `b <= 0` или не целое: `feedback = "b должно быть натуральным числом"`
- если команда/программа некорректны: `feedback = "Некорректные данные задания"` (ошибка контента)

### Результат
- `StepCompletion.isCorrect`
- `StepCompletion.feedback` (например: «Верно: b=2» / «Неверно: при b=3 получается 10»)

Также полезно (опционально):
- в `StepCompletion.answer` сохранять полный `answer`
- в `StepCompletion.feedback` выводить результат симуляции: `"При b=3 получилось 10, нужно 28"`

## 4) UI

Минимально:
- input для `b` (number)
- кнопка «Проверить»
- вывод результата проверки

UI-логика:
- при первом открытии:
  - показываем условие (instructions)
  - показываем поле ввода `b`
- после отправки:
  - показываем `feedback`
  - если неверно — даём «Попробовать ещё раз» (это просто повторная отправка, attempts увеличиваем на сервере)

## 5) API

Нужно:

### Queries

1) Получить задание:
- `challenge(id)` → `Challenge` + `steps`

### Mutations

1) `startChallenge(challengeId)`
- создаёт (или возвращает существующий) `ChallengeCompletion` для пользователя

2) `submitChallengeStep(challengeId, stepOrder, answer)`
- `stepOrder` предпочтительнее, чем `stepId` (у нас шаги идут с `order`)
- возвращает обновлённый `ChallengeCompletion` + созданный `StepCompletion` (или хотя бы `feedback`)

Авторизация:
- `startChallenge` и `submitChallengeStep` должны требовать `isAuthenticated`

## 6) Seed


Нужно создать seed для 1 задания Executor и 1 шага.

### Что создаём

1) `Challenge`
- `subject`: `Informatics`
- `challengeType`: `Executor`
- `name`: `Исполнитель «Вычислитель»: найти b`
- `instructions`: текст условия
- `content`: как в разделе выше
- `validationMode`: `Strict`
- `tags`: например `["oge", "executor", "find_b"]`
- `isPublished`: `true` (или `false`, если пока черновик)
- `createdById`: id пользователя-автора (можно взять `admin`, если он есть)

2) `ChallengeStep`
- `order`: `1`
- `title`: `Найдите b`
- `description`: кратко
- `validationType`: `Exact`
- `validation`: как в разделе выше
- `maxScore`: `1`

### Где лежит seed

- `agent/prisma/seed.ts`

 ---
 
 ## 7) Чек-лист реализации (для кода)
 
 - [x] Спецификация задания (content/answer/validation/UI/API/seed)
 - [x] Алгоритм + пример + краевые случаи
 - [x] Псевдокод валидатора
 - [x] Тест-кейсы (минимальный набор)
 
 Реализация в коде `/agent`:
 
 - [x] Добавить `server/schema/types/Challenge/*` (типы + резолверы)
 - [x] Добавить `startChallenge` и `submitChallengeStep`
 - [x] Добавить `server/validators/executor/ExecutorValidator.ts` и `validateStep`
 - [x] Добавить seed для этого `Challenge` + `ChallengeStep`
 - [x] Минимальная UI-страница решения (`src/pages/challenges/[id].tsx`)
 
 ---

## 8) Алгоритм (как понимать «найти b»)

Валидация должна проверять **ответ пользователя** (значение `b`), а не «умение» строить программу.

Требуемое поведение:

1) Взять `b` из `answer`.
2) Подставить `b` в команды, где используется `var: "b"`.
3) Выполнить программу `program` над числом `start`.
4) Результат должен совпасть с `target`.

Важно:

- `b` вводится пользователем как число.
- Ограничения (`unknowns/constraints`) применяются **до** симуляции.
- Если программа/команды неконсистентны — это ошибка контента задания.

## 9) Пример «в лоб» для текущего JSON

Команды:

- `1`: умножить на 4
- `2`: вычесть `b`

Программа: `21122`

Старт: `4`

Трассировка:

2)               4 - b
1)               (4 - b) × 4
1)               (4 - b) × 16
2)               (4 - b) × 16 - b
2)               (4 - b) × 16 - 2b

Условие: `64 - 18b = 28` ⇒ `18b = 36` ⇒ `b = 2`.

Проверка симуляцией при `b = 2`:

`4 → 2 → 8 → 32 → 30 → 28`.

Примечание: решать аналитически валидатор **не обязан** — он просто симулирует.

## 10) Краевые случаи и договорённости

### Про `b` (answer)

- `b` обязано быть числом.
- `b` обязано быть целым.
- `b` обязано удовлетворять типу из `constraints`:
  - `natural`: `b >= 1`

### Про `program`

- `program` должна быть строкой.
- Каждая цифра должна соответствовать ключу в `commands`.
- Пустая программа допустима только если `start === target` (иначе ошибка ответа, а не контента).

### Про арифметику

- Все вычисления ведём в целых числах JS `number`.
- Если на любом шаге результат становится `NaN`/`Infinity` — считаем данные некорректными.
- (опционально) Можно ограничить модуль промежуточных значений, чтобы избежать «взрывов» при некорректном `b`:
  - например `abs(x) <= 1e12`, иначе прерываем с понятным `feedback`.

## 11) Псевдокод валидатора

Ожидаемый контракт: вход — `validation` (из шага) + `answer` (от пользователя), выход — `{ isCorrect, feedback }`.

```ts
type Cmd =
  | { op: 'mul'; k: number }
  | { op: 'add'; k: number }
  | { op: 'sub'; k: number }
  | { op: 'sub'; var: 'b' }
  | { op: 'add'; var: 'b' };

function validateExecutorFindB(validation, answer) {
  const expectedVar = validation.expectedVar ?? 'b';

  const b = answer?.[expectedVar];
  if (typeof b !== 'number' || Number.isNaN(b)) {
    return { isCorrect: false, feedback: 'Введите b числом' };
  }
  if (!Number.isInteger(b) || b <= 0) {
    return { isCorrect: false, feedback: 'b должно быть натуральным числом' };
  }

  const { start, target, program, commands } = validation;
  if (typeof start !== 'number' || typeof target !== 'number' || typeof program !== 'string' || !commands) {
    return { isCorrect: false, feedback: 'Некорректные данные задания' };
  }

  let x = start;
  for (const ch of program) {
    const cmd = commands[ch];
    if (!cmd) return { isCorrect: false, feedback: 'Некорректные данные задания' };

    if (cmd.op === 'mul') x = x * cmd.k;
    else if (cmd.op === 'add' && 'k' in cmd) x = x + cmd.k;
    else if (cmd.op === 'sub' && 'k' in cmd) x = x - cmd.k;
    else if (cmd.op === 'add' && cmd.var === expectedVar) x = x + b;
    else if (cmd.op === 'sub' && cmd.var === expectedVar) x = x - b;
    else return { isCorrect: false, feedback: 'Некорректные данные задания' };

    if (!Number.isFinite(x)) {
      return { isCorrect: false, feedback: 'Некорректные данные задания' };
    }
  }

  const isCorrect = x === target;
  return {
    isCorrect,
    feedback: isCorrect ? `Верно: b=${b}` : `Неверно: при b=${b} получается ${x}, нужно ${target}`,
  };
}
```

## 12) Тест-кейсы (минимальный набор)

### Позитивный

- `answer = { "b": 2 }` ⇒ `isCorrect: true`.

### Неверный ответ

- `answer = { "b": 3 }` ⇒ `isCorrect: false`, в `feedback` должен быть рассчитанный результат.

### Неверный формат

- `answer = {}` ⇒ `Введите b числом`.
- `answer = { "b": "2" }` ⇒ `Введите b числом`.
- `answer = { "b": 0 }` ⇒ `b должно быть натуральным числом`.
- `answer = { "b": 2.5 }` ⇒ `b должно быть натуральным числом`.

### Некорректный контент шага

- `program` содержит символ, отсутствующий в `commands` ⇒ `Некорректные данные задания`.
- `commands["2"] = {"op":"sub"}` (нет ни `k`, ни `var`) ⇒ `Некорректные данные задания`.
