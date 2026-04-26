-- ============================================================
-- FormFlow — Azure SQL Schema
-- ============================================================
-- Run this script once against your Azure SQL database to create
-- all tables. Use Azure Data Studio, the Azure Portal query editor,
-- or the az sql command to execute it.
--
-- Azure SQL is SQL Server-compatible, so standard T-SQL syntax applies.
-- UNIQUEIDENTIFIER = UUID/GUID — globally unique IDs for every row.
-- NVARCHAR          = Unicode string — handles any language/emoji.
-- NVARCHAR(MAX)     = Up to 2GB text — used for JSON blobs (steps, data).
-- DATETIME2         = High-precision timestamp, always stored as UTC.
-- BIT               = Boolean (0 = false, 1 = true).
-- ============================================================

-- ── Users ─────────────────────────────────────────────────────
-- Stores FormFlow account credentials.
-- Passwords are NEVER stored in plain text — only bcrypt hashes.
CREATE TABLE users (
  id            UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWID(),
  email         NVARCHAR(255)     NOT NULL UNIQUE,
  password_hash NVARCHAR(255)     NOT NULL,
  created_at    DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

-- Index on email — every login lookup searches by email
CREATE INDEX idx_users_email ON users(email);


-- ── Forms ─────────────────────────────────────────────────────
-- Stores form definitions created in the builder.
-- `steps` is the full step/field tree serialised as JSON text.
-- `embed_key` is the public key used in the <script> tag.
CREATE TABLE forms (
  id                   UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWID(),
  owner_id             UNIQUEIDENTIFIER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                NVARCHAR(255)     NOT NULL DEFAULT 'Untitled Form',
  description          NVARCHAR(1000),
  steps                NVARCHAR(MAX)     NOT NULL DEFAULT '[]',
  has_payment_step     BIT               NOT NULL DEFAULT 0,
  payment_amount       INT,                          -- in cents, e.g. 999 = $9.99
  payment_currency     NVARCHAR(10)      DEFAULT 'usd',
  payment_description  NVARCHAR(500),
  is_published         BIT               NOT NULL DEFAULT 0,
  embed_key            NVARCHAR(50)      NOT NULL UNIQUE,
  created_at           DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
  updated_at           DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

-- Index so dashboard queries (list my forms) are fast
CREATE INDEX idx_forms_owner ON forms(owner_id);

-- Index so embed lookups (by embed_key) are fast
CREATE INDEX idx_forms_embed_key ON forms(embed_key);


-- ── Submissions ───────────────────────────────────────────────
-- One row per form submission from the embedded form.
-- `data` is a JSON object mapping fieldId → submitted value.
-- `ip_hash` is a SHA-256 hash of the submitter's IP — stored for
-- abuse detection only. We never store the raw IP (privacy).
CREATE TABLE submissions (
  id                       UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWID(),
  form_id                  UNIQUEIDENTIFIER  NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data                     NVARCHAR(MAX)     NOT NULL,
  stripe_payment_intent_id NVARCHAR(255),
  payment_status           NVARCHAR(20),     -- 'pending' | 'succeeded' | 'failed'
  ip_hash                  NVARCHAR(64),
  submitted_at             DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

-- Index so response dashboard queries (list submissions for a form) are fast
CREATE INDEX idx_submissions_form ON submissions(form_id, submitted_at DESC);


-- ── Refresh tokens ────────────────────────────────────────────
-- Stores hashed refresh tokens for the JWT auth flow.
-- We store the HASH, not the raw token — if this table is ever
-- leaked, attackers cannot use the hashes to log in.
CREATE TABLE refresh_tokens (
  id          UNIQUEIDENTIFIER  PRIMARY KEY DEFAULT NEWID(),
  user_id     UNIQUEIDENTIFIER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  NVARCHAR(255)     NOT NULL UNIQUE,
  expires_at  DATETIME2         NOT NULL,
  created_at  DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_refresh_tokens_hash    ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens(user_id);
