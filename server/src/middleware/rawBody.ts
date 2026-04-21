import type { Request, Response, NextFunction } from 'express'

// SECURITY: Stripe webhook signature verification requires the raw, unmodified
// request body as a Buffer. Express's json() middleware consumes and parses the
// body stream — if it runs first, the raw bytes are gone and constructEvent()
// will throw. This middleware captures the raw buffer and attaches it to req
// so the Stripe route can pass it directly to stripe.webhooks.constructEvent().
declare global {
  // Extend Express Request with our custom field
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: Buffer
    }
  }
}

export function rawBodyMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const chunks: Buffer[] = []
  req.on('data', (chunk: Buffer) => chunks.push(chunk))
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks)
    next()
  })
  req.on('error', next)
}
