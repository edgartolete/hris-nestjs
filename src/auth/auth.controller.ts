import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { TokenAuthGuard } from './guards/token-auth.guard';

@Controller('auth')
export class AuthController {
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return req.user;
  }

  @UseGuards(TokenAuthGuard)
  @Get('me')
  getSelfInfo(@Request() req: any) {
    return req.user;
  }
}
