import React from 'react'
import dynamic from 'next/dynamic'
import { ExecutorEditorProps } from './interfaces'
import { useExecutorEditor } from './logic'
import { EditorContainer, EditorHeader, EditorWrapper } from './styles'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
})

export const ExecutorEditorView: React.FC<ExecutorEditorProps> = ({
  value,
  onChange,
  language = 'python',
  readOnly = false,
}) => {
  const { handleEditorChange } = useExecutorEditor(onChange)

  return (
    <EditorContainer>
      <EditorHeader>
        Решение (см. пример слева)
      </EditorHeader>
      <EditorWrapper>
        <MonacoEditor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            readOnly,
            wordWrap: 'on',
            tabSize: 4,
          }}
        />
      </EditorWrapper>
    </EditorContainer>
  )
}
