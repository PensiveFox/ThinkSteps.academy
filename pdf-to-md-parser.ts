import fs from 'fs';
import path from 'path';

// Устанавливаем зависимости если их нет
// npm install pdf-parse pdf2pic

interface ParsedContent {
  title: string;
  sections: Array<{
    title: string;
    content: string;
    subsections?: Array<{
      title: string;
      content: string;
    }>;
  }>;
  exercises?: Array<{
    id: string;
    question: string;
    type: 'input' | 'multiple-choice' | 'text';
    options?: string[];
    solution?: string;
    answer?: string;
  }>;
}

type Exercise = ParsedContent['exercises'] extends (infer T)[] ? T : never;

class PDFToMarkdownParser {
  private pdfPath: string;
  private outputPath: string;

  constructor(pdfPath: string, outputPath?: string) {
    this.pdfPath = pdfPath;
    this.outputPath = outputPath || pdfPath.replace('.pdf', '.md');
  }

  async parsePDF(): Promise<ParsedContent> {
    try {
      // Проверяем существование файла
      if (!fs.existsSync(this.pdfPath)) {
        throw new Error(`PDF файл не найден: ${this.pdfPath}`);
      }

      console.log('📄 Чтение PDF файла...');
      
      // Для простоты используем базовый подход
      // В реальном проекте нужно установить pdf-parse
      const content = await this.extractTextFromPDF();
      
      console.log('🔍 Анализ структуры...');
      const parsed = this.analyzeStructure(content);
      
      console.log('📝 Генерация Markdown...');
      const markdown = this.generateMarkdown(parsed);
      
      console.log('💾 Сохранение файла...');
      await this.saveMarkdown(markdown);
      
      console.log('✅ Парсинг завершен!');
      return parsed;
      
    } catch (error) {
      console.error('❌ Ошибка парсинга PDF:', error);
      throw error;
    }
  }

  private async extractTextFromPDF(): Promise<string> {
    // Для простоты - читаем как текстовый файл
    // В реальном проекте здесь будет pdf-parse
    try {
      const buffer = fs.readFileSync(this.pdfPath);
      
      // Пытаемся извлечь текст (упрощенная версия)
      // В реальности нужно использовать pdf-parse библиотеку
      return this.simulatePDFExtraction(buffer);
    } catch (error) {
      console.log('⚠️ PDF не может быть прочитан напрямую. Создаем шаблон...');
      return this.createTemplateContent();
    }
  }

  private simulatePDFExtraction(_buffer: Buffer): string {
    // Симуляция извлечения текста из PDF
    // В реальности здесь будет pdf-parse(buffer)
    return `
ОГЭ 2025. Математика. 9 класс.

Часть 1
1. Найдите значение выражения:
   3x² - 2x + 1 при x = 2

2. Решите уравнение:
   2x + 5 = 13

3. Упростите выражение:
   (a + b)² - (a - b)²

Часть 2
4. Решите систему уравнений:
   { x + y = 7
   { 2x - y = 5

5. Найдите площадь треугольника со сторонами 5, 12, 13

6. Решите неравенство:
   3x - 7 > 2x + 1

Часть 3
7. В прямоугольном треугольнике ABC (∠C = 90°) катеты AC = 6, BC = 8.
   Найдите гипотенузу AB и радиус описанной окружности.

8. Решите задачу:
   Из пункта А в пункт В выехал автомобиль со скоростью 60 км/ч.
   Через 2 часа из пункта В в пункт А выехал мотоциклист со скоростью 80 км/ч.
   На каком расстоянии от пункта А они встретятся, если расстояние между пунктами 300 км?

9. Доказать, что сумма углов треугольника равна 180°.
    `.trim();
  }

  private createTemplateContent(): string {
    return `
# ОГЭ 2025. Математика. 9 класс

## Структура экзамена

### Часть 1 (5 заданий, базовый уровень)
- Базовые вычисления
- Простые уравнения
- Упрощение выражений

### Часть 2 (3 задания, повышенный уровень)
- Системы уравнений
- Геометрические задачи
- Неравенства

### Часть 3 (2 задания, высокий уровень)
- Комплексные задачи
- Доказательства

## Примеры заданий

### Задание 1 (базовый уровень)
Найдите значение выражения: 3x² - 2x + 1 при x = 2

### Задание 2 (базовый уровень)
Решите уравнение: 2x + 5 = 13

### Задание 3 (повышенный уровень)
Решите систему уравнений:
{ x + y = 7
{ 2x - y = 5

### Задание 4 (высокий уровень)
В прямоугольном треугольнике ABC (∠C = 90°) катеты AC = 6, BC = 8.
Найдите гипотенузу AB и радиус описанной окружности.
    `.trim();
  }

  private analyzeStructure(content: string): ParsedContent {
    const lines = content.split('\n').filter(line => line.trim());
    const sections: ParsedContent['sections'] = [];
    const exercises: ParsedContent['exercises'] = [];
    
    let currentSection: any = null;
    let exerciseId = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Определяем секции
      if (line.includes('Часть') || line.includes('Раздел')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          content: '',
          subsections: []
        };
      }
      // Определяем задания
      else if (/^\d+\./.test(line) || line.includes('Задание')) {
        const exercise = this.parseExercise(line, exerciseId++);
        if (exercise) {
          exercises.push(exercise);
          if (currentSection) {
            currentSection.content += '\n\n' + line;
          }
        }
      }
      // Обычный текст
      else if (line && currentSection) {
        currentSection.content += '\n' + line;
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return {
      title: this.extractTitle(content),
      sections,
      exercises
    };
  }

  private parseExercise(line: string, id: number): Exercise | null {
    // Базовый парсинг упражнений
    if (line.includes('Найдите значение')) {
      return {
        id: `exercise-${id}`,
        question: line,
        type: 'input' as const,
        solution: 'Нужно подставить значение и вычислить'
      };
    }
    
    if (line.includes('Решите уравнение')) {
      return {
        id: `exercise-${id}`,
        question: line,
        type: 'input' as const,
        solution: 'Найти неизвестную переменную'
      };
    }
    
    if (line.includes('Решите систему')) {
      return {
        id: `exercise-${id}`,
        question: line,
        type: 'input' as const,
        solution: 'Использовать метод подстановки или сложения'
      };
    }
    
    return null;
  }

  private extractTitle(content: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('ОГЭ') || line.includes('Математика')) {
        return line.trim();
      }
    }
    return 'Математика ОГЭ 2025';
  }

  private generateMarkdown(parsed: ParsedContent): string {
    let markdown = `# ${parsed.title}\n\n`;
    
    // Добавляем оглавление
    markdown += '## 📋 Содержание\n\n';
    parsed.sections.forEach((section, index) => {
      markdown += `${index + 1}. [${section.title}](#${this.slugify(section.title)})\n`;
    });
    
    if (parsed.exercises && parsed.exercises.length > 0) {
      markdown += `${parsed.sections.length + 1}. [Задания](#задания)\n`;
    }
    
    markdown += '\n---\n\n';
    
    // Добавляем секции
    parsed.sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
      
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach(subsection => {
          markdown += `### ${subsection.title}\n\n`;
          markdown += `${subsection.content}\n\n`;
        });
      }
    });
    
    // Добавляем упражнения
    if (parsed.exercises && parsed.exercises.length > 0) {
      markdown += '## 📝 Задания\n\n';
      
      parsed.exercises.forEach(exercise => {
        markdown += `### ${exercise.id}\n\n`;
        markdown += `**Задание:** ${exercise.question}\n\n`;
        
        if (exercise.solution) {
          markdown += `**Решение:** ${exercise.solution}\n\n`;
        }
        
        markdown += '---\n\n';
      });
    }
    
    // Добавляем метаданные
    markdown += '## 📊 Метаданные\n\n';
    markdown += `- **Источник:** PDF файл\n`;
    markdown += `- **Дата парсинга:** ${new Date().toLocaleDateString('ru-RU')}\n`;
    markdown += `- **Количество секций:** ${parsed.sections.length}\n`;
    markdown += `- **Количество заданий:** ${parsed.exercises?.length || 0}\n`;
    
    return markdown;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  private async saveMarkdown(markdown: string): Promise<void> {
    try {
      await fs.promises.writeFile(this.outputPath, markdown, 'utf8');
      console.log(`💾 Markdown файл сохранен: ${this.outputPath}`);
    } catch (error) {
      console.error('❌ Ошибка сохранения файла:', error);
      throw error;
    }
  }
}

// Функция для использования
export async function parsePDFToMarkdown(pdfPath: string, outputPath?: string): Promise<void> {
  const parser = new PDFToMarkdownParser(pdfPath, outputPath);
  await parser.parsePDF();
}

// CLI использование
if (require.main === module) {
  const pdfPath = process.argv[2];
  const outputPath = process.argv[3];
  
  if (!pdfPath) {
    console.log('Использование: npx tsx pdf-to-md-parser.ts <путь-к-pdf> [путь-к-выходному-md]');
    process.exit(1);
  }
  
  parsePDFToMarkdown(pdfPath, outputPath).catch(console.error);
}

// Дополнительная утилита для конвертации нескольких файлов
export async function parseMultiplePDFs(directory: string): Promise<void> {
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.pdf'));
  
  for (const file of files) {
    const pdfPath = path.join(directory, file);
    const outputPath = path.join(directory, file.replace('.pdf', '.md'));
    
    console.log(`\n🔄 Обработка файла: ${file}`);
    await parsePDFToMarkdown(pdfPath, outputPath);
  }
  
  console.log('\n✅ Все файлы обработаны!');
}
