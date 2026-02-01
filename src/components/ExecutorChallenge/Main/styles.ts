import styled from 'styled-components'

export const ChallengeContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0;
  height: 100vh;
  width: 100%;
  background: #1e1e1e;
`

export const TheoryPanel = styled.div`
  grid-column: 1;
  border-right: 1px solid #3e3e42;
  overflow: hidden;
`

export const EditorPanel = styled.div`
  grid-column: 2;
  border-right: 1px solid #3e3e42;
  overflow: hidden;
`

export const OutputPanel = styled.div`
  grid-column: 3;
  overflow: hidden;
`

export const ControlBar = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
`

export const SubmitButton = styled.button<{ disabled?: boolean }>`
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background: ${(props) => (props.disabled ? '#555' : '#007acc')};
  border: none;
  border-radius: 6px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.disabled ? '#555' : '#005a9e')};
    transform: ${(props) => (props.disabled ? 'none' : 'translateY(-2px)')};
    box-shadow: ${(props) =>
      props.disabled ? '0 4px 8px rgba(0, 0, 0, 0.3)' : '0 6px 12px rgba(0, 0, 0, 0.4)'};
  }

  &:active {
    transform: ${(props) => (props.disabled ? 'none' : 'translateY(0)')};
  }
`
