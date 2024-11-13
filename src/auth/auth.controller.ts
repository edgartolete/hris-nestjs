import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  NotImplementedException,
  Res,
  Body,
} from '@nestjs/common';
import { TokenAuthGuard } from './guards/token-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @Get('ip')
  @Get('info')
  async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
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
    @Request() req: any,
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

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout() {
    throw new NotImplementedException();
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
  getSelfInfo(@Request() req: any) {
    return req.user;
  }
}
