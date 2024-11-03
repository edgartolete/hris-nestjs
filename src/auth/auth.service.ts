import { Injectable } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { JWT_REFRESH_SECRET } from 'src/config';
import { RedisService } from 'src/redis/redis.service';

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
    const tokenPayload = {
      userId: user.userId,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);
    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret: JWT_REFRESH_SECRET,
      expiresIn: '15d',
    });

    this.redisService.set('test', accessToken);

    return {
      accessToken,
      refreshToken,
      username: user.username,
      userId: user.userId,
    };
  }
}
