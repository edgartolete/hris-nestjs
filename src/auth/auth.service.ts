import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

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
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
      this.saveAccessToken(accessToken, user.userId);

      const refreshToken = await this.generateRefreshToken(tokenPayload);

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
  async saveAccessToken(token: string, userId: number) {
    await this.cacheManager.set(token, userId, 1000 * 60 * 60); // 1hr
  }

  async generateRefreshToken(tokenPayload: SignInData): Promise<string> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY');

    return await this.jwtService.signAsync(tokenPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiry,
    });
  }

  async saveRefreshToken(token: string) {
    //
  }
}
