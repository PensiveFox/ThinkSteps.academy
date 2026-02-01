# Рефакторинг ExecutorChallenge

## Структура компонентов

Каждый компонент разделен на отдельные файлы в своей папке:

### Структура папок

```
ExecutorChallenge/
├── Main/                    # Главный компонент
│   ├── index.tsx           # Экспорт
│   ├── interfaces.ts       # TypeScript интерфейсы
│   ├── styles.ts           # Styled-components стили
│   ├── logic.ts            # Бизнес-логика (хуки)
│   └── view.tsx            # Презентационный компонент
│
├── ExecutorTheory/         # Блок теории
│   ├── index.tsx
│   ├── interfaces.ts
│   ├── styles.ts
│   ├── logic.ts
│   └── view.tsx
│
├── ExecutorEditor/         # Блок редактора
│   ├── index.tsx
│   ├── interfaces.ts
│   ├── styles.ts
│   ├── logic.ts
│   └── view.tsx
│
├── ExecutorOutput/         # Блок результатов
│   ├── index.tsx
│   ├── interfaces.ts
│   ├── styles.ts
│   └── view.tsx
│
├── index.tsx               # Главный экспорт
└── README.md               # Документация
```

## Принципы разделения

### 1. interfaces.ts
- TypeScript интерфейсы и типы
- Props компонентов
- Внутренние типы данных

### 2. styles.ts
- Все styled-components
- CSS-in-JS стили
- Styled компоненты экспортируются именованно

### 3. logic.ts
- Кастомные хуки (useExecutorEditor, useExecutorTheory, etc.)
- Бизнес-логика
- Обработчики событий
- Вычисления и трансформации данных

### 4. view.tsx
- Презентационный компонент
- Использует хуки из logic.ts
- Использует стили из styles.ts
- Минимум логики, только отображение

### 5. index.tsx
- Экспорт компонента и типов
- Точка входа для импорта

## Преимущества структуры

1. **Разделение ответственности**: Каждый файл отвечает за свою часть
2. **Переиспользование**: Логику и стили можно легко переиспользовать
3. **Тестирование**: Легко тестировать логику отдельно от UI
4. **Читаемость**: Меньше кода в одном файле
5. **Масштабируемость**: Легко добавлять новую функциональность

## Пример использования

```tsx
import { ExecutorChallenge } from 'src/components/ExecutorChallenge'

<ExecutorChallenge
  content={content}
  description={description}
  instructions={instructions}
  onSubmit={handleSubmit}
/>
```

## Внутренняя структура компонента

### ExecutorTheory
- **logic.ts**: `useExecutorTheory()` - функция для форматирования описаний команд
- **view.tsx**: Отображение теории, команд, условия задачи
- **styles.ts**: Стили для секций, заголовков, списков команд

### ExecutorEditor
- **logic.ts**: `useExecutorEditor()` - обработка изменений в редакторе
- **view.tsx**: Monaco Editor с настройками
- **styles.ts**: Контейнер, заголовок, wrapper для редактора

### ExecutorOutput
- **view.tsx**: Отображение трассировки, feedback, состояний загрузки
- **styles.ts**: Стили для шагов, feedback box, состояний

### Main (ExecutorChallenge)
- **logic.ts**: `useExecutorChallenge()` - управление состоянием, отправка решения
- **view.tsx**: Композиция всех 3 блоков в grid layout
- **styles.ts**: Grid layout, панели, кнопка отправки

## Миграция

Старые файлы удалены:
- ~~ExecutorEditor.tsx~~
- ~~ExecutorTheory.tsx~~
- ~~ExecutorOutput.tsx~~

Новая структура полностью обратно совместима благодаря правильным экспортам в index.tsx.

## Проверка

```bash
npm run types  # ✅ Успешно
```

Все импорты работают корректно, TypeScript проверки проходят.
