import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { addDays, isBefore } from 'date-fns';
import { SessionsService } from 'src/sessions/sessions.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LogoutUserDto } from './dto/logout-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { EmailTemplateEnum, UtilsService } from 'src/utils/utils.service';
import { ForgotPasswordRequestDto } from './dto/forgot-password.dto';

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
    private utilsService: UtilsService,
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

    const accessToken = await this.jwtService.signAsync(tokenPayload);
    this.saveAccessToken(accessToken, user.userId);

    const refreshToken = await this.generateRefreshToken(tokenPayload);

    const refreshTokenExpiry = addDays(new Date(), 15);

    const sessionData = {
      accessToken,
      refreshToken,
      username: user.username,
      userId: user.userId,
    };

    const updateData = {
      refreshToken,
      userId: user.userId,
      ipAddress,
      userAgent,
      expiryDate: refreshTokenExpiry,
    };

    const [err, res] =
      await this.sessionService.updateStoredRefreshToken(updateData);

    if (err) {
      throw new InternalServerErrorException(err);
    }

    if (res.affected > 0) {
      return sessionData;
    }

    const [error] = await this.sessionService.create(updateData);

    if (error) {
      throw new InternalServerErrorException(error);
    }

    return sessionData;
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
    await this.saveAccessToken(accessToken, identifiers[0].id);

    const refreshToken = await this.generateRefreshToken(payload);

    const [err] = await this.sessionService.create({
      userId: identifiers[0].id,
      refreshToken,
      ipAddress,
      userAgent,
      expiryDate: addDays(new Date(), 15),
    });

    if (err) {
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
    const result = await this.sessionService.searchByRefreshTokenAndAgent(
      oldRefreshToken,
      userAgent,
    );

    if (!result) {
      throw new BadRequestException('No active refresh token found.');
    }

    const isExpired = isBefore(result.expiryDate, new Date());

    if (isExpired) {
      throw new BadRequestException('sessionToken expired.');
    }

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    const { userId, username } = await this.jwtService.verifyAsync(
      result.refreshToken,
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

    const [err] = await this.sessionService.update({
      id: result.id,
      refreshToken,
      ipAddress,
      expiryDate: addDays(new Date(), 15),
    });

    if (err) {
      throw new InternalServerErrorException('update failed.', err.message);
    }

    this.saveAccessToken(accessToken, userId);

    return { accessToken, refreshToken };
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

  async verifyEmailRequest(email: string | undefined, userId: number) {
    const storedCode = await this.cacheManager.get(`email-verify-${userId}`);

    if (storedCode) {
      throw new BadRequestException(
        'Code was just recently sent to your email.',
      );
    }

    let recipient = email;

    const user = await this.userService.findOneById(userId);

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (!email) {
      recipient = user.email;
    }

    const random6 = this.utilsService.generateRandom6DigitNumber();

    const { data, error } = await this.utilsService.sendEmail(
      [recipient],
      EmailTemplateEnum.VERIFY_EMAIL,
      random6,
    );

    if (error) {
      throw new InternalServerErrorException(
        `Failed to send email: ${JSON.stringify(error)}`,
      );
    }

    await this.cacheManager.set(
      `email-verify-${userId}`,
      random6,
      1000 * 60 * 3,
    ); // 3 minutes TTL

    return data;
  }

  async verifyEmailSubmit(code: string, userId: number) {
    const storedCode = await this.cacheManager.get(`email-verify-${userId}`);

    if (!storedCode) {
      throw new BadRequestException('Email is incorrect, or Code expired');
    }

    if (code !== storedCode) {
      throw new BadRequestException('Code is incorrect');
    }

    this.cacheManager.del(`email-verify-${userId}`);

    return await this.userService.updateEmailVerifiedStatus(userId, true);
  }

  async forgotEmailRequest(b: ForgotPasswordRequestDto) {
    const storedCode = await this.cacheManager.get(
      `forgot-password-${b.email}`,
    );

    if (storedCode) {
      throw new BadRequestException(
        'Code was just recently sent to your email.',
      );
    }

    const user = await this.userService.findOneByEmail(b.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const random6 = this.utilsService.generateRandom6DigitNumber();

    this.cacheManager.set(`forgot-password-${b.email}`, random6, 1000 * 60 * 3);

    const { data, error } = await this.utilsService.sendEmail(
      b.email,
      EmailTemplateEnum.FORGOT_EMAIL,
      random6,
    );

    if (error) {
      throw new InternalServerErrorException(
        `Failed to send email: ${JSON.stringify(error)}`,
      );
    }

    return data;
  }

  async forgotPasswordSubmit(
    email: string,
    code: string,
    password: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const storedCode = await this.cacheManager.get(`forgot-password-${email}`);

    if (!storedCode) {
      throw new BadRequestException('Email is incorrect, or Code expired');
    }

    if (code !== storedCode) {
      throw new BadRequestException('Code is incorrect');
    }

    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newPassword = bcrypt.hashSync(password, 10);

    const result = await this.userService.updatePassword(user.id, newPassword);

    if (!result?.affected) {
      throw new BadRequestException('failed to update password');
    }

    const tokenPayload: SignInData = {
      userId: user.id,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    this.saveAccessToken(accessToken, user.id);

    const refreshToken = await this.generateRefreshToken(tokenPayload);

    const sessionData = {
      accessToken,
      refreshToken,
      username: user.username,
      userId: user.id,
    };

    const refreshTokenExpiry = addDays(new Date(), 15);

    const updateData = {
      refreshToken,
      userId: user.id,
      ipAddress,
      userAgent,
      expiryDate: refreshTokenExpiry,
    };

    this.cacheManager.del(`forgot-password-${email}`);

    const [err, res] =
      await this.sessionService.updateStoredRefreshToken(updateData);

    if (err) {
      throw new InternalServerErrorException(err);
    }

    if (res.affected > 0) {
      return sessionData;
    }

    const [error] = await this.sessionService.create(updateData);

    if (error) {
      throw new InternalServerErrorException(error);
    }

    return sessionData;
  }
}
