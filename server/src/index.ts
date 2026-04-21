import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

// Routes
import authRoutes from './routes/auth'
import formRoutes from './routes/forms'
import submissionRoutes from './routes/submissions'
import stripeRoutes from './routes/stripe'

// Middleware
import { rawBodyMiddleware } from './middleware/rawBody'

const app = express()
const httpServer = createServer(app)

// ── Socket.io ──────────────────────────────────────────────────────────────
// Attach to the same HTTP server so WebSocket upgrades work on the same port.
// In production on Azure App Service, set WEBSITE_HTTPLOGGING_RETENTION_DAYS
// and ensure sticky sessions are ON (required for Socket.io polling fallback).
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})

io.on('connection', (socket) => {
  // Clients join a room named after the formId they're watching
  socket.on('watch_form', (formId: string) => {
    void socket.join(`form:${formId}`)
  })
  socket.on('unwatch_form', (formId: string) => {
    void socket.leave(`form:${formId}`)
  })
})

// ── Middleware ─────────────────────────────────────────────────────────────

// SECURITY: The Stripe webhook route MUST receive the raw body for signature
// verification. Register rawBodyMiddleware BEFORE express.json() and only for
// the webhook path. Any JSON parsing of the body before stripe.webhooks.constructEvent()
// will break the HMAC check and cause all webhook events to be rejected.
app.post(
  '/api/stripe/webhook',
  rawBodyMiddleware,
  // Handler is defined in stripeRoutes — imported below
)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/forms', formRoutes)
app.use('/api/forms', submissionRoutes)
app.use('/api/stripe', stripeRoutes)

// Health check — used by Azure App Service health probes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10)
httpServer.listen(PORT, () => {
  console.log(`FormFlow server running on port ${PORT}`)
})

export default app
