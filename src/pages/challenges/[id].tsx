import { useCallback } from 'react'
import { useRouter } from 'next/router'
import {
  useChallengeQuery,
  useStartChallengeMutation,
  useSubmitChallengeStepMutation,
} from 'src/gql/generated'
import { useAppContext } from 'src/components/AppContext'
import { ExecutorChallenge } from 'src/components/ExecutorChallenge'

interface Command {
  op: 'mul' | 'add' | 'sub' | 'div'
  k?: number
  var?: string
}

interface Executor {
  name: string
  commands: Record<string, Command>
  start?: number
  target?: number
}

interface ChallengeContent {
  executor?: Executor
  program?: string
  start?: number
  target?: number
  unknowns?: Record<string, unknown>
}

export default function ChallengePage() {
  const router = useRouter()
  const challengeId = router.query.id as string
  const { openLoginForm } = useAppContext()

  const { data, loading, error } = useChallengeQuery({
    variables: { where: { id: challengeId } },
    skip: !challengeId,
  })

  const [startChallenge] = useStartChallengeMutation()
  const [submitStep] = useSubmitChallengeStepMutation()

  const challenge = data?.challenge
  const content = challenge?.content as ChallengeContent | null | undefined

  const handleSubmit = useCallback(
    async (answer: { b: number }) => {
      if (!challengeId || !challenge?.steps?.[0]) {
        throw new Error('Challenge not loaded')
      }

      try {
        await startChallenge({
          variables: { challengeId },
        })
      } catch {
        // Challenge already started or error - continue
      }

      const result = await submitStep({
        variables: {
          input: {
            challengeId,
            order: challenge.steps[0].order ?? 1,
            answer,
          },
        },
      })

      const payload = result.data?.submitChallengeStep as any
      if (!payload) {
        throw new Error('No response from server')
      }

      return {
        isCorrect: payload.isCorrect ?? false,
        feedback: payload.feedback || '',
        trace: payload.trace,
      }
    },
    [challengeId, challenge?.steps, startChallenge, submitStep]
  )

  if (loading) {
    return <div>Loading...</div>
  }
  if (error) {
    const isAuthError = error.message.includes('Authentication required')
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Ошибка</h1>
        <p>{error.message}</p>
        {isAuthError && (
          <button
            onClick={openLoginForm}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Войти
          </button>
        )}
      </div>
    )
  }
  if (!challenge) {
    return <div>Challenge not found</div>
  }

  if (!content) {
    return <div>Challenge content not found</div>
  }

  return (
    <ExecutorChallenge
      content={content}
      description={challenge.description || undefined}
      instructions={challenge.instructions || undefined}
      onSubmit={handleSubmit}
    />
  )
}
