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
} from '@nestjs/common';
import { TokenAuthGuard } from './guards/token-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...rest } = await this.authService.signIn(req.user);
    res.cookie('refreshToken', refreshToken);
    return rest;
  }

  @Post('register')
  async register(@Res() res: Response) {
    return res.status(HttpStatus.CREATED).json({ message: 'i made' });
    // throw new NotImplementedException();
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
