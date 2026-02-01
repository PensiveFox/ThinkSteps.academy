import React from 'react'
import { ExecutorChallengeProps } from './interfaces'
import { useExecutorChallenge } from './logic'
import { ExecutorTheory } from '../ExecutorTheory'
import { ExecutorEditor } from '../ExecutorEditor'
import { ExecutorOutput } from '../ExecutorOutput'
import {
  ChallengeContainer,
  TheoryPanel,
  EditorPanel,
  OutputPanel,
  // ControlBar,
  // SubmitButton,
} from './styles'

export const ExecutorChallengeView: React.FC<ExecutorChallengeProps> = ({
  content,
  description,
  instructions,
  onSubmit,
}) => {
  const executor = content.executor
  const program = content.program || ''

  const {
    code,
    isLoading,
    feedback,
    isCorrect,
    steps,
    canSubmit,
    handleCodeChange,
    handleSubmit,
  } = useExecutorChallenge(onSubmit, program)
  const start = content.executor?.start ?? content.start ?? 0
  const target = content.executor?.target ?? content.target ?? 0

  if (!executor) {
    return <div>Ошибка: данные задания не загружены</div>
  }

  return (
    <ChallengeContainer>
      <TheoryPanel>
        <ExecutorTheory
          executorName={executor.name}
          commands={executor.commands}
          program={program}
          start={start}
          target={target}
          unknowns={content.unknowns}
          description={description}
          instructions={instructions}
          videoUrl={content.videoUrl}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          isLoading={isLoading}
        />
      </TheoryPanel>

      <EditorPanel>
        <ExecutorEditor
          value={code}
          onChange={handleCodeChange}
          language="python"
        />
      </EditorPanel>

      <OutputPanel>
        <ExecutorOutput
          steps={steps}
          isCorrect={isCorrect}
          feedback={feedback}
          isLoading={isLoading}
          code={code}
        />
      </OutputPanel>

    </ChallengeContainer>
  )
}
