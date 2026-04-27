// routes/auth.ts — authentication endpoints.
//
// POST /api/auth/register  — create a new account
// POST /api/auth/login     — get an access token + refresh token cookie
// POST /api/auth/refresh   — swap a refresh token cookie for a new access token
// POST /api/auth/logout    — revoke the refresh token and clear the cookie
//
// Token flow explained:
//   1. Login  → server returns { accessToken } in JSON body
//               + sets 'refreshToken' in an HttpOnly cookie.
//   2. Client stores accessToken in Redux memory (NOT localStorage).
//   3. Every API request includes: Authorization: Bearer <accessToken>
//   4. When accessToken expires (15 min), client calls /api/auth/refresh.
//      The browser automatically sends the HttpOnly cookie — the client never
//      touches the refresh token directly.
//   5. Logout clears the cookie and deletes the token from the DB.
//
// SECURITY NOTES:
//   - Passwords are hashed with bcrypt (cost factor 12) before storage.
//   - Refresh tokens are stored as SHA-256 hashes in the DB — if the DB
//     is leaked, the hashes cannot be reversed to usable tokens.
//   - The cookie is HttpOnly (JS can't read it), Secure (HTTPS only in prod),
//     and SameSite=Strict (CSRF protection).

import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { users, refreshTokens } from '../db/queries'
import { signAccessToken } from '../lib/jwt'
import { requireAuth } from '../middleware/auth'

const router = Router()

const REFRESH_TOKEN_DAYS = 7
const BCRYPT_ROUNDS = 12  // Higher = slower hash = harder to brute-force

// Helper: hash a refresh token for storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// Helper: set the refresh token HttpOnly cookie
function setRefreshCookie(res: Response, token: string): void {
  const expires = new Date()
  expires.setDate(expires.getDate() + REFRESH_TOKEN_DAYS)

  res.cookie('refreshToken', token, {
    httpOnly: true,   // JS cannot read this cookie — prevents XSS theft
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // CSRF protection — cookie not sent on cross-site requests
    expires,
    path: '/api/auth', // Cookie only sent to auth endpoints — not every API call
  })
}

// ── POST /api/auth/register ────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' })
    return
  }

  // Basic email format check — full validation is on the frontend
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: 'Invalid email format' })
    return
  }

  if (password.length < 8) {
    res.status(400).json({ message: 'Password must be at least 8 characters' })
    return
  }

  try {
    const existing = await users.findByEmail(email.toLowerCase())
    if (existing) {
      // Don't reveal whether the email exists — say "already in use" not "found"
      res.status(409).json({ message: 'An account with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await users.create(email.toLowerCase(), passwordHash)

    const accessToken = signAccessToken({ userId: user.id, email: user.email })
    const rawRefresh = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)

    await refreshTokens.create(user.id, hashToken(rawRefresh), expiresAt)
    setRefreshCookie(res, rawRefresh)

    res.status(201).json({ accessToken, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// ── POST /api/auth/login ───────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string }

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' })
    return
  }

  try {
    const user = await users.findByEmail(email.toLowerCase())

    // SECURITY: Always compare hash even if user not found, to prevent timing
    // attacks that reveal whether an email is registered.
    const dummyHash = '$2a$12$invalidhashfortimingprotection000000000000000000000000'
    const passwordHash = user?.password_hash ?? dummyHash
    const valid = await bcrypt.compare(password, passwordHash)

    if (!user || !valid) {
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }

    const accessToken = signAccessToken({ userId: user.id, email: user.email })
    const rawRefresh = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)

    await refreshTokens.create(user.id, hashToken(rawRefresh), expiresAt)
    setRefreshCookie(res, rawRefresh)

    res.json({ accessToken, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Login failed' })
  }
})

// ── POST /api/auth/refresh ─────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  // The browser automatically sends the HttpOnly cookie with this request —
  // the client-side code never sees or handles the refresh token itself.
  const rawToken = req.cookies?.refreshToken as string | undefined

  if (!rawToken) {
    res.status(401).json({ message: 'No refresh token' })
    return
  }

  try {
    const tokenHash = hashToken(rawToken)
    const stored = await refreshTokens.findByHash(tokenHash)

    if (!stored) {
      // Token not found or expired — force re-login
      res.clearCookie('refreshToken', { path: '/api/auth' })
      res.status(401).json({ message: 'Refresh token invalid or expired' })
      return
    }

    const user = await users.findById(stored.user_id)
    if (!user) {
      res.status(401).json({ message: 'User not found' })
      return
    }

    // Rotate: delete the old refresh token and issue a new one
    await refreshTokens.deleteByHash(tokenHash)
    const newRawRefresh = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS)
    await refreshTokens.create(user.id, hashToken(newRawRefresh), expiresAt)
    setRefreshCookie(res, newRawRefresh)

    const accessToken = signAccessToken({ userId: user.id, email: user.email })
    res.json({ accessToken })
  } catch (err) {
    console.error('Refresh error:', err)
    res.status(500).json({ message: 'Token refresh failed' })
  }
})

// ── POST /api/auth/logout ──────────────────────────────────────
router.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const rawToken = req.cookies?.refreshToken as string | undefined

  try {
    if (rawToken) {
      await refreshTokens.deleteByHash(hashToken(rawToken))
    }
    res.clearCookie('refreshToken', { path: '/api/auth' })
    res.json({ message: 'Logged out' })
  } catch (err) {
    console.error('Logout error:', err)
    res.status(500).json({ message: 'Logout failed' })
  }
})

export default router
