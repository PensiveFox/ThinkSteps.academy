import React from 'react'
import { ExecutorTheoryProps } from './interfaces'
import { useExecutorTheory } from './logic'
import {
  TheoryContainer,
  TitleContainer,
  Title,
  SubmitButton,
  Section,
  SectionTitle,
  CommandList,
  CommandItem,
  CodeValue,
  Description,
  GridContainer,
  GridItem,
} from './styles'

export const ExecutorTheoryView: React.FC<ExecutorTheoryProps> = ({
  executorName,
  commands,
  program,
  start,
  target,
  unknowns,
  videoUrl,
  onSubmit,
  canSubmit,
  isLoading,
}) => {
  const { getCommandDescription } = useExecutorTheory()

  return (
    <TheoryContainer>
      <TitleContainer>
        <Title>Исполнитель «{executorName}»</Title>
        {onSubmit && (
          <SubmitButton onClick={onSubmit} disabled={!canSubmit}>
            {isLoading ? 'Проверка...' : 'Проверить'}
          </SubmitButton>
        )}
      </TitleContainer>

      {videoUrl && (
        <Section>
          <SectionTitle>Видео-пример</SectionTitle>
          <Description>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                src={videoUrl}
                title="Видео-пример решения"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Description>
        </Section>
      )}

      <Section>
        <SectionTitle>Задача</SectionTitle>
        <Description>
          Даны команды исполнителя и программа. Известно, что программа переводит число{' '}
          <CodeValue>{start}</CodeValue> в <CodeValue>{target}</CodeValue>.{' '}
          {unknowns && (
            <>
              Найдите{' '}
              {Object.entries(unknowns).map(([key], idx, arr) => (
                <span key={key}>
                  <strong>{key}</strong>
                  {idx < arr.length - 1 ? ', ' : ''}
                </span>
              ))}
              .
            </>
          )}
        </Description>
      </Section>

      <GridContainer>
        <GridItem>
          <SectionTitle>Команды исполнителя</SectionTitle>
          <CommandList>
            {Object.entries(commands).map(([key, cmd]) => (
              <CommandItem key={key}>
                <strong>{key}:</strong> {getCommandDescription(cmd)}
              </CommandItem>
            ))}
          </CommandList>
        </GridItem>

        <GridItem>
          <SectionTitle>Данные</SectionTitle>
          <div style={{ marginBottom: '12px' }}>
            <strong>Программа:</strong> <CodeValue>{program}</CodeValue>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Начальное значение:</strong> <CodeValue>{start}</CodeValue>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Конечное значение:</strong> <CodeValue>{target}</CodeValue>
          </div>
        </GridItem>
      </GridContainer>

      <Section>
        <SectionTitle>Как решать</SectionTitle>
        <Description>
          <ol>
            <li>Проанализируйте команды исполнителя</li>
            <li>Пройдите программу пошагово, записывая выражения</li>
            <li>Найдите значение переменной из уравнения</li>
            <li>Введите ответ в редакторе в формате: <CodeValue>b = число</CodeValue></li>
            <li>Проверьте решение</li>
          </ol>
        </Description>
      </Section>

      <Section>
        <SectionTitle>Пример решения</SectionTitle>
        <Description>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <p><strong>Пошаговое выполнение программы {program}:</strong></p>
              <table style={{ borderCollapse: 'collapse', marginLeft: '20px', fontFamily: 'monospace' }}>
                <thead>
                  <tr>
                    <th style={{ border: 'none', textAlign: 'left', paddingRight: '40px' }}>Команда</th>
                    <th style={{ border: 'none', textAlign: 'left' }}>Решение</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: 'none', paddingRight: '40px' }}>2)</td>
                    <td style={{ border: 'none' }}>{start} - b</td>
                  </tr>
                  <tr>
                    <td style={{ border: 'none', paddingRight: '40px' }}>1)</td>
                    <td style={{ border: 'none' }}>({start} - b) × 4</td>
                  </tr>
                  <tr>
                    <td style={{ border: 'none', paddingRight: '40px' }}>1)</td>
                    <td style={{ border: 'none' }}>({start} - b) × 16</td>
                  </tr>
                  <tr>
                    <td style={{ border: 'none', paddingRight: '40px' }}>2)</td>
                    <td style={{ border: 'none' }}>({start} - b) × 16 - b</td>
                  </tr>
                  <tr>
                    <td style={{ border: 'none', paddingRight: '40px' }}>2)</td>
                    <td style={{ border: 'none' }}>({start} - b) × 16 - 2b</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ marginTop: '20px' }}><strong>Упрощаем:</strong></p>
              <p>x = {start * 16} - 16b - 2b = {start * 16} - 18b</p>
              <p><strong>Составляем уравнение:</strong></p>
              <p>{start * 16} - 18b = {target}</p>
              <p>18b = {start * 16 - target}</p>
              <p>b = {(start * 16 - target) / 18}</p>
            </div>
            
            <div>
              <p><strong>В редакторе напишите решение в формате:</strong></p>
              <CodeValue style={{ display: 'block', whiteSpace: 'pre', padding: '10px', marginTop: '10px' }}>
{`2) ${start} - b
1) (${start} - b) × 4
1) (${start} - b) × 16
2) (${start} - b) × 16 - b
2) (${start} - b) × 16 - 2b

x = ${start * 16} - 18b
${start * 16} - 18b = ${target}
b = ${(start * 16 - target) / 18}`}
              </CodeValue>
            </div>
          </div>
        </Description>
      </Section>
    </TheoryContainer>
  )
}
