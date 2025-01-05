import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  NotImplementedException,
  Res,
  Body,
  Req,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { TokenAuthGuard } from './guards/token-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RenewRefreshTokenDto } from './dto/refresh-token.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import {
  EmailVerifyRequestDto,
  EmailVerifySubmitDto,
} from './dto/email-verify.dto';
import { RequestWithTokenPayload } from 'src/types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @Get('ip')
  @Get('info')
  async login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.signIn(
      req.user,
      ipAddress,
      userAgent,
    );

    res.cookie('refreshToken', result.refreshToken);

    return { message: 'You are now logged in', data: result };
  }

  @Post('register')
  async register(
    @Req() req: any,
    @Res() res: Response,
    @Body() createUserDto: CreateUserDto,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.register(
      createUserDto,
      ipAddress,
      userAgent,
    );

    res.cookie('refreshToken', result.refreshToken);

    return res
      .status(HttpStatus.CREATED)
      .json({ message: 'User Created.', data: result });
  }

  @UseGuards(TokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req?.headers?.authorization?.split(' ')[1];

    const refreshToken = req.cookies['refreshToken'];

    const success = await this.authService.logout({
      accessToken,
      refreshToken,
    });

    if (!success) {
      throw new HttpException('No existing session.', HttpStatus.BAD_REQUEST);
    }

    res.clearCookie('refreshToken');

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Successfully logged-out.' });
  }

  @Post('refresh')
  async renewRefreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: RenewRefreshTokenDto,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const currentRefreshToken = req.cookies['refreshToken'];

    const token = body.refreshToken || currentRefreshToken || '';

    if (!token) {
      return res.json({ message: 'no token provided' });
    }

    const { accessToken, refreshToken } =
      await this.authService.renewRefreshToken(token, ipAddress, userAgent);

    res.cookie('refreshToken', refreshToken);

    res.status(HttpStatus.CREATED);

    return {
      message: 'Successfully renew RefreshToken.',
      data: {
        accessToken,
        refreshToken,
      },
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenAuthGuard)
  @Post('update-password')
  async updatePassword(
    @Req() req: Request,
    @Body() updatePassword: UpdatePasswordDto,
  ) {
    const accessToken = req?.headers?.authorization?.split(' ')[1];

    const result = await this.authService.updatePassword(
      accessToken,
      updatePassword,
    );

    if (!result.affected) {
      throw new InternalServerErrorException(
        'Failed to update user status in the database.',
      );
    }

    return {
      message: 'Successfully update password:',
    };
  }

  @Post('forgot')
  async forgotPassword() {
    throw new NotImplementedException();
  }

  @UseGuards(TokenAuthGuard)
  @Get('me')
  getSelfInfo(@Req() req: RequestWithTokenPayload) {
    return req.user;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenAuthGuard)
  @Post('email-verify/request')
  async emailVerifySend(
    @Req() req: RequestWithTokenPayload,
    @Body() body?: EmailVerifyRequestDto,
  ) {
    const data = await this.authService.verifyEmailRequest(
      body.email,
      req.user.userId,
    );
    return { message: 'sent', data };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(TokenAuthGuard)
  @Post('email-verify/submit')
  async emailVerifyComplete(
    @Req() req: RequestWithTokenPayload,
    @Body() body: EmailVerifySubmitDto,
  ) {
    const data = await this.authService.verifyEmailSubmit(
      body.code,
      req.user.userId,
    );

    if (!data.affected) {
      throw new InternalServerErrorException(
        'Failed to update user status in the database.',
      );
    }

    return { message: 'Successfully verified via email.' };
  }
}
