import sql from 'mssql'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Connection pool — mssql manages pooling internally.
// Azure SQL requires `encrypt: true` (enforced by default on Azure).
const poolPromise: Promise<sql.ConnectionPool> = new sql.ConnectionPool(
  process.env.DATABASE_URL
)
  .connect()
  .then((pool) => {
    console.log('Connected to Azure SQL')
    return pool
  })
  .catch((err: unknown) => {
    console.error('Azure SQL connection failed:', err)
    throw err
  })

export { sql, poolPromise }
