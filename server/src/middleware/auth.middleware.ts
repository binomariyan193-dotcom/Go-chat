import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AuthenticatedRequest, UserPayload } from '../types';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
