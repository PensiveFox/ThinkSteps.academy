import React, { useState, useEffect } from 'react';

interface Theme {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  skills: Array<{
    name: string;
    weight: number;
    practiceThreshold: number;
  }>;
  content: {
    theory: string;
    examples: string;
    exercises: string;
  };
}

interface Exercise {
  id: string;
  type: 'input' | 'multiple-choice' | 'drag-drop';
  question: string;
  hint?: string;
  solution: {
    steps?: string[];
    answer: string | number;
    explanation: string;
  };
  timeLimit?: number;
  points: number;
}

interface ThemeViewerProps {
  themeId: string;
  onComplete?: (exerciseId: string, score: number, time: number) => void;
}

export const ThemeViewer: React.FC<ThemeViewerProps> = ({ 
  themeId, 
  onComplete 
}) => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadTheme();
  }, [themeId]);

  const loadTheme = async () => {
    try {
      // Загрузка метаданных темы
      const metaResponse = await fetch(`/themes/${themeId}/meta.yaml`);
      const metaText = await metaResponse.text();
      const theme = parseYaml(metaText);
      
      // Загрузка теории
      const theoryResponse = await fetch(`/themes/${themeId}/theory.md`);
      const theoryText = await theoryResponse.text();
      
      // Загрузка упражнений
      const exercisesResponse = await fetch(`/themes/${themeId}/exercises/basic.json`);
      const exercisesData = await exercisesResponse.json();
      
      setTheme({
        ...theme,
        content: {
          theory: theoryText,
          examples: 'examples.md',
          exercises: exercisesData
        }
      });
      
      // Начинаем с первого упражнения
      if (exercisesData.exercises.length > 0) {
        setCurrentExercise(exercisesData.exercises[0]);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const parseYaml = (yamlText: string): Theme => {
    // Простая YAML парсилка для примера
    const lines = yamlText.split('\n');
    const result: any = {};
    
    lines.forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        
        // Убираем кавычки если есть
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        // Парсим массивы
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(item => item.trim());
        }
        
        result[key] = value;
      }
    });
    
    return result as Theme;
  };

  const startExercise = () => {
    setStartTime(new Date());
    setUserAnswer('');
    setShowHint(false);
    setShowSolution(false);
  };

  const checkAnswer = () => {
    if (!currentExercise || !startTime) return;
    
    const endTime = new Date();
    const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    const isCorrect = checkAnswerCorrectness();
    
    if (isCorrect) {
      const points = currentExercise.points || 10;
      setScore(score + points);
      
      if (onComplete) {
        onComplete(currentExercise.id, points, timeSpent);
      }
      
      // Переходим к следующему упражнению
      if (theme && theme.content.exercises.exercises) {
        const currentIndex = theme.content.exercises.exercises.findIndex(
          ex => ex.id === currentExercise.id
        );
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < theme.content.exercises.exercises.length) {
          setCurrentExercise(theme.content.exercises.exercises[nextIndex]);
          setStartTime(new Date());
          setUserAnswer('');
          setShowHint(false);
          setShowSolution(false);
        }
      }
    }
  };

  const checkAnswerCorrectness = (): boolean => {
    if (!currentExercise) return false;
    
    const correctAnswer = currentExercise.solution.answer;
    const userAnswerNum = parseFloat(userAnswer);
    
    if (currentExercise.type === 'multiple-choice') {
      return userAnswer === correctAnswer.toString();
    }
    
    return !isNaN(userAnswerNum) && userAnswerNum === correctAnswer;
  };

  const renderTheory = () => {
    if (!theme) return null;
    
    return (
      <div className="theory-section">
        <h2>📚 Теория</h2>
        <div 
          className="theory-content"
          dangerouslySetInnerHTML={{ __html: theme.content.theory }}
        />
      </div>
    );
  };

  const renderExercise = () => {
    if (!currentExercise) return null;
    
    return (
      <div className="exercise-section">
        <h3>🎯 Упражнение {currentExercise.id}</h3>
        
        <div className="exercise-content">
          <div className="question">
            {currentExercise.question}
          </div>
          
          {currentExercise.type === 'input' && (
            <div className="answer-input">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Введи ответ"
                className="form-input"
              />
            </div>
          )}
          
          {currentExercise.type === 'multiple-choice' && (
            <div className="multiple-choice">
              {currentExercise.options?.map((option: any) => (
                <label key={option.value} className="choice-option">
                  <input
                    type="radio"
                    name="answer"
                    value={option.value}
                    checked={userAnswer === option.value.toString()}
                    onChange={(e) => setUserAnswer(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="exercise-controls">
          {!startTime && (
            <button onClick={startExercise} className="start-btn">
              🚀 Начать
            </button>
          )}
          
          {startTime && (
            <>
              <button 
                onClick={() => setShowHint(!showHint)} 
                className="hint-btn"
              >
                💡 Подсказка
              </button>
              
              <button 
                onClick={() => setShowSolution(!showSolution)} 
                className="solution-btn"
              >
                💡 Решение
              </button>
              
              <button onClick={checkAnswer} className="check-btn">
                ✅ Проверить
              </button>
            </>
          )}
        </div>
        
        {showHint && currentExercise.hint && (
          <div className="hint-box">
            <strong>💡 Подсказка:</strong> {currentExercise.hint}
          </div>
        )}
        
        {showSolution && (
          <div className="solution-box">
            <strong>🎯 Решение:</strong>
            {currentExercise.solution.steps && (
              <ol>
                {currentExercise.solution.steps.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            )}
            <p><strong>Ответ:</strong> {currentExercise.solution.answer}</p>
            <p><em>{currentExercise.solution.explanation}</em></p>
          </div>
        )}
        
        {startTime && (
          <div className="exercise-info">
            <span>⏱️ Время: {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)}с</span>
            <span>🏆 Баллы: {score}</span>
            {currentExercise.timeLimit && (
              <span>⏰ Лимит: {currentExercise.timeLimit}с</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderProgress = () => {
    if (!theme) return null;
    
    const totalExercises = theme.content.exercises?.exercises?.length || 0;
    const completedExercises = score > 0 ? Math.floor(score / 10) : 0; // Предполагаем 10 баллов за упражнение
    
    return (
      <div className="progress-section">
        <h3>📊 Прогресс по теме</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(completedExercises / totalExercises) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          {completedExercises} / {totalExercises} упражнений
        </div>
      </div>
    );
  };

  if (!theme) {
    return <div className="loading">📚 Загрузка темы...</div>;
  }

  return (
    <div className="theme-viewer">
      <header className="theme-header">
        <h1>{theme.title}</h1>
        <p className="theme-description">{theme.description}</p>
        <div className="theme-meta">
          <span className="difficulty">📈 Сложность: {theme.difficulty}</span>
          <span className="duration">⏰ Время: {theme.estimatedHours}ч</span>
        </div>
      </header>
      
      <div className="theme-content">
        {renderTheory()}
        {renderExercise()}
        {renderProgress()}
      </div>
      
      <style jsx>{`
        .theme-viewer {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .theme-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 10px;
        }
        
        .theme-header h1 {
          margin: 0 0 10px 0;
          color: #2d3748;
        }
        
        .theme-description {
          color: #718096;
          margin-bottom: 15px;
        }
        
        .theme-meta {
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        
        .difficulty, .duration {
          background: #e2e8f0;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 14px;
        }
        
        .theory-section {
          background: #f0fff4;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          border-left: 4px solid #48bb78;
        }
        
        .exercise-section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        
        .question {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #2d3748;
        }
        
        .answer-input input {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        
        .multiple-choice {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .choice-option {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .choice-option:hover {
          border-color: #4299e1;
          background: #ebf8ff;
        }
        
        .exercise-controls {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        
        .hint-btn, .solution-btn, .check-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }
        
        .hint-btn {
          background: #f6e05e;
          color: white;
        }
        
        .solution-btn {
          background: #3182ce;
          color: white;
        }
        
        .check-btn {
          background: #48bb78;
          color: white;
        }
        
        .hint-box, .solution-box {
          background: #fef5e7;
          border: 1px solid #f6e05e;
          border-radius: 8px;
          padding: 15px;
          margin-top: 15px;
        }
        
        .exercise-info {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          font-size: 14px;
          color: #718096;
        }
        
        .progress-section {
          background: #f7fafc;
          padding: 15px;
          border-radius: 8px;
        }
        
        .progress-bar {
          width: 100%;
          height: 20px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #48bb78, #38b2ac);
          transition: width 0.5s ease;
        }
        
        .progress-text {
          text-align: center;
          font-weight: 600;
          color: #2d3748;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #718096;
        }
      `}</style>
    </div>
  );
};
