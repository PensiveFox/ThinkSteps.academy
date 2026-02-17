import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { createProxyMiddleware } from 'http-proxy-middleware'
import './prisma'
import { setupGraphqlServer } from './graphqlServer'
import { initN8n, stopN8n } from './n8n'
import { runBootstrap } from './n8n/bootstrap'
import { setupSignalingServer } from './notebook/signaling'

const withN8N = process.env.N8N_ENABLED === 'true'

const cwd = process.cwd()
const port = (process.env.PORT && parseInt(process.env.PORT, 10)) || 3000
const dev = process.env.NODE_ENV !== 'production'
const apiOnly = process.env.API_ONLY === 'true'

let stopGraphql: (() => Promise<void>) | null = null
let stopping = false

function setupShutdown() {
  const shutdown = async (signal: string) => {
    if (stopping) {
      return
    }
    stopping = true
    // eslint-disable-next-line no-console
    console.log(`\n[server] Received ${signal}, shutting down...`)

    await stopN8n()

    if (stopGraphql) {
      await stopGraphql()
    }

    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

async function startServer() {
  setupShutdown()

  // Start GraphQL server with WebSocket support
  const { port: graphqlPort, stop } = await setupGraphqlServer()
  stopGraphql = stop

  if (withN8N) {
    // Start n8n as child process (waits for API to be ready)
    await initN8n()

    // Run bootstrap (create owner, import credentials if needed)
    await runBootstrap()
  }

  const app = express()
  const httpServer = createServer(app)

  // Attach notebook signaling WebSocket to the main HTTP server
  setupSignalingServer(httpServer)

  // Proxy to n8n (webhook, webhook-test, mcp)
  const n8nUrl = process.env.N8N_URL || 'http://localhost:5678'
  const n8nProxy = createProxyMiddleware({
    target: n8nUrl,
    changeOrigin: true,
    pathRewrite: (_path, req) => {
      // @ts-expect-error types
      return req.originalUrl
    },
  })

  app.use('/webhook', n8nProxy)
  app.use('/webhook-test', n8nProxy)
  app.use('/mcp', n8nProxy)

  // Static files from shared (uploads, not tracked)
  app.use(express.static(cwd + '/shared'))

  // Proxy /api to GraphQL server (HTTP + WebSocket)
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://localhost:${graphqlPort}/api`,
      changeOrigin: true,
      ws: false,
    }),
  )

  if (!apiOnly) {
    // Otherwise, start full server with Next.js
    const next = (await import('next')).default
    const nextApp = next({ dev })
    const handle = nextApp.getRequestHandler()

    await nextApp.prepare()

    // Next.js handles everything else
    app.get('*', (req, res) => {
      return handle(req, res)
    })
  }

  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Ready on http://localhost:${port}, API at /api`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
