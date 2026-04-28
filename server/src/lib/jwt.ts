// lib/jwt.ts — JWT (JSON Web Token) helper functions.
//
// What is a JWT?
// A JWT is a signed string that contains a payload (any JSON data you choose).
// The signature proves the server created it — anyone can READ a JWT, but only
// the server (which holds the secret key) can CREATE a valid one.
//
// FormFlow uses two types of tokens:
//
//   Access token  — short-lived (15 min), sent in the Authorization header on
//                   every API request. Lives in Redux memory only, never in
//                   localStorage (XSS protection).
//
//   Refresh token — long-lived (7 days), stored in an HttpOnly cookie (JS cannot
//                   read it — XSS protection). Used only to get a new access token
//                   via POST /api/auth/refresh. A hash of it is stored in the DB
//                   so we can revoke it (logout).
//
// SECURITY: JWT_SECRET must be a long random string (32+ chars).
// Never commit the real value — keep it in environment variables only.

import jwt from 'jsonwebtoken'
import type { AuthPayload } from '../middleware/auth'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    // In production this would crash the server intentionally.
    // In dev, fall back to a placeholder so tsc/tests can run.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production')
    }
    return 'dev-secret-not-for-production'
  }
  return secret
}

// Creates a short-lived access token (15 minutes).
// The payload contains the user's ID and email — enough to identify them
// without hitting the database on every request.
export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '15m' })
}

// Verifies an access token and returns its payload.
// Throws if the token is invalid or expired.
export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, getSecret()) as AuthPayload
}
