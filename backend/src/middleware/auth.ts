import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'epettyshop-super-secret-key-2026';

interface JwtPayload {
  tenantId: string;
  tenantName: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.tenantId = decoded.tenantId;
    req.tenantName = decoded.tenantName;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
