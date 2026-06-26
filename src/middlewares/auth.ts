import { type Request, type Response, type NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';


function base64urlDecode(str: string): string {
  return Buffer.from(
    str.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString('utf8');
}

export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const JWT_SECRET = process.env.JWT_SECRET ?? '';
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return res.status(401).json({ error: 'Token malformado' });
  }

  const headerB64 = parts[0]!;
  const payloadB64 = parts[1]!;
  const sigB64 = parts[2]!;

  try {
    const header = JSON.parse(base64urlDecode(headerB64));

    if (header.alg !== 'HS256') {
      return res.status(401).json({ error: 'Algoritmo no permitido' });
    }
  } catch {
    return res.status(401).json({ error: 'Token malformado' });
  }

  const expectedSig = createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');


  const receivedSigBuffer = Buffer.from(sigB64);
  const expectedSigBuffer = Buffer.from(expectedSig);

  if (
    receivedSigBuffer.length !== expectedSigBuffer.length ||
    !timingSafeEqual(receivedSigBuffer, expectedSigBuffer)
  ) {
    return res.status(401).json({ error: 'Firma invalida' });
  }

  let claims: { exp?: number; sub?: string; scope?: string };

  try {
    claims = JSON.parse(base64urlDecode(payloadB64));
  } catch {
    return res.status(401).json({ error: 'Token malformado' });
  }

  const now = Math.floor(Date.now() / 1000);

  if (claims.exp && claims.exp < now) {
    return res.status(401).json({ error: 'Token expirado' });
  }

  if (!claims.sub) {
    return res.status(401).json({ error: 'Claim sub ausente' });
  }

  (req as Request & { user?: unknown }).user = {
    sub: claims.sub,
    scope: claims.scope ?? ''
  };

  next();
}