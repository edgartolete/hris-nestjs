import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from 'src/users/user.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateSessionDto } from 'src/sessions/dto/create-session.dto';
import { addDays, isBefore } from 'date-fns';
import { SessionsService } from 'src/sessions/sessions.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LogoutUserDto } from './dto/logout-user.dto';

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
    const user = await this.userService.findUserByname(
      loginUser.username.toLowerCase(),
    );

    if (!user) return null;

    const isVerified = bcrypt.compareSync(loginUser.password, user.password);

    if (!isVerified) return null;

    const { id, username } = user;
    return { userId: id, username };
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

  async register(
    createUser: CreateUserDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { username, password, ...rest } = createUser;

    const user = await this.userService.findUserByname(username.toLowerCase());

    if (user) throw new ConflictException('User already exist!');

    const hashed = bcrypt.hashSync(password, 10);

    const newUser = {
      ...rest,
      username: username.toLowerCase(),
      password: hashed,
    };

    const { identifiers } = await this.userService.create(newUser);

    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      throw new InternalServerErrorException('register failed');
    }

    const payload = {
      userId: identifiers[0].id,
      username,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    this.saveAccessToken(accessToken, identifiers[0].id);

    const refreshToken = await this.generateRefreshToken(payload);

    const { identifiers: tokenIdentifiers } = await this.saveRefreshToken({
      userId: identifiers[0].id,
      refreshToken,
      ipAddress,
      userAgent,
      expiryDate: addDays(new Date(), 15),
    });

    if (!Array.isArray(tokenIdentifiers) || tokenIdentifiers.length === 0) {
      throw new InternalServerErrorException('refreshToken inserting failed');
    }

    return {
      accessToken,
      refreshToken,
      ...payload,
    };
  }

  async logout(logoutUserDto: LogoutUserDto) {
    try {
      await this.cacheManager.del(logoutUserDto.accessToken);

      const { affected } = await this.invalidateRefreshToken(
        logoutUserDto.refreshToken,
      );

      return affected;
    } catch (err) {
      throw new InternalServerErrorException('Logout failed.', err);
    }
  }

  async saveAccessToken(token: string, userId: number) {
    await this.cacheManager.set(token, userId, 1000 * 60 * 60); // 1hr TTL
  }

  async refresh(refreshToken: string) {
    try {
      const result =
        await this.sessionService.searchByRefreshToken(refreshToken);

      if (Array.isArray(result) && !result.length) {
        throw new NotFoundException('Refresh Token does not exist in system.');
      }

      const isExpired = isBefore(result[0].expiryDate, new Date());

      if (isExpired) {
        throw new BadRequestException('sessionToken expired.');
      }

      return { result };
    } catch (err) {
      throw new InternalServerErrorException('Refreshing token failed.', err);
    }
  }

  async generateRefreshToken(tokenPayload: SignInData): Promise<string> {
    // TODO: sliding expiry; the longer the user used the same device. extend the refresh token expiry from 15 days to 3 months
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      const refreshExpiry =
        this.configService.get<string>('JWT_REFRESH_EXPIRY');

      return await this.jwtService.signAsync(tokenPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiry,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        'Generating refreshToken failed.',
        err,
      );
    }
  }

  async saveRefreshToken(createSession: CreateSessionDto) {
    try {
      return await this.sessionService.create(createSession);
    } catch (err) {
      throw new InternalServerErrorException(
        'Saving refresh token failed.',
        err,
      );
    }
  }

  async renewRefreshToken() {
    //TODO: use token rotation
  }

  async invalidateRefreshToken(refreshToken: string) {
    return await this.sessionService.deactivate(refreshToken);
  }
}
