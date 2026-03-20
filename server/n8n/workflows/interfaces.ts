import type { IWorkflowBase } from 'n8n-workflow'

export type WorkflowBase = Omit<
  IWorkflowBase,
  'id' | 'isArchived' | 'createdAt' | 'updatedAt' | 'activeVersionId'
>

export type CredentialsMap = Record<
  string,
  Record<string, unknown> & {
    id: string | undefined
    type: string | undefined
    name: string | undefined
  }
>

export abstract class WorkflowFactory {
  credentialId: string | undefined
  abstract createWorkflow(credentials: CredentialsMap): Promise<WorkflowBase>
}

export function isWorkflowFactoryClass(
  obj: unknown,
): obj is new () => WorkflowFactory {
  return typeof obj === 'function' && obj.prototype instanceof WorkflowFactory
}
