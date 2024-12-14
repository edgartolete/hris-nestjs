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
import { UpdateSessionDto } from 'src/sessions/dto/update-session.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

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
    const user = await this.userService.findOneByName(
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

      const { identifiers } = await this.sessionService.create({
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

    const user = await this.userService.findOneByName(username.toLowerCase());

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

    const { identifiers: tokenIdentifiers } = await this.sessionService.create({
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

      const { affected } = await this.sessionService.deactivate(
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

  async renewRefreshToken(
    oldRefreshToken: string,
    ipAddress: string,
    userAgent: string,
  ) {
    try {
      const result =
        await this.sessionService.searchByRefreshToken(oldRefreshToken);

      if (Array.isArray(result) && !result.length) {
        throw new NotFoundException('Refresh Token does not exist in system.');
      }

      const sessionResult = result[0];

      const isExpired = isBefore(sessionResult.expiryDate, new Date());

      if (isExpired) {
        throw new BadRequestException('sessionToken expired.');
      }

      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');

      const { userId, username } = await this.jwtService.verifyAsync(
        sessionResult.refreshToken,
        {
          secret: refreshSecret,
        },
      );

      const refreshToken = await this.generateRefreshToken({
        userId,
        username,
      });

      const tokenPayload: SignInData = {
        userId,
        username,
      };

      const accessToken = await this.jwtService.signAsync(tokenPayload);

      const [res, err] = await this.sessionService.update({
        id: sessionResult.id,
        userId: sessionResult.userId,
        refreshToken,
        ipAddress,
        userAgent,
        expiryDate: addDays(new Date(), 15),
      });

      if (err) {
        throw new InternalServerErrorException('update failed.', err.message);
      }

      return { accessToken, refreshToken };
    } catch (err) {
      throw new InternalServerErrorException(
        'Refreshing token failed.',
        err.message,
      );
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

  async updatePassword(accessToken: string, updatePassword: UpdatePasswordDto) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

    const { userId = 0 } = await this.jwtService.verifyAsync(accessToken, {
      secret: accessSecret,
    });

    const user = await this.userService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    const isVerified = bcrypt.compareSync(
      updatePassword.password,
      user.password,
    );

    if (!isVerified) {
      throw new BadRequestException('Password is incorrect');
    }

    const newPassword = bcrypt.hashSync(updatePassword.newPassword, 10);

    const result = await this.userService.updatePassword(userId, newPassword);

    if (!result?.affected) {
      throw new BadRequestException('failed to update password');
    }

    return result;
  }
}
