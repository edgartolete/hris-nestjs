import { Request } from 'express';

export type TokenPayload = {
  userId: number;
  username: string;
  iat: number;
  exp: number;
};

export interface RequestWithTokenPayload extends Request {
  user: TokenPayload;
}

export type ErrorLog = {
  userId?: number;
  context: string;
  method?: string;
  input?: Record<string, any>;
  error: Record<string, any>;
} | null;
