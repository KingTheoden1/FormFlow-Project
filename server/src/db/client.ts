// db/client.ts — Azure SQL connection pool.
//
// Why a connection pool?
// Opening a database connection is slow (network handshake, auth).
// A pool keeps several connections open and reuses them across requests,
// so each API call doesn't pay that startup cost.
//
// Why lazy (connect on first use)?
// The original version connected immediately on import, which caused the
// server to crash at startup if DATABASE_URL wasn't set — even in CI or
// during local development without a database. The lazy pattern lets the
// server start and serve requests that don't need the DB (e.g. /health).

import sql from 'mssql'

let _pool: sql.ConnectionPool | null = null

// Call this inside any route handler that needs the database.
// It returns the same pool on every call after the first connection.
export async function getPool(): Promise<sql.ConnectionPool> {
  if (_pool) return _pool

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'See .env.example for the required format.'
    )
  }

  _pool = await new sql.ConnectionPool(url).connect()
  console.log('✓ Connected to Azure SQL')
  return _pool
}

// Re-export sql so routes can use sql.NVarChar, sql.UniqueIdentifier etc.
// for typed query parameters.
export { sql }
