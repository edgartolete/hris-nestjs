import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from 'src/users/user.service';
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
      const { id, username } = user;
      return { userId: id, username };
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
      this.saveRefreshToken(refreshToken, user.userId);

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
    // TODO: sliding expiry; the longer the user used the same device. extend the refresh token expiry from 15 days to 3 months
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRY');

    return await this.jwtService.signAsync(tokenPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiry,
    });
  }

  async saveRefreshToken(token: string, userId: number) {
    // TODO: store the refreshToken to database together with signin metadata e.g, userId, refreshToken, expiry, device, ip, isActive.
  }

  async renewRefreshToken() {
    //TODO: use token rotation
  }
}
