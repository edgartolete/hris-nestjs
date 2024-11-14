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
} from '@nestjs/common';
import { TokenAuthGuard } from './guards/token-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @Get('ip')
  @Get('info')
  async login(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const { refreshToken, ...rest } = await this.authService.signIn(
      req.user,
      ipAddress,
      userAgent,
    );

    res.cookie('refreshToken', refreshToken);

    return rest;
  }

  @Post('register')
  async register(
    @Req() req: any,
    @Res() res: Response,
    @Body() createUserDto: CreateUserDto,
  ) {
    const ipAddress = req.headers['x-forwarded-for'] || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    const { refreshToken, ...rest } = await this.authService.register(
      createUserDto,
      ipAddress,
      userAgent,
    );

    res.cookie('refreshToken', refreshToken);

    return res
      .status(HttpStatus.CREATED)
      .json({ message: 'User Created.', content: rest });
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

  @Post('verify')
  async verifyRefreshToken() {
    throw new NotImplementedException();
  }

  @Post('forgot')
  async forgotPassword() {
    throw new NotImplementedException();
  }

  @UseGuards(TokenAuthGuard)
  @Get('me')
  getSelfInfo(@Req() req: Request) {
    return req.user;
  }
}
