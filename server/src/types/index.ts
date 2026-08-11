import { Request } from 'express';

export interface UserPayload {
  id: string;
  username: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}
