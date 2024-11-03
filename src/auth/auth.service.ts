import { Injectable } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto } from './dto/generate-token.dto';

type SignInData = { userId: number; username: string };
type AuthResult = { accessToken: string; userId: number; username: string };

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginUser: LoginUserDto): Promise<SignInData | null> {
    const user = await this.userService.findUserByname(loginUser.username);

    if (user && user.password === loginUser.password) {
      return user;
    }

    return null;
  }

  async signIn(user: GenerateTokenDto): Promise<AuthResult> {
    const tokenPayload = {
      userId: user.userId,
      username: user.username,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return { accessToken, username: user.username, userId: user.userId };
  }
}
