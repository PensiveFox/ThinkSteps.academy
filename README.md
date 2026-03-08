# 🤖 AI Agent

Startup kit for rapid deployment of learning agents with conversational experimentation capabilities.

## ✨ Features

|     | Feature             | Description                                           |
| --- | ------------------- | ----------------------------------------------------- |
| 🧠  | **Memory System**   | 11-type MindLogs — agent learns and remembers context |
| 🔄  | **n8n Integration** | Custom AgentOrchestrator node with OpenAI SDK         |
| 🏭  | **Agent Factory**   | Generate new agents from TypeScript configs           |
| ⚡  | **Streaming**       | Real-time responses with tool call notifications      |
| 🛠️  | **Built-in Tools**  | File operations, GraphQL requests, web search         |
| 🔐  | **Auth Ready**      | JWT authentication out of the box                     |
| 🎨  | **Next.js Frontend**| Ready-to-deploy chat UI — build your site on top      |
| 🗄️  | **Supabase + Prisma**| Full backend with migrations and type-safe ORM       |

> &nbsp;
> 🚀 **Zero Config** — clone, install, run. No complex setup required.
>
> ⚠️ **Tested on Linux only.** Windows/macOS users: please [report issues](../../issues) if something doesn't work.
> &nbsp;

## 🎯 Who Is This For?

- 🔬 **AI Enthusiasts** — experiment with conversational agents
- 👨‍💻 **Developers** — study agent architecture and patterns
- 📚 **Students** — learn practical AI agent implementation
- 🧪 **Researchers** — test learning and memory systems

## Stack

- **Frontend**: Next.js 16 + React 18 + styled-components 6
- **Backend**: Express 4 + Apollo Server 5 + Pothos GraphQL
- **Database**: PostgreSQL + Prisma ORM 6
- **Auth**: JWT
- **n8n**: AI agents and workflow automation

## Getting Started

### Local Development

1. Copy environment file:
```bash
cp docker/.env.sample docker/.env
```


без BuildKit (DOCKER_BUILDKIT=0)
2. Start database:
```bash
cd docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build supabase
```

3. Start application:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build app
```

## Project Structure

```
├── src/                        # Frontend
│   ├── components/
│   ├── pages/
│   └── gql/                    # GraphQL queries and generated types
├── server/                     # Backend
│   ├── schema/                 # GraphQL schema (Pothos + Prisma)
│   └── n8n/                    # n8n integration
│       ├── bootstrap/          # Workflow import
│       ├── custom-nodes/       # Custom n8n nodes
│       └── workflows/          # Workflow definitions
│           ├── agent-chat/     # Main chat agent
│           ├── agent-web-search/ # Web search (Perplexity)
│           ├── agent-factory/  # Agent factory
│           └── tool-*/         # Tool workflows
├── prisma/                     # Database schema
└── credentials/                # n8n credentials
```

## n8n Integration

### Agents

- **Chat Agent** — main user interface
- **Web Search Agent** — internet search (Perplexity)

### Custom Nodes

Located in `server/n8n/custom-nodes/`. Rebuild after changes:

```bash
cd server/n8n/custom-nodes && npm run build
```

### Credentials

Before running, set up your API credentials in `credentials/`:

1. Create `credentials/system/openrouter.json`:
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

2. Create `credentials/bootstrap.env`:
```
N8N_BOOTSTRAP_OWNER_EMAIL=admin@example.com
N8N_BOOTSTRAP_OWNER_PASSWORD=YourPassword123!
N8N_BOOTSTRAP_OWNER_FIRSTNAME=Admin
N8N_BOOTSTRAP_OWNER_LASTNAME=User
```

See [credentials/README.md](credentials/README.md) for full documentation.

## Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
GRAPHQL_WS_PORT=4000
PORT=3000
```
# ThinkSteps.academy_new
