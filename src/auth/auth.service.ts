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
import { CreateSessionDto } from 'src/sessions/dto/create-session.dto';
import { addDays } from 'date-fns';
import { SessionsService } from 'src/sessions/sessions.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

type SignInData = { userId: number; username: string };
type AuthResult = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  result?: any;
};

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionService: SessionsService,
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

  async signIn(
    user: GenerateTokenDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResult> {
    const tokenPayload: SignInData = {
      userId: user.userId,
      username: user.username,
    };

    try {
      const accessToken = await this.jwtService.signAsync(tokenPayload);
      this.saveAccessToken(accessToken, user.userId);

      const refreshToken = await this.generateRefreshToken(tokenPayload);

      const { identifiers } = await this.saveRefreshToken({
        refreshToken,
        userId: user.userId,
        ipAddress,
        userAgent,
        expiryDate: addDays(new Date(), 15),
      });

      if (!Array.isArray(identifiers) || identifiers.length === 0) {
        throw new InternalServerErrorException('refreshToken inserting failed');
      }

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

  async register(createUser: CreateUserDto) {
    const { password, ...rest } = createUser;

    // const hashed = await bcrypt.hash(password, 10);

    const newUser = { password, ...rest };

    const { identifiers } = await this.userService.create(newUser);

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      throw new InternalServerErrorException('register failed');
    }
  }

  async saveAccessToken(token: string, userId: number) {
    await this.cacheManager.set(token, userId, 1000 * 60 * 60); // 1hr TTL
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

  async saveRefreshToken(createSession: CreateSessionDto) {
    return await this.sessionService.create(createSession);
  }

  async renewRefreshToken() {
    //TODO: use token rotation
  }
}
