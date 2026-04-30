// db/queries.ts — all database operations for FormFlow.
//
// SECURITY: Every value that comes from user input goes through
// `request.input(name, type, value)` — mssql's parameterized query API.
// This means the value is sent separately from the SQL text and the
// database driver handles escaping. String concatenation into SQL is
// NEVER done here, which prevents SQL injection attacks entirely.
//
// Organisation: one namespace per table (users, forms, submissions, refreshTokens).

import { getPool, sql } from './client'
import type { Step } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { nanoid } from 'nanoid'

// ── Shared row types (what comes back from the DB) ────────────

export interface UserRow {
  id: string
  email: string
  password_hash: string
  created_at: Date
}

export interface FormRow {
  id: string
  owner_id: string
  title: string
  description: string | null
  steps: string               // JSON string — parse before returning to client
  has_payment_step: boolean
  payment_amount: number | null
  payment_currency: string | null
  payment_description: string | null
  is_published: boolean
  embed_key: string
  created_at: Date
  updated_at: Date
}

export interface SubmissionRow {
  id: string
  form_id: string
  data: string                // JSON string
  stripe_payment_intent_id: string | null
  payment_status: string | null
  ip_hash: string | null
  submitted_at: Date
}

export interface RefreshTokenRow {
  id: string
  user_id: string
  token_hash: string
  expires_at: Date
  created_at: Date
}

// ── Users ──────────────────────────────────────────────────────

export const users = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('email', sql.NVarChar(255), email)
      .query<UserRow>('SELECT * FROM users WHERE email = @email')
    return result.recordset[0] ?? null
  },

  async findById(id: string): Promise<UserRow | null> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query<UserRow>('SELECT * FROM users WHERE id = @id')
    return result.recordset[0] ?? null
  },

  async create(email: string, passwordHash: string): Promise<UserRow> {
    const pool = await getPool()
    const id = uuidv4()
    await pool
      .request()
      .input('id',            sql.UniqueIdentifier, id)
      .input('email',         sql.NVarChar(255),    email)
      .input('password_hash', sql.NVarChar(255),    passwordHash)
      .query(
        'INSERT INTO users (id, email, password_hash) VALUES (@id, @email, @password_hash)'
      )
    const created = await users.findById(id)
    if (!created) throw new Error('User creation failed')
    return created
  },
}

// ── Forms ──────────────────────────────────────────────────────

export interface CreateFormInput {
  title: string
  description?: string
  steps: Step[]
  hasPaymentStep: boolean
  paymentAmount?: number
  paymentCurrency?: string
  paymentDescription?: string
}

export const forms = {
  async listByOwner(ownerId: string): Promise<FormRow[]> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('owner_id', sql.UniqueIdentifier, ownerId)
      .query<FormRow>(
        `SELECT id, owner_id, title, description, is_published, embed_key,
                created_at, updated_at,
                (SELECT COUNT(*) FROM submissions WHERE form_id = forms.id) AS submission_count
         FROM forms
         WHERE owner_id = @owner_id
         ORDER BY updated_at DESC`
      )
    return result.recordset
  },

  async getById(id: string): Promise<FormRow | null> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query<FormRow>('SELECT * FROM forms WHERE id = @id')
    return result.recordset[0] ?? null
  },

  // Public fetch — only returns published forms.
  // Used by the embed script (no auth required).
  async getPublic(id: string): Promise<FormRow | null> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query<FormRow>(
        'SELECT * FROM forms WHERE id = @id AND is_published = 1'
      )
    return result.recordset[0] ?? null
  },

  async create(ownerId: string, input: CreateFormInput): Promise<FormRow> {
    const pool = await getPool()
    const id = uuidv4()
    const embedKey = nanoid(16)   // Short random public key for the embed script tag
    const stepsJson = JSON.stringify(input.steps)

    await pool
      .request()
      .input('id',                  sql.UniqueIdentifier, id)
      .input('owner_id',            sql.UniqueIdentifier, ownerId)
      .input('title',               sql.NVarChar(255),    input.title)
      .input('description',         sql.NVarChar(1000),   input.description ?? null)
      .input('steps',               sql.NVarChar(sql.MAX), stepsJson)
      .input('has_payment_step',    sql.Bit,              input.hasPaymentStep ? 1 : 0)
      .input('payment_amount',      sql.Int,              input.paymentAmount ?? null)
      .input('payment_currency',    sql.NVarChar(10),     input.paymentCurrency ?? 'usd')
      .input('payment_description', sql.NVarChar(500),    input.paymentDescription ?? null)
      .input('embed_key',           sql.NVarChar(50),     embedKey)
      .query(
        `INSERT INTO forms
           (id, owner_id, title, description, steps, has_payment_step,
            payment_amount, payment_currency, payment_description, embed_key)
         VALUES
           (@id, @owner_id, @title, @description, @steps, @has_payment_step,
            @payment_amount, @payment_currency, @payment_description, @embed_key)`
      )

    const created = await forms.getById(id)
    if (!created) throw new Error('Form creation failed')
    return created
  },

  async update(id: string, input: Partial<CreateFormInput>): Promise<FormRow> {
    const pool = await getPool()
    const req = pool
      .request()
      .input('id',         sql.UniqueIdentifier, id)
      .input('updated_at', sql.DateTime2,        new Date())

    const setClauses: string[] = ['updated_at = @updated_at']

    if (input.title !== undefined) {
      req.input('title', sql.NVarChar(255), input.title)
      setClauses.push('title = @title')
    }
    if (input.description !== undefined) {
      req.input('description', sql.NVarChar(1000), input.description)
      setClauses.push('description = @description')
    }
    if (input.steps !== undefined) {
      req.input('steps', sql.NVarChar(sql.MAX), JSON.stringify(input.steps))
      setClauses.push('steps = @steps')
    }
    if (input.hasPaymentStep !== undefined) {
      req.input('has_payment_step', sql.Bit, input.hasPaymentStep ? 1 : 0)
      setClauses.push('has_payment_step = @has_payment_step')
    }
    if (input.paymentAmount !== undefined) {
      req.input('payment_amount', sql.Int, input.paymentAmount)
      setClauses.push('payment_amount = @payment_amount')
    }
    if (input.paymentDescription !== undefined) {
      req.input('payment_description', sql.NVarChar(500), input.paymentDescription)
      setClauses.push('payment_description = @payment_description')
    }

    await req.query(
      `UPDATE forms SET ${setClauses.join(', ')} WHERE id = @id`
    )

    const updated = await forms.getById(id)
    if (!updated) throw new Error('Form not found after update')
    return updated
  },

  async delete(id: string): Promise<void> {
    const pool = await getPool()
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query('DELETE FROM forms WHERE id = @id')
  },

  async setPublished(id: string, isPublished: boolean): Promise<void> {
    const pool = await getPool()
    await pool
      .request()
      .input('id',           sql.UniqueIdentifier, id)
      .input('is_published', sql.Bit,              isPublished ? 1 : 0)
      .query('UPDATE forms SET is_published = @is_published WHERE id = @id')
  },
}

// ── Submissions ────────────────────────────────────────────────

export const submissions = {
  async create(
    formId: string,
    data: Record<string, unknown>,
    ipHash?: string,
    paymentIntentId?: string
  ): Promise<SubmissionRow> {
    const pool = await getPool()
    const id = uuidv4()
    // When a paymentIntentId is provided the status starts as 'pending'.
    // The Stripe webhook will update it to 'paid' or 'failed' once Stripe
    // confirms the charge.
    const paymentStatus = paymentIntentId ? 'pending' : null
    await pool
      .request()
      .input('id',                       sql.UniqueIdentifier, id)
      .input('form_id',                  sql.UniqueIdentifier, formId)
      .input('data',                     sql.NVarChar(sql.MAX), JSON.stringify(data))
      .input('ip_hash',                  sql.NVarChar(64),     ipHash ?? null)
      .input('stripe_payment_intent_id', sql.NVarChar(255),    paymentIntentId ?? null)
      .input('payment_status',           sql.NVarChar(50),     paymentStatus)
      .query(
        `INSERT INTO submissions
           (id, form_id, data, ip_hash, stripe_payment_intent_id, payment_status)
         VALUES
           (@id, @form_id, @data, @ip_hash, @stripe_payment_intent_id, @payment_status)`
      )

    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query<SubmissionRow>('SELECT * FROM submissions WHERE id = @id')
    const created = result.recordset[0]
    if (!created) throw new Error('Submission creation failed')
    return created
  },

  // Called by the Stripe webhook when payment_intent.succeeded or
  // payment_intent.payment_failed fires.  Finds the submission that was
  // created with this paymentIntentId and updates its status.
  async updatePaymentStatus(paymentIntentId: string, status: string): Promise<void> {
    const pool = await getPool()
    await pool
      .request()
      .input('stripe_payment_intent_id', sql.NVarChar(255), paymentIntentId)
      .input('payment_status',           sql.NVarChar(50),  status)
      .query(
        `UPDATE submissions
         SET payment_status = @payment_status
         WHERE stripe_payment_intent_id = @stripe_payment_intent_id`
      )
  },

  async listByFormId(formId: string): Promise<SubmissionRow[]> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('form_id', sql.UniqueIdentifier, formId)
      .query<SubmissionRow>(
        'SELECT * FROM submissions WHERE form_id = @form_id ORDER BY submitted_at DESC'
      )
    return result.recordset
  },
}

// ── Refresh tokens ─────────────────────────────────────────────

export const refreshTokens = {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const pool = await getPool()
    await pool
      .request()
      .input('id',         sql.UniqueIdentifier, uuidv4())
      .input('user_id',    sql.UniqueIdentifier, userId)
      .input('token_hash', sql.NVarChar(255),    tokenHash)
      .input('expires_at', sql.DateTime2,        expiresAt)
      .query(
        'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (@id, @user_id, @token_hash, @expires_at)'
      )
  },

  async findByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .query<RefreshTokenRow>(
        'SELECT * FROM refresh_tokens WHERE token_hash = @token_hash AND expires_at > GETUTCDATE()'
      )
    return result.recordset[0] ?? null
  },

  async deleteByHash(tokenHash: string): Promise<void> {
    const pool = await getPool()
    await pool
      .request()
      .input('token_hash', sql.NVarChar(255), tokenHash)
      .query('DELETE FROM refresh_tokens WHERE token_hash = @token_hash')
  },

  // Called on logout — removes ALL sessions for this user
  async deleteByUserId(userId: string): Promise<void> {
    const pool = await getPool()
    await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query('DELETE FROM refresh_tokens WHERE user_id = @user_id')
  },
}
