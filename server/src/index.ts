import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
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
// In production on Azure App Service, ensure sticky sessions are ON —
// this is required for Socket.io's long-polling fallback when WebSockets fail.
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})

io.on('connection', (socket) => {
  // Clients join a room named after the formId they're watching.
  // When a new submission arrives, we emit to that room (see submissions.ts).
  socket.on('watch_form', (formId: string) => {
    void socket.join(`form:${formId}`)
  })
  socket.on('unwatch_form', (formId: string) => {
    void socket.leave(`form:${formId}`)
  })
})

// ── Middleware ─────────────────────────────────────────────────────────────

// SECURITY: The Stripe webhook route MUST receive the raw request body.
// Register rawBodyMiddleware BEFORE express.json() and ONLY for the webhook path.
// If express.json() runs first, it consumes the body stream and the raw bytes
// are gone — stripe.webhooks.constructEvent() will then throw and reject all events.
app.post('/api/stripe/webhook', rawBodyMiddleware)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true, // Required so browsers send the HttpOnly refresh token cookie
  })
)

// cookieParser lets req.cookies work — needed for reading the refresh token cookie
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes)
app.use('/api/forms',  formRoutes)
app.use('/api/forms',  submissionRoutes)
app.use('/api/stripe', stripeRoutes)

// Health check — used by Azure App Service to verify the server is alive.
// Azure pings this URL every 60 seconds. If it returns non-200, the instance
// is restarted automatically.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10)
httpServer.listen(PORT, () => {
  console.log(`✓ FormFlow server running on http://localhost:${PORT}`)
})

export default app
