import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { RedisService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';

type SignInData = { userId: number; username: string };
type AuthResult = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
};

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async validateUser(loginUser: LoginUserDto): Promise<SignInData | null> {
    const user = await this.userService.findUserByname(loginUser.username);

    if (user && user.password === loginUser.password) {
      const { userId, username } = user;
      return { userId, username };
    }
    return null;
  }

  async signIn(user: GenerateTokenDto): Promise<AuthResult> {
    const tokenPayload: SignInData = {
      userId: user.userId,
      username: user.username,
    };

    try {
      const accessToken = await this.jwtService.signAsync(tokenPayload);

      const refreshToken =
        await this.generateAndStoreRefreshToken(tokenPayload);

      return {
        accessToken,
        refreshToken,
        username: user.username,
        userId: user.userId,
      };
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async generateAndStoreRefreshToken(tokenPayload: SignInData) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY');

    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiry,
    });

    this.redisService.set(
      tokenPayload.userId.toString(),
      refreshToken,
      60 * 60 * 24 * 15,
    ); // 15 days expiry

    return refreshToken;
  }
}
