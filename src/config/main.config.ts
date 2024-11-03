import { Configuration, Value } from '@itgorillaz/configify';

@Configuration()
export class MainConfiguration {
  @Value('REDIS_URL');
  redisUrl: string;
}
