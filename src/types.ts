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
