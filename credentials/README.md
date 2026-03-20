# Credentials

## Structure

```
credentials/
├── system/           # n8n system credentials (OpenRouter, etc.)
├── agents/           # Agent credentials (Internal API auth)
├── bootstrap.env     # n8n owner setup
└── README.md
```

## system/

n8n credentials in JSON format. The `id` field is used to link credentials to workflow factories.

```json
[
  {
    "id": "openrouter-cred",
    "name": "OpenRouter",
    "type": "openRouterApi",
    "data": { "apiKey": "sk-or-v1-xxx" }
  }
]
```

### Telegram

Default credential ID: `telegram-main-bot`

This ID is used by `TelegramHandlerWorkflow` to find the Telegram bot credentials.

```json
[
  {
    "id": "telegram-main-bot",
    "name": "MyBot",
    "type": "telegramApi",
    "data": {
      "accessToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
    }
  }
]
```

### Credential ID and WorkflowFactory

Workflow factories (`WorkflowFactory` classes) can define a static `credentialId` property to specify which credential they need. During bootstrap, the system passes all loaded credentials to `createWorkflow()`, and the factory uses its `credentialId` to find the right one.

Example:
```typescript
class TelegramHandlerWorkflow extends WorkflowFactory {
  static credentialId = 'telegram-main-bot'
  
  createWorkflow(credentials: CredentialsMap): WorkflowBase {
    const creds = credentials[TelegramHandlerWorkflow.credentialId]
    // ...
  }
}
```

To use a different Telegram bot, create a new workflow class with a different `credentialId`.

## agents/

Agent auth credentials:

```json
{
  "username": "agent-name",
  "password": "password",
  "email": "agent@example.com",
  "fullname": "Agent Name"
}
```

Bootstrap creates `httpHeaderAuth` credential with JWT token.

## bootstrap.env

```
N8N_BOOTSTRAP_OWNER_EMAIL=admin@example.com
N8N_BOOTSTRAP_OWNER_PASSWORD=AdminPassword123!
N8N_BOOTSTRAP_OWNER_FIRSTNAME=Admin
N8N_BOOTSTRAP_OWNER_LASTNAME=User
```

## Security

- All credential files are gitignored
