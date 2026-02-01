import { useCallback } from 'react'

export const useExecutorEditor = (onChange: (value: string) => void) => {
  const handleEditorChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange(newValue)
      }
    },
    [onChange]
  )

  return {
    handleEditorChange,
  }
}
