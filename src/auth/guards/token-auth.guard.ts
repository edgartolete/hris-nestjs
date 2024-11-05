import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context?.switchToHttp()?.getRequest();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const isStoredTokenExist = await this.cacheManager.get(token);

    if (!isStoredTokenExist) {
      throw new UnauthorizedException(
        "Invalid Token. Doesn't exist in system.",
      );
    }

    try {
      const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const tokenPayload = await this.jwtService.verifyAsync(token, {
        secret: accessSecret,
      });

      request['user'] = tokenPayload;
    } catch (err) {
      if ((err as Error).name === 'TokenExpiredError') {
        throw new UnauthorizedException('Expired Token');
      }

      if ((err as Error).name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid Token');
      }

      throw new UnauthorizedException((err as Error).message);
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request?.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
