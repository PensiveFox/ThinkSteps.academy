import styled from 'styled-components'

export const OutputContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  color: #d4d4d4;
`

export const OutputHeader = styled.div`
  padding: 10px 15px;
  background: #2d2d30;
  color: #cccccc;
  font-size: 14px;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const OutputContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 15px;
`

export const StepItem = styled.div`
  padding: 8px 12px;
  margin: 6px 0;
  background: #252526;
  border-left: 3px solid #007acc;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
`

export const StepNumber = styled.span`
  color: #4ec9b0;
  font-weight: bold;
  margin-right: 8px;
`

export const StepCommand = styled.span`
  color: #dcdcaa;
  margin-right: 8px;
`

export const StepExpression = styled.div`
  color: #ce9178;
  margin-top: 4px;
  font-size: 14px;
`

export const FeedbackBox = styled.div<{ isCorrect: boolean }>`
  padding: 15px;
  margin: 10px 0;
  border-radius: 8px;
  background: ${(props) => (props.isCorrect ? '#1e4620' : '#4a1e1e')};
  border: 1px solid ${(props) => (props.isCorrect ? '#2ea043' : '#f85149')};
  color: ${(props) => (props.isCorrect ? '#7ee787' : '#ffa198')};
`

export const FeedbackTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 16px;
`

export const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #858585;
`

export const LoadingState = styled.div`
  text-align: center;
  padding: 20px;
  color: #858585;
`
