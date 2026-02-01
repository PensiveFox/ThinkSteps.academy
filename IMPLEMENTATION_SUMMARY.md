# Реализация компонента ExecutorChallenge с 3 блоками

## Выполнено

Создан компонент для интерактивного решения задач типа "Исполнитель - найти b" с архитектурой из 3 блоков по аналогии с freecode.academy.

## Структура компонента

### 1. ExecutorTheory (Теоретический блок)
**Файл:** `src/components/ExecutorChallenge/ExecutorTheory.tsx`

- Отображение информации об исполнителе и его командах
- Условие задачи (программа, начальное и конечное значения)
- Описание неизвестных переменных
- Инструкции по решению

### 2. ExecutorEditor (Редактор кода)
**Файл:** `src/components/ExecutorChallenge/ExecutorEditor.tsx`

- Интеграция Monaco Editor через `@monaco-editor/react`
- Поддержка Python (готов для других языков)
- Темная тема (vs-dark)
- Автоматическое извлечение значения `b` из кода

### 3. ExecutorOutput (Результат выполнения)
**Файл:** `src/components/ExecutorChallenge/ExecutorOutput.tsx`

- Пошаговая трассировка выполнения программы исполнителя
- Визуальное отображение правильности решения
- Детальный feedback с объяснениями
- Состояния: загрузка, успех, ошибка

## Основной компонент

**Файл:** `src/components/ExecutorChallenge/index.tsx`

- Grid layout (3 панели: теория, редактор, результат)
- Управление состоянием (код, результаты, трассировка)
- Кнопка "Проверить" с валидацией
- Интеграция с GraphQL API

## Изменения в backend

### 1. Валидатор
**Файл:** `server/validators/executor/validateExecutorFindB.ts`

- Добавлено поле `trace` в возвращаемый результат
- Трассировка включает пошаговое выполнение программы
- Каждый шаг содержит: номер, команду, выражение, значение

### 2. GraphQL схема
**Файл:** `server/schema/types/Challenge/inputs.ts`

- Добавлено поле `trace: Json` в `StepCompletionPayload`
- Поле опциональное (nullable)

### 3. Резолвер
**Файл:** `server/schema/types/Challenge/resolvers/submitChallengeStep.ts`

- Передача трассировки из валидатора в ответ
- Поддержка нового поля `trace`

### 4. Типы
**Файл:** `server/validators/validateStep.ts`

- Обновлен интерфейс `ValidationResult`
- Добавлено опциональное поле `trace?: any`

## Изменения в frontend

### Страница задания
**Файл:** `src/pages/challenges/[id].tsx`

- Полностью переработана для использования `ExecutorChallenge`
- Упрощена логика - весь UI в компоненте
- Автоматический старт задания при отправке
- Передача трассировки из GraphQL в компонент

## Установленные зависимости

```json
{
  "@monaco-editor/react": "^4.6.0"
}
```

## Особенности реализации

1. **Универсальность**: Monaco Editor позволяет использовать любые языки программирования (Python, JavaScript, и т.д.)

2. **Трассировка**: Валидатор возвращает детальную трассировку выполнения программы исполнителя с символьными выражениями

3. **Grid Layout**: Адаптивная сетка для корректного отображения на разных экранах

4. **SSR**: Monaco Editor загружается динамически через `next/dynamic` для избежания проблем с SSR

5. **Type Safety**: Все компоненты типизированы, TypeScript проверки проходят успешно

## Как использовать

```tsx
import { ExecutorChallenge } from 'src/components/ExecutorChallenge'

<ExecutorChallenge
  content={{
    executor: {
      name: "Вычислитель",
      commands: {
        "1": { op: "mul", k: 4 },
        "2": { op: "sub", var: "b" }
      }
    },
    program: "21122",
    start: 4,
    target: 28,
    unknowns: { b: { type: "natural" } }
  }}
  description="Описание задания"
  instructions="Инструкции"
  onSubmit={handleSubmit}
/>
```

## Следующие шаги

- [ ] Тестирование компонента с реальными данными
- [ ] Добавление визуализации выполнения программы
- [ ] Мобильная адаптация layout
- [ ] Подсказки и hints для учеников
- [ ] Сохранение прогресса решения
- [ ] Поддержка других типов заданий исполнителя

## Файлы

### Созданные компоненты
- `src/components/ExecutorChallenge/index.tsx`
- `src/components/ExecutorChallenge/ExecutorTheory.tsx`
- `src/components/ExecutorChallenge/ExecutorEditor.tsx`
- `src/components/ExecutorChallenge/ExecutorOutput.tsx`
- `src/components/ExecutorChallenge/README.md`

### Измененные файлы
- `src/pages/challenges/[id].tsx`
- `server/validators/executor/validateExecutorFindB.ts`
- `server/validators/validateStep.ts`
- `server/schema/types/Challenge/inputs.ts`
- `server/schema/types/Challenge/resolvers/submitChallengeStep.ts`

## Проверка

```bash
# Проверка типов
npm run types  # ✅ Успешно

# Генерация GraphQL типов
npm run generate:types  # ✅ Успешно
```
