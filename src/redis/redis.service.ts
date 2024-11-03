import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(key: string, value: any, expirationInSeconds?: number) {
    if (!expirationInSeconds) {
      await this.redisClient.set(key, JSON.stringify(value));
    } else {
      await this.redisClient.set(
        key,
        JSON.stringify(value),
        'EX',
        expirationInSeconds,
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string) {
    await this.redisClient.del(key);
  }
}
