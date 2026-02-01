import styled from 'styled-components'

export const TheoryContainer = styled.div`
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
  height: 100%;
`

export const TitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`

export const Title = styled.h2`
  margin: 0;
  color: #2c3e50;
`

export const SubmitButton = styled.button<{ disabled?: boolean }>`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  color: white;
  background: ${(props) => (props.disabled ? '#999' : '#007acc')};
  border: none;
  border-radius: 6px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.disabled ? '#999' : '#005a9e')};
  }
`

export const Section = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

export const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #34495e;
  font-size: 18px;
`

export const CommandList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 8px 0;
`

export const CommandItem = styled.li`
  padding: 8px 12px;
  margin: 6px 0;
  background: #ecf0f1;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
`

export const CodeValue = styled.code`
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  color: #e74c3c;
`

export const Description = styled.div`
  line-height: 1.6;
  color: #555;
`

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`

export const GridItem = styled.div`
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`
