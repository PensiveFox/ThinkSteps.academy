# Workflow Bootstrap

How workflows are loaded and imported into n8n during application startup.

## Location

```
server/n8n/bootstrap/
├── index.ts              # Main bootstrap entry point
├── importWorkflows.ts    # Workflow loading and import logic
├── authenticateAgent.ts  # Agent credentials setup
└── n8nApiRequest.ts      # n8n API helper
```

## Bootstrap Flow

1. **Load credentials** from `credentials/system/` → returns `CredentialsMap`
2. **Import agent credentials** (JWT tokens for agents)
3. **Import workflows** — passes `CredentialsMap` to workflow factories
4. **Cleanup credentials** (optional, if `DELETE_CREDENTIALS_AFTER_IMPORT` is set)

## Workflow Types

Bootstrap supports two types of workflow definitions:

### 1. Static JSON / Object (WorkflowBase)

Simple workflow definition as a plain object. Used when no dynamic configuration is needed.

```typescript
// server/n8n/workflows/my-workflow/index.ts
import { WorkflowBase } from '../interfaces'

const workflow: WorkflowBase = {
  name: 'My Workflow',
  active: true,
  versionId: 'my-workflow-v1',
  nodes: [...],
  connections: {...},
}

export default workflow
```

### 2. WorkflowFactory Class

Dynamic workflow generation with access to credentials. Used when workflow needs credentials or other dynamic configuration.

```typescript
// server/n8n/workflows/telegram-handler/index.ts
import {
  WorkflowBase,
  WorkflowFactory,
  CredentialsMap,
} from '../interfaces'

class TelegramHandlerWorkflow extends WorkflowFactory {
  static credentialId = 'telegram-main-bot'

  async createWorkflow(credentials: CredentialsMap): Promise<WorkflowBase> {
    const creds = credentials[TelegramHandlerWorkflow.credentialId]
    if (!creds) {
      throw new Error(`Credentials '${TelegramHandlerWorkflow.credentialId}' not found`)
    }

    return {
      name: 'Telegram handler',
      active: true,
      nodes: [
        {
          // ... use creds.id, creds.name
          credentials: {
            telegramApi: {
              id: creds.id as string,
              name: creds.name as string,
            },
          },
        },
      ],
      // ...
    }
  }
}

export default TelegramHandlerWorkflow
```

## Interfaces

```typescript
// server/n8n/workflows/interfaces.ts

// Credentials map: credentialId → credential data
type CredentialsMap = Record<string, Record<string, unknown>>

// Base class for dynamic workflow factories
abstract class WorkflowFactory {
  static credentialId?: string
  abstract createWorkflow(credentials: CredentialsMap): Promise<WorkflowBase>
}

// Type guard for WorkflowFactory classes
function isWorkflowFactoryClass(obj: unknown): obj is new () => WorkflowFactory
```

## Credential ID Convention

- Credential ID is defined in `credentials/system/*.json` files
- WorkflowFactory classes reference credentials by their `id` field
- Default Telegram credential ID: `telegram-main-bot`

See [credentials/README.md](../../../credentials/README.md) for credential format and examples.

## How loadWorkflow Works

```typescript
async function loadWorkflow(entry: string, credentialsMap: CredentialsMap) {
  // 1. If JSON file — parse and return
  if (entry.endsWith('.json')) {
    return [JSON.parse(fs.readFileSync(...))]
  }

  // 2. If directory with index.ts/index.js — import module
  const module = await import(fullPath)
  const exported = module.default || module

  // 3. If WorkflowFactory class — instantiate and call createWorkflow
  if (isWorkflowFactoryClass(exported)) {
    const factory = new exported()
    return [await factory.createWorkflow(credentialsMap)]
  }

  // 4. Otherwise — return as WorkflowBase object
  return [exported]
}
```

## When to Use WorkflowFactory

Use `WorkflowFactory` when:
- Workflow needs credentials (API keys, tokens)
- Workflow configuration depends on environment
- Multiple similar workflows with different credentials (e.g., multiple Telegram bots)

Use static `WorkflowBase` when:
- Workflow has no external dependencies
- Configuration is fully static
