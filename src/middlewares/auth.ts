import { type Request, type Response, type NextFunction } from 'express';
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  if (key !== 'secreto-demo') {
    res.status(401).json({ error: 'API key inválida o ausente' });
    return;
  }
  next();
}
