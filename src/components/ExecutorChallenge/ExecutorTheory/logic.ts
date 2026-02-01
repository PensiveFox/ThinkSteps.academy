import { Command } from './interfaces'

export const useExecutorTheory = () => {
  const getCommandDescription = (cmd: Command): string => {
    const opNames = {
      mul: 'умножить на',
      add: 'прибавить',
      sub: 'вычесть',
      div: 'разделить на',
    }

    const opName = opNames[cmd.op] || cmd.op
    const value = cmd.var || cmd.k

    return `${opName} ${value}`
  }

  return {
    getCommandDescription,
  }
}
